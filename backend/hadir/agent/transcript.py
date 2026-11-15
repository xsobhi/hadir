"""Turns LangGraph's stream and stored messages into the small event shapes the web client renders."""
from __future__ import annotations

import json
from typing import Any, Iterator

from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, HumanMessage, ToolMessage


def _tool_summary(msg: ToolMessage) -> dict:
    text = msg.content if isinstance(msg.content, str) else json.dumps(msg.content, ensure_ascii=False)
    ok = getattr(msg, "status", "success") != "error" and '"error"' not in text[:200]
    item: dict[str, Any] = {"type": "tool_result", "name": msg.name, "ok": ok, "callId": msg.tool_call_id}
    if msg.name == "draft_warning_notice" and ok:
        try:
            data = json.loads(text)
            item["notice"] = {"text": data.get("notice", ""), "rounds": data.get("critique_rounds", 0),
                              "student": data.get("student_number"), "course": data.get("course")}
        except (ValueError, TypeError):
            pass
    return item


def event_from(mode: str, chunk: Any) -> Iterator[dict]:
    """One raw (mode, chunk) pair from graph.stream(..., stream_mode=[messages, updates, custom])."""
    if mode == "messages":
        msg, meta = chunk
        # Only the agent's own words stream as text; tool-internal model calls (the reflection loop) do not.
        if meta.get("langgraph_node") == "agent" and isinstance(msg, AIMessageChunk) and msg.content:
            yield {"type": "token", "text": msg.content if isinstance(msg.content, str) else ""}
    elif mode == "updates":
        for node, update in chunk.items():
            if node == "__interrupt__":
                for intr in update:
                    yield {"type": "approval", "pending": intr.value}
                continue
            for msg in (update or {}).get("messages", []) if isinstance(update, dict) else []:
                if isinstance(msg, AIMessage) and msg.tool_calls:
                    for tc in msg.tool_calls:
                        yield {"type": "tool_call", "name": tc["name"], "args": tc["args"], "callId": tc["id"]}
                elif isinstance(msg, ToolMessage):
                    yield _tool_summary(msg)
    elif mode == "custom" and isinstance(chunk, dict):
        yield chunk


def transcript(messages: list[BaseMessage]) -> list[dict]:
    """The stored conversation, in the same shapes as the live events, for reloading a thread."""
    items: list[dict] = []
    for m in messages:
        if isinstance(m, HumanMessage):
            items.append({"type": "user", "text": m.content})
        elif isinstance(m, AIMessage):
            if m.content:
                items.append({"type": "assistant", "text": m.content})
            for tc in m.tool_calls or []:
                items.append({"type": "tool_call", "name": tc["name"], "args": tc["args"], "callId": tc["id"]})
        elif isinstance(m, ToolMessage):
            items.append(_tool_summary(m))
    return items
