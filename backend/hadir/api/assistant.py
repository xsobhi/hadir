"""The assistant over HTTP: conversation threads, and each turn streamed to the browser as server-sent events."""
from __future__ import annotations

import json
import secrets
import threading
from datetime import timedelta
from typing import Iterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from pydantic import BaseModel, Field

from ..agent.graph import assistant_graph
from ..agent.transcript import event_from, transcript
from ..auth import current_user
from ..config import AGENT_DAILY_GLOBAL, AGENT_DAILY_PER_USER
from ..db import now_iso, tx
from ..ratelimit import hit

router = APIRouter(prefix="/api/assistant")
_busy: set[str] = set()
_busy_lock = threading.Lock()


class Ask(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    lang: str = "ar"


class Decide(BaseModel):
    approved: bool
    lang: str = "ar"


def _own_thread(db, owner_id: int, thread_id: str) -> dict:
    row = db.execute("SELECT * FROM agent_threads WHERE id = ? AND owner_id = ?", (thread_id, owner_id)).fetchone()
    if not row:
        raise HTTPException(404, "thread_not_found")
    return row


def _config(user: dict, thread_id: str, lang: str) -> dict:
    return {"configurable": {"thread_id": thread_id, "owner_id": user["id"], "lang": "en" if lang == "en" else "ar",
                             "professor": user["name"], "title": user["title"]},
            "recursion_limit": 24}


def _sse(stream: Iterator[dict], thread_id: str, config: dict) -> Iterator[str]:
    try:
        for ev in stream:
            yield f"data: {json.dumps(ev, ensure_ascii=False)}\n\n"
        snapshot = assistant_graph.get_state(config)
        pending = [i.value for i in snapshot.interrupts] if snapshot.interrupts else []
        yield f"data: {json.dumps({'type': 'done', 'pending': pending[0] if pending else None}, ensure_ascii=False)}\n\n"
    except Exception as exc:  # the browser shows this inside the conversation, with a retry
        yield f"data: {json.dumps({'type': 'error', 'message': type(exc).__name__})}\n\n"
    finally:
        with _busy_lock:
            _busy.discard(thread_id)
        with tx() as db:
            db.execute("UPDATE agent_threads SET updated_at = ? WHERE id = ?", (now_iso(), thread_id))


def _run(graph_input, config: dict, thread_id: str) -> StreamingResponse:
    with _busy_lock:
        if thread_id in _busy:
            raise HTTPException(409, "thread_busy")
        _busy.add(thread_id)
    raw = assistant_graph.stream(graph_input, config, stream_mode=["messages", "updates", "custom"])
    events = (e for item in raw for e in event_from(*item))
    return StreamingResponse(_sse(events, thread_id, config), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/threads")
def threads(user: dict = Depends(current_user)):
    with tx() as db:
        rows = db.execute("SELECT id, title, updated_at AS updatedAt FROM agent_threads WHERE owner_id = ? "
                          "ORDER BY updated_at DESC LIMIT 30", (user["id"],)).fetchall()
    return {"threads": rows}


@router.post("/threads")
def new_thread(user: dict = Depends(current_user)):
    thread_id = secrets.token_hex(12)
    stamp = now_iso()
    with tx() as db:
        db.execute("INSERT INTO agent_threads (id, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?)",
                   (thread_id, user["id"], stamp, stamp))
    return {"id": thread_id}


@router.get("/threads/{thread_id}")
def thread(thread_id: str, user: dict = Depends(current_user)):
    with tx() as db:
        _own_thread(db, user["id"], thread_id)
    snapshot = assistant_graph.get_state(_config(user, thread_id, "ar"))
    pending = [i.value for i in snapshot.interrupts] if snapshot.interrupts else []
    return {"items": transcript(snapshot.values.get("messages", [])), "pending": pending[0] if pending else None}


@router.post("/threads/{thread_id}/messages")
def ask(thread_id: str, body: Ask, user: dict = Depends(current_user)):
    with tx() as db:
        row = _own_thread(db, user["id"], thread_id)
        if not row["title"]:
            db.execute("UPDATE agent_threads SET title = ? WHERE id = ?", (body.message.strip()[:80], thread_id))
    config = _config(user, thread_id, body.lang)
    if assistant_graph.get_state(config).interrupts:
        raise HTTPException(409, "approval_pending")
    if not hit("agent", str(user["id"]), AGENT_DAILY_PER_USER, timedelta(days=1)):
        raise HTTPException(429, "daily_limit")
    if not hit("agent_all", "all", AGENT_DAILY_GLOBAL, timedelta(days=1)):
        raise HTTPException(429, "site_limit")
    return _run({"messages": [HumanMessage(body.message.strip())]}, config, thread_id)


@router.post("/threads/{thread_id}/resume")
def resume(thread_id: str, body: Decide, user: dict = Depends(current_user)):
    with tx() as db:
        _own_thread(db, user["id"], thread_id)
    config = _config(user, thread_id, body.lang)
    if not assistant_graph.get_state(config).interrupts:
        raise HTTPException(409, "nothing_pending")
    return _run(Command(resume={"approved": body.approved}), config, thread_id)


@router.delete("/threads/{thread_id}")
def delete_thread(thread_id: str, user: dict = Depends(current_user)):
    with tx() as db:
        _own_thread(db, user["id"], thread_id)
        db.execute("DELETE FROM agent_threads WHERE id = ?", (thread_id,))
    assistant_graph.checkpointer.delete_thread(thread_id)
    return {"ok": True}
