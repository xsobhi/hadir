"""The professor's day: next class, students near the limit, and this term's attendance by week."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends

from ..auth import current_user
from ..db import now, tx
from ..sessions import next_meeting
from ..stats import course_public, course_summary, session_rates, student_summaries

router = APIRouter(prefix="/api")
RANK = {"over": 0, "warning": 1, "watch": 2, "ok": 3}


@router.get("/overview")
def overview(user: dict = Depends(current_user)):
    with tx() as db:
        courses = db.execute("SELECT * FROM courses WHERE owner_id = ? ORDER BY code", (user["id"],)).fetchall()
        items, at_risk, weekly = [], [], {}
        for c in courses:
            summary = course_summary(db, c)
            open_row = db.execute("SELECT id FROM class_sessions WHERE course_id = ? AND status = 'open'",
                                  (c["id"],)).fetchone()
            items.append({**course_public(c), "summary": summary, "next": next_meeting(db, c),
                          "openSessionId": open_row["id"] if open_row else None})
            for s in student_summaries(db, c):
                if s["level"] != "ok":
                    at_risk.append({**s, "courseId": c["id"], "courseCode": c["code"],
                                    "courseNameAr": c["name_ar"], "courseNameEn": c["name_en"]})
            start = date.fromisoformat(c["term_start"])
            for sess in session_rates(db, c["id"]):
                week = (date.fromisoformat(sess["startsAt"][:10]) - start).days // 7 + 1
                w = weekly.setdefault(week, {"week": week, "attended": 0, "marked": 0})
                w["attended"] += sess["present"] + sess["late"]
                w["marked"] += sess["marked"]
    at_risk.sort(key=lambda s: (RANK[s["level"]], -s["absent"] / max(s["allowed"], 1), s["nameEn"]))
    upcoming = sorted((i for i in items if i["next"]), key=lambda i: i["next"]["startsAt"])
    today = now().date()
    current_week = None
    if courses:
        current_week = (today - date.fromisoformat(courses[0]["term_start"])).days // 7 + 1
    with tx() as db:
        student_count = db.execute(
            "SELECT COUNT(DISTINCT e.student_id) AS n FROM enrollments e JOIN courses c ON c.id = e.course_id "
            "WHERE c.owner_id = ?", (user["id"],)).fetchone()["n"]
    return {
        "today": today.isoformat(),
        "studentCount": student_count,
        "termWeek": current_week,
        "termWeeks": courses[0]["term_weeks"] if courses else None,
        "courses": items,
        "next": upcoming[0] if upcoming else None,
        "todayClasses": [i for i in upcoming if i["next"]["isToday"]],
        "atRisk": at_risk,
        "weekly": [{**w, "rate": round(w["attended"] / w["marked"], 4) if w["marked"] else None}
                   for w in sorted(weekly.values(), key=lambda w: w["week"])],
    }
