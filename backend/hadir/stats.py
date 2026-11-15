"""Attendance arithmetic shared by the API and the assistant's tools.

Rules, in one place:
- planned sessions = term weeks x meetings per week; allowed absences = floor(planned x limit% / 100)
- an excused absence never counts against the allowance; a late arrival counts as attended
- level: ok under half the allowance, watch from half, warning from three quarters, over past the limit
"""
from __future__ import annotations

import math
from collections import Counter


def planned_sessions(course: dict) -> int:
    meetings = len([d for d in course["days"].split(",") if d.strip()])
    return course["term_weeks"] * max(meetings, 1)


def allowed_absences(course: dict) -> int:
    return math.floor(planned_sessions(course) * course["absence_limit_pct"] / 100)


def level(used: int, allowed: int) -> str:
    if allowed <= 0:
        return "over" if used > 0 else "ok"
    if used > allowed:
        return "over"
    ratio = used / allowed
    return "warning" if ratio >= 0.75 else "watch" if ratio >= 0.5 else "ok"


def student_summaries(db, course: dict) -> list[dict]:
    """One row per enrolled student with their counts this term, worst first."""
    rows = db.execute(
        "SELECT s.id, s.number, s.name_ar, s.name_en, s.major, s.year, s.gender, a.status "
        "FROM enrollments e JOIN students s ON s.id = e.student_id "
        "LEFT JOIN attendance a ON a.student_id = s.id AND a.session_id IN "
        "  (SELECT id FROM class_sessions WHERE course_id = ? AND status = 'closed') "
        "WHERE e.course_id = ?",
        (course["id"], course["id"]),
    ).fetchall()
    allowed = allowed_absences(course)
    people: dict[int, dict] = {}
    for r in rows:
        p = people.setdefault(r["id"], {
            "id": r["id"], "number": r["number"], "nameAr": r["name_ar"], "nameEn": r["name_en"],
            "major": r["major"], "year": r["year"], "gender": r["gender"], "counts": Counter(),
        })
        if r["status"]:
            p["counts"][r["status"]] += 1
    out = []
    for p in people.values():
        c = p.pop("counts")
        used = c["absent"]
        out.append({**p, "present": c["present"], "late": c["late"], "absent": used, "excused": c["excused"],
                    "allowed": allowed, "level": level(used, allowed)})
    out.sort(key=lambda s: (-s["absent"], -s["late"], s["nameEn"]))
    return out


def session_rates(db, course_id: int) -> list[dict]:
    """Closed sessions in order, each with its counts and attendance rate (present + late over enrolled)."""
    rows = db.execute(
        "SELECT cs.id, cs.starts_at, cs.topic, "
        " SUM(a.status = 'present') AS present, SUM(a.status = 'late') AS late, "
        " SUM(a.status = 'absent') AS absent, SUM(a.status = 'excused') AS excused, COUNT(a.student_id) AS marked "
        "FROM class_sessions cs LEFT JOIN attendance a ON a.session_id = cs.id "
        "WHERE cs.course_id = ? AND cs.status = 'closed' GROUP BY cs.id ORDER BY cs.starts_at",
        (course_id,),
    ).fetchall()
    for r in rows:
        attended = (r["present"] or 0) + (r["late"] or 0)
        r["rate"] = round(attended / r["marked"], 4) if r["marked"] else 0.0
        r["startsAt"] = r.pop("starts_at")
        for k in ("present", "late", "absent", "excused"):
            r[k] = r[k] or 0
    return rows


def course_summary(db, course: dict) -> dict:
    sessions = session_rates(db, course["id"])
    students = student_summaries(db, course)
    marked = sum(s["marked"] for s in sessions)
    attended = sum(s["present"] + s["late"] for s in sessions)
    levels = Counter(s["level"] for s in students)
    return {
        "enrolled": len(students),
        "held": len(sessions),
        "planned": planned_sessions(course),
        "allowed": allowed_absences(course),
        "rate": round(attended / marked, 4) if marked else None,
        "levels": {k: levels.get(k, 0) for k in ("ok", "watch", "warning", "over")},
        "lastSession": sessions[-1] if sessions else None,
    }


def course_public(course: dict) -> dict:
    return {
        "id": course["id"], "code": course["code"], "nameAr": course["name_ar"], "nameEn": course["name_en"],
        "section": course["section"], "room": course["room"],
        "days": [int(d) for d in course["days"].split(",") if d.strip()],
        "startTime": course["start_time"], "durationMin": course["duration_min"],
        "termStart": course["term_start"], "termWeeks": course["term_weeks"],
        "absenceLimitPct": course["absence_limit_pct"], "lateAfterMin": course["late_after_min"],
    }
