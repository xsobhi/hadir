"""Courses: the list, one course with its register, settings, and the roster."""
from __future__ import annotations

import re
import sqlite3

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from ..auth import current_user
from ..db import now, tx
from ..sessions import next_meeting
from ..stats import course_public, course_summary, session_rates, student_summaries
from .common import own_course

router = APIRouter(prefix="/api/courses")
TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class CourseIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    code: str = Field(min_length=2, max_length=16)
    nameAr: str = Field(min_length=2, max_length=120)
    nameEn: str = Field(default="", max_length=120)
    section: str = Field(default="1", max_length=8)
    room: str = Field(default="", max_length=40)
    days: list[int] = Field(min_length=1, max_length=7)
    startTime: str = "08:00"
    durationMin: int = Field(default=90, ge=30, le=240)
    termWeeks: int = Field(default=16, ge=4, le=30)
    absenceLimitPct: int = Field(default=25, ge=5, le=60)
    lateAfterMin: int = Field(default=10, ge=0, le=60)


def _validate(body: CourseIn) -> str:
    if not TIME.match(body.startTime) or any(d < 0 or d > 6 for d in body.days):
        raise HTTPException(422, "bad_schedule")
    return ",".join(str(d) for d in sorted(set(body.days)))


def _unique_write(db, query: str, values: tuple):
    try:
        return db.execute(query, values)
    except sqlite3.IntegrityError as exc:
        if "UNIQUE constraint failed: courses.owner_id, courses.code, courses.section" in str(exc):
            raise HTTPException(409, "course_exists") from exc
        raise


@router.get("")
def list_courses(user: dict = Depends(current_user)):
    with tx() as db:
        courses = db.execute("SELECT * FROM courses WHERE owner_id = ? ORDER BY code", (user["id"],)).fetchall()
        return {"courses": [
            {**course_public(c), "summary": course_summary(db, c), "next": next_meeting(db, c),
             "open": db.execute("SELECT id FROM class_sessions WHERE course_id = ? AND status = 'open'",
                                (c["id"],)).fetchone()}
            for c in courses
        ]}


@router.post("")
def create_course(body: CourseIn, user: dict = Depends(current_user)):
    days = _validate(body)
    with tx() as db:
        if db.execute("SELECT COUNT(*) AS n FROM courses WHERE owner_id = ?", (user["id"],)).fetchone()["n"] >= 30:
            raise HTTPException(409, "too_many_courses")
        course_id = _unique_write(db,
            "INSERT INTO courses (owner_id, code, name_ar, name_en, section, room, days, start_time, duration_min,"
            " term_start, term_weeks, absence_limit_pct, late_after_min) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (user["id"], body.code.strip().upper(), body.nameAr.strip(), body.nameEn.strip() or body.nameAr.strip(),
             body.section.strip() or "1", body.room.strip(), days, body.startTime, body.durationMin,
             now().date().isoformat(), body.termWeeks, body.absenceLimitPct, body.lateAfterMin),
        ).lastrowid
    return {"id": course_id}


@router.patch("/{course_id}")
def update_course(course_id: int, body: CourseIn, user: dict = Depends(current_user)):
    days = _validate(body)
    with tx() as db:
        own_course(db, user["id"], course_id)
        _unique_write(db,
            "UPDATE courses SET code=?, name_ar=?, name_en=?, section=?, room=?, days=?, start_time=?, duration_min=?,"
            " term_weeks=?, absence_limit_pct=?, late_after_min=? WHERE id = ?",
            (body.code.strip().upper(), body.nameAr.strip(), body.nameEn.strip() or body.nameAr.strip(),
             body.section.strip() or "1", body.room.strip(), days, body.startTime, body.durationMin,
             body.termWeeks, body.absenceLimitPct, body.lateAfterMin, course_id),
        )
    return {"ok": True}


@router.delete("/{course_id}")
def delete_course(course_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        own_course(db, user["id"], course_id)
        db.execute("DELETE FROM courses WHERE id = ?", (course_id,))
    return {"ok": True}


@router.get("/{course_id}")
def course_detail(course_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        course = own_course(db, user["id"], course_id)
        sessions = session_rates(db, course_id)
        students = student_summaries(db, course)
        marks = db.execute(
            "SELECT a.session_id, a.student_id, a.status FROM attendance a JOIN class_sessions cs ON cs.id = a.session_id "
            "WHERE cs.course_id = ? AND cs.status = 'closed'", (course_id,),
        ).fetchall()
        open_row = db.execute("SELECT id FROM class_sessions WHERE course_id = ? AND status = 'open'",
                              (course_id,)).fetchone()
        summary = course_summary(db, course)
        upcoming = next_meeting(db, course)
    # The register: one compact string per student, a letter per closed session in date order.
    letter = {"present": "P", "late": "L", "absent": "A", "excused": "E"}
    index = {s["id"]: i for i, s in enumerate(sessions)}
    grid = {s["id"]: ["-"] * len(sessions) for s in students}
    for m in marks:
        if m["student_id"] in grid and m["session_id"] in index:
            grid[m["student_id"]][index[m["session_id"]]] = letter[m["status"]]
    return {
        "course": course_public(course), "summary": summary, "next": upcoming,
        "openSessionId": open_row["id"] if open_row else None,
        "sessions": sessions,
        "students": [{**s, "register": "".join(grid[s["id"]])} for s in students],
    }
