"""Lookups that enforce ownership: a professor only ever reaches their own rows."""
from __future__ import annotations

from fastapi import HTTPException


def own_course(db, owner_id: int, course_id: int) -> dict:
    course = db.execute("SELECT * FROM courses WHERE id = ? AND owner_id = ?", (course_id, owner_id)).fetchone()
    if not course:
        raise HTTPException(404, "course_not_found")
    return course


def own_session(db, owner_id: int, session_id: int) -> tuple[dict, dict]:
    session = db.execute(
        "SELECT cs.* FROM class_sessions cs JOIN courses c ON c.id = cs.course_id WHERE cs.id = ? AND c.owner_id = ?",
        (session_id, owner_id),
    ).fetchone()
    if not session:
        raise HTTPException(404, "session_not_found")
    return session, own_course(db, owner_id, session["course_id"])


def own_student(db, owner_id: int, student_id: int) -> dict:
    student = db.execute("SELECT * FROM students WHERE id = ? AND owner_id = ?", (student_id, owner_id)).fetchone()
    if not student:
        raise HTTPException(404, "student_not_found")
    return student


def student_public(s: dict) -> dict:
    return {"id": s["id"], "number": s["number"], "nameAr": s["name_ar"], "nameEn": s["name_en"],
            "major": s["major"], "year": s["year"]}
