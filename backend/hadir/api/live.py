"""The class in progress: open it, scan cards, correct a mark, close it."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import current_user
from ..db import tx
from ..sessions import close_session, open_session, scan, set_mark
from ..stats import course_public
from .common import own_course, own_session, own_student

router = APIRouter(prefix="/api")


class OpenIn(BaseModel):
    topic: str = Field(default="", max_length=120)


class ScanIn(BaseModel):
    code: str = Field(min_length=1, max_length=64)


class MarkIn(BaseModel):
    studentId: int
    status: Literal["present", "late", "absent", "excused"] | None
    note: str = Field(default="", max_length=200)


def _state(db, session: dict, course: dict) -> dict:
    roster = db.execute(
        "SELECT s.id, s.number, s.name_ar, s.name_en, s.gender, a.status, a.marked_at, a.method, a.note "
        "FROM enrollments e JOIN students s ON s.id = e.student_id "
        "LEFT JOIN attendance a ON a.student_id = s.id AND a.session_id = ? WHERE e.course_id = ? "
        "ORDER BY s.name_en", (session["id"], course["id"]),
    ).fetchall()
    people = [{"id": r["id"], "number": r["number"], "nameAr": r["name_ar"], "nameEn": r["name_en"], "gender": r["gender"],
               "status": r["status"], "markedAt": r["marked_at"], "method": r["method"], "note": r["note"]}
              for r in roster]
    counts = {k: sum(1 for p in people if p["status"] == k) for k in ("present", "late", "absent", "excused")}
    return {
        "session": {"id": session["id"], "startsAt": session["starts_at"], "topic": session["topic"],
                    "status": session["status"], "closedAt": session["closed_at"]},
        "course": course_public(course), "enrolled": len(people), "counts": counts,
        "waiting": sum(1 for p in people if p["status"] is None), "roster": people,
    }


@router.post("/courses/{course_id}/sessions")
def start(course_id: int, body: OpenIn, user: dict = Depends(current_user)):
    with tx() as db:
        course = own_course(db, user["id"], course_id)
        session = open_session(db, course, body.topic)
    return {"id": session["id"]}


@router.get("/sessions/{session_id}")
def state(session_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        session, course = own_session(db, user["id"], session_id)
        return _state(db, session, course)


@router.post("/sessions/{session_id}/scan")
def scan_card(session_id: int, body: ScanIn, user: dict = Depends(current_user)):
    with tx() as db:
        session, course = own_session(db, user["id"], session_id)
        if session["status"] != "open":
            raise HTTPException(409, "session_closed")
        result = scan(db, user["id"], session, course, body.code)
        return {**result, "state": _state(db, session, course)}


@router.post("/sessions/{session_id}/mark")
def mark(session_id: int, body: MarkIn, user: dict = Depends(current_user)):
    with tx() as db:
        session, course = own_session(db, user["id"], session_id)
        own_student(db, user["id"], body.studentId)
        if session["status"] == "closed" and body.status is None:
            raise HTTPException(409, "closed_needs_status")
        set_mark(db, session_id, body.studentId, body.status, body.note)
        return _state(db, session, course)


@router.post("/sessions/{session_id}/close")
def close(session_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        session, course = own_session(db, user["id"], session_id)
        if session["status"] != "open":
            raise HTTPException(409, "session_closed")
        absent = close_session(db, session, course)
        session = db.execute("SELECT * FROM class_sessions WHERE id = ?", (session_id,)).fetchone()
        return {"markedAbsent": absent, **_state(db, session, course)}


@router.delete("/sessions/{session_id}")
def discard(session_id: int, user: dict = Depends(current_user)):
    """Throw away a session opened by mistake. Only an open one can be discarded."""
    with tx() as db:
        session, _ = own_session(db, user["id"], session_id)
        if session["status"] != "open":
            raise HTTPException(409, "session_closed")
        db.execute("DELETE FROM class_sessions WHERE id = ?", (session_id,))
    return {"ok": True}
