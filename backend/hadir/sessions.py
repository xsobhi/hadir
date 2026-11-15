"""Taking attendance: opening a class session, recording a scanned card, closing the session."""
from __future__ import annotations

from datetime import date, datetime, timedelta

from .config import TZ
from .db import now, parse_dt


def meeting_on(course: dict, day: date) -> datetime | None:
    if day.weekday() not in {int(d) for d in course["days"].split(",") if d.strip()}:
        return None
    hh, mm = (int(x) for x in course["start_time"].split(":"))
    return datetime(day.year, day.month, day.day, hh, mm, tzinfo=TZ)


def next_meeting(db, course: dict) -> dict | None:
    """The next scheduled class that has not been taken yet; today's class counts until it is recorded."""
    today = now().date()
    taken_today = db.execute(
        "SELECT 1 FROM class_sessions WHERE course_id = ? AND substr(starts_at, 1, 10) = ?",
        (course["id"], today.isoformat()),
    ).fetchone()
    for offset in range(0, 8):
        day = today + timedelta(days=offset)
        if offset == 0 and taken_today:
            continue
        starts = meeting_on(course, day)
        if starts:
            return {"startsAt": starts.isoformat(timespec="seconds"), "isToday": offset == 0}
    return None


def open_session(db, course: dict, topic: str = "") -> dict:
    existing = db.execute(
        "SELECT * FROM class_sessions WHERE course_id = ? AND status = 'open' ORDER BY starts_at DESC LIMIT 1",
        (course["id"],),
    ).fetchone()
    if existing:
        return existing
    current = now()
    scheduled = meeting_on(course, current.date())
    # Use the timetable's start when the class is today and we are near it, so lateness is judged fairly.
    if scheduled and scheduled - timedelta(minutes=45) <= current <= scheduled + timedelta(minutes=course["duration_min"]):
        starts = scheduled
    else:
        starts = current.replace(second=0, microsecond=0)
    session_id = db.execute(
        "INSERT INTO class_sessions (course_id, starts_at, topic, status) VALUES (?, ?, ?, 'open')",
        (course["id"], starts.isoformat(timespec="seconds"), topic.strip()[:120]),
    ).lastrowid
    return db.execute("SELECT * FROM class_sessions WHERE id = ?", (session_id,)).fetchone()


def scan(db, owner_id: int, session: dict, course: dict, code: str) -> dict:
    """Record one card. Returns {result, student?, status?, markedAt?} where result is
    'ok', 'duplicate', 'not_enrolled' or 'unknown'."""
    number = "".join(ch for ch in code if ch.isalnum())[:32]
    student = db.execute(
        "SELECT id, number, name_ar, name_en FROM students WHERE owner_id = ? AND number = ?",
        (owner_id, number),
    ).fetchone()
    if not student:
        return {"result": "unknown", "code": number}
    view = {"id": student["id"], "number": student["number"], "nameAr": student["name_ar"], "nameEn": student["name_en"]}
    enrolled = db.execute(
        "SELECT 1 FROM enrollments WHERE course_id = ? AND student_id = ?", (course["id"], student["id"]),
    ).fetchone()
    if not enrolled:
        return {"result": "not_enrolled", "student": view}
    prior = db.execute(
        "SELECT status, marked_at FROM attendance WHERE session_id = ? AND student_id = ?",
        (session["id"], student["id"]),
    ).fetchone()
    if prior and prior["status"] in ("present", "late"):
        return {"result": "duplicate", "student": view, "status": prior["status"], "markedAt": prior["marked_at"]}
    current = now()
    late_line = parse_dt(session["starts_at"]) + timedelta(minutes=course["late_after_min"])
    status = "late" if current > late_line else "present"
    stamp = current.isoformat(timespec="seconds")
    db.execute(
        "INSERT INTO attendance (session_id, student_id, status, marked_at, method) VALUES (?, ?, ?, ?, 'scan') "
        "ON CONFLICT (session_id, student_id) DO UPDATE SET status = excluded.status, "
        "marked_at = excluded.marked_at, method = 'scan', note = ''",
        (session["id"], student["id"], status, stamp),
    )
    return {"result": "ok", "student": view, "status": status, "markedAt": stamp}


def set_mark(db, session_id: int, student_id: int, status: str | None, note: str = "", method: str = "manual") -> None:
    if status is None:
        db.execute("DELETE FROM attendance WHERE session_id = ? AND student_id = ?", (session_id, student_id))
        return
    db.execute(
        "INSERT INTO attendance (session_id, student_id, status, marked_at, method, note) VALUES (?, ?, ?, ?, ?, ?) "
        "ON CONFLICT (session_id, student_id) DO UPDATE SET status = excluded.status, "
        "marked_at = excluded.marked_at, method = excluded.method, note = excluded.note",
        (session_id, student_id, status, now().isoformat(timespec="seconds"), method, note[:200]),
    )


def close_session(db, session: dict, course: dict) -> int:
    """Everyone enrolled who was not marked becomes absent. Returns how many were marked absent."""
    stamp = now().isoformat(timespec="seconds")
    cur = db.execute(
        "INSERT INTO attendance (session_id, student_id, status, marked_at, method) "
        "SELECT ?, e.student_id, 'absent', ?, 'auto' FROM enrollments e WHERE e.course_id = ? "
        "AND e.student_id NOT IN (SELECT student_id FROM attendance WHERE session_id = ?)",
        (session["id"], stamp, course["id"], session["id"]),
    )
    db.execute("UPDATE class_sessions SET status = 'closed', closed_at = ? WHERE id = ?", (stamp, session["id"]))
    return cur.rowcount
