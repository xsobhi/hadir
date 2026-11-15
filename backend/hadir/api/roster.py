"""A course's roster: add one student, paste many, remove one, and export the register as CSV."""
from __future__ import annotations

import csv
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..auth import current_user
from ..db import tx
from ..stats import session_rates, student_summaries
from .common import own_course, own_student

router = APIRouter(prefix="/api/courses/{course_id}/students")


class StudentIn(BaseModel):
    number: str = Field(min_length=3, max_length=32)
    nameAr: str = Field(min_length=2, max_length=80)
    nameEn: str = Field(default="", max_length=80)
    major: str = Field(default="", max_length=80)
    year: int = Field(default=1, ge=1, le=7)
    gender: str = Field(default="", pattern="^(m|f|)$")


class Paste(BaseModel):
    text: str = Field(max_length=200_000)


def _clean_number(raw: str) -> str:
    return "".join(ch for ch in raw if ch.isalnum())[:32]


def _enroll(db, owner_id: int, course_id: int, s: StudentIn) -> tuple[int, bool, bool]:
    """Returns (student id, whether the student already existed, whether they were already in this course)."""
    number = _clean_number(s.number)
    if len(number) < 3:
        raise HTTPException(422, "bad_number")
    row = db.execute("SELECT id FROM students WHERE owner_id = ? AND number = ?", (owner_id, number)).fetchone()
    existed = bool(row)
    if row:
        student_id = row["id"]
    else:
        student_id = db.execute(
            "INSERT INTO students (owner_id, number, name_ar, name_en, major, year, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (owner_id, number, s.nameAr.strip(), s.nameEn.strip() or s.nameAr.strip(), s.major.strip(), s.year, s.gender),
        ).lastrowid
    added = db.execute("INSERT OR IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)", (course_id, student_id)).rowcount
    return student_id, existed, not added


@router.post("")
def add_student(course_id: int, body: StudentIn, user: dict = Depends(current_user)):
    with tx() as db:
        own_course(db, user["id"], course_id)
        student_id, existed, already = _enroll(db, user["id"], course_id, body)
        return {"id": student_id, "existing": existed, "alreadyEnrolled": already}


@router.post("/paste")
def paste_students(course_id: int, body: Paste, user: dict = Depends(current_user)):
    """One student per line: number, Arabic name[, English name[, major]] separated by commas or tabs."""
    added, skipped = 0, []
    with tx() as db:
        own_course(db, user["id"], course_id)
        for i, line in enumerate(body.text.splitlines()[:500], start=1):
            parts = [p.strip() for p in line.replace("\t", ",").split(",")]
            if len(parts) < 2 or not parts[0]:
                if line.strip():
                    skipped.append(i)
                continue
            try:
                _enroll(db, user["id"], course_id, StudentIn(
                    number=parts[0], nameAr=parts[1], nameEn=parts[2] if len(parts) > 2 else "",
                    major=parts[3] if len(parts) > 3 else ""))
                added += 1
            except Exception:
                skipped.append(i)
    return {"added": added, "skippedLines": skipped}


@router.delete("/{student_id}")
def remove_student(course_id: int, student_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        own_course(db, user["id"], course_id)
        own_student(db, user["id"], student_id)
        db.execute("DELETE FROM enrollments WHERE course_id = ? AND student_id = ?", (course_id, student_id))
    return {"ok": True}


@router.get("/export.csv")
def export_csv(course_id: int, user: dict = Depends(current_user)):
    with tx() as db:
        course = own_course(db, user["id"], course_id)
        sessions = session_rates(db, course_id)
        students = student_summaries(db, course)
        marks = db.execute(
            "SELECT a.session_id, a.student_id, a.status FROM attendance a JOIN class_sessions cs ON cs.id = a.session_id "
            "WHERE cs.course_id = ? AND cs.status = 'closed'", (course_id,),
        ).fetchall()
    by = {(m["student_id"], m["session_id"]): m["status"] for m in marks}
    buf = io.StringIO()
    out = csv.writer(buf)
    out.writerow(["number", "name_ar", "name_en", "present", "late", "absent", "excused", "allowed", "level"]
                 + [s["startsAt"][:10] for s in sessions])
    for s in students:
        out.writerow([s["number"], s["nameAr"], s["nameEn"], s["present"], s["late"], s["absent"], s["excused"],
                      s["allowed"], s["level"]] + [by.get((s["id"], x["id"]), "") for x in sessions])
    # BOM so Excel opens the Arabic names correctly.
    data = "﻿" + buf.getvalue()
    name = f"{course['code']}-{course['section']}-attendance.csv"
    return Response(data, media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": f'attachment; filename="{name}"'})
