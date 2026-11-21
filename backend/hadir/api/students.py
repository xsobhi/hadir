"""Students across all courses: the searchable list and one student's record."""
from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from ..auth import current_user
from ..db import tx
from ..stats import allowed_absences, level, student_summaries
from .common import own_student, student_public
from .student_input import StudentIn

router = APIRouter(prefix="/api")


@router.patch("/students/{student_id}")
def update_student(student_id: int, body: StudentIn, user: dict = Depends(current_user)):
    with tx() as db:
        own_student(db, user["id"], student_id)
        try:
            db.execute(
                "UPDATE students SET number=?, name_ar=?, name_en=?, major=?, year=?, gender=? WHERE id=?",
                (body.number, body.nameAr, body.nameEn or body.nameAr, body.major, body.year, body.gender, student_id),
            )
        except sqlite3.IntegrityError as exc:
            if "UNIQUE constraint failed: students.owner_id, students.number" in str(exc):
                raise HTTPException(409, "student_number_exists") from exc
            raise
    return {"ok": True}


@router.delete("/students/{student_id}")
def delete_student(student_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        own_student(db, user["id"], student_id)
        # Foreign keys remove this student's enrollments, marks and saved notices in the same transaction.
        db.execute("DELETE FROM students WHERE id=?", (student_id,))
    return {"ok": True}


@router.get("/students")
def list_students(user: dict = Depends(current_user)):
    """Every student with one row per course they take; the client filters and searches."""
    with tx() as db:
        courses = db.execute("SELECT * FROM courses WHERE owner_id = ? ORDER BY code", (user["id"],)).fetchall()
        rows = []
        for c in courses:
            for s in student_summaries(db, c):
                rows.append({**s, "courseId": c["id"], "courseCode": c["code"]})
        orphans = db.execute(
            "SELECT * FROM students s WHERE owner_id = ? AND NOT EXISTS "
            "(SELECT 1 FROM enrollments e WHERE e.student_id = s.id)", (user["id"],),
        ).fetchall()
    return {"rows": rows, "unenrolled": [student_public(s) for s in orphans],
            "courses": [{"id": c["id"], "code": c["code"], "nameAr": c["name_ar"], "nameEn": c["name_en"]}
                        for c in courses]}


@router.get("/students/{student_id}")
def student_record(student_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        student = own_student(db, user["id"], student_id)
        courses = db.execute(
            "SELECT c.* FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.student_id = ? ORDER BY c.code",
            (student_id,),
        ).fetchall()
        record = []
        for c in courses:
            history = db.execute(
                "SELECT cs.id AS sessionId, cs.starts_at AS startsAt, cs.topic, a.status, a.marked_at AS markedAt, "
                "a.note FROM class_sessions cs LEFT JOIN attendance a ON a.session_id = cs.id AND a.student_id = ? "
                "WHERE cs.course_id = ? AND cs.status = 'closed' ORDER BY cs.starts_at",
                (student_id, c["id"]),
            ).fetchall()
            used = sum(1 for h in history if h["status"] == "absent")
            allowed = allowed_absences(c)
            record.append({
                "courseId": c["id"], "code": c["code"], "nameAr": c["name_ar"], "nameEn": c["name_en"],
                "lateAfterMin": c["late_after_min"], "allowed": allowed, "absent": used,
                "late": sum(1 for h in history if h["status"] == "late"),
                "excused": sum(1 for h in history if h["status"] == "excused"),
                "present": sum(1 for h in history if h["status"] == "present"),
                "level": level(used, allowed), "history": history,
            })
        notices = db.execute(
            "SELECT n.id, n.level, n.body, n.created_at AS createdAt, c.code FROM notices n "
            "JOIN courses c ON c.id = n.course_id WHERE n.student_id = ? AND n.owner_id = ? ORDER BY n.created_at DESC",
            (student_id, user["id"]),
        ).fetchall()
    return {"student": student_public(student), "courses": record, "notices": notices}
