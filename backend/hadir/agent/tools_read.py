"""Read-only tools: the assistant may call these freely. Each returns compact JSON-able data, never prose."""
from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool

from ..db import tx
from ..sessions import next_meeting
from ..stats import course_summary, session_rates, student_summaries
from .context import find_course, find_students, lang_of, name, owner_of

LEVELS = {"watch": 1, "warning": 2, "over": 3}


@tool
def list_courses(config: RunnableConfig) -> list[dict]:
    """List the professor's courses with enrolment, sessions held so far, attendance rate (0-1),
    the absence allowance per student, how many students sit at each risk level, and the next class."""
    lang = lang_of(config)
    with tx() as db:
        courses = db.execute("SELECT * FROM courses WHERE owner_id = ? ORDER BY code", (owner_of(config),)).fetchall()
        return [{"code": c["code"], "name": name(c, lang), "section": c["section"], "room": c["room"],
                 **{k: v for k, v in course_summary(db, c).items() if k != "lastSession"},
                 "next_class": (next_meeting(db, c) or {}).get("startsAt")} for c in courses]


@tool
def at_risk_students(config: RunnableConfig, course_code: Optional[str] = None,
                     min_level: Literal["watch", "warning", "over"] = "watch") -> list[dict]:
    """Students whose unexcused absences approach or pass the course limit. Levels: watch (half the
    allowance used), warning (three quarters), over (past the limit, at risk of being barred).
    Leave course_code empty to search every course."""
    owner, lang = owner_of(config), lang_of(config)
    out = []
    with tx() as db:
        courses = ([find_course(db, owner, course_code)] if course_code else
                   db.execute("SELECT * FROM courses WHERE owner_id = ?", (owner,)).fetchall())
        for c in filter(None, courses):
            for s in student_summaries(db, c):
                if LEVELS.get(s["level"], 0) >= LEVELS[min_level]:
                    out.append({"course": c["code"], "number": s["number"],
                                "name": s["nameAr"] if lang == "ar" else s["nameEn"],
                                "absent": s["absent"], "allowed": s["allowed"], "late": s["late"],
                                "excused": s["excused"], "level": s["level"]})
    return sorted(out, key=lambda r: (-LEVELS[r["level"]], -r["absent"]))[:40] or [{"result": "none"}]


@tool
def student_record(query: str, config: RunnableConfig) -> dict:
    """Look up a student by student number or part of a name (Arabic or English). With one match,
    returns every course they take with counts and the dates of each absence, late arrival and excuse."""
    owner, lang = owner_of(config), lang_of(config)
    with tx() as db:
        matches = find_students(db, owner, query)
        if len(matches) != 1:
            return {"matches": [{"number": m["number"], "name": name(m, lang)} for m in matches],
                    "note": "no match" if not matches else "several matches: ask which one or use the number"}
        s = matches[0]
        rows = db.execute(
            "SELECT c.code, cs.starts_at, a.status, a.note FROM enrollments e JOIN courses c ON c.id = e.course_id "
            "JOIN class_sessions cs ON cs.course_id = c.id AND cs.status = 'closed' "
            "LEFT JOIN attendance a ON a.session_id = cs.id AND a.student_id = e.student_id "
            "WHERE e.student_id = ? ORDER BY c.code, cs.starts_at", (s["id"],),
        ).fetchall()
        courses = {}
        for c in db.execute("SELECT c.* FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.student_id = ?",
                            (s["id"],)).fetchall():
            summary = next(x for x in student_summaries(db, c) if x["id"] == s["id"])
            courses[c["code"]] = {"absent": summary["absent"], "allowed": summary["allowed"], "late": summary["late"],
                                  "excused": summary["excused"], "present": summary["present"],
                                  "level": summary["level"], "absent_on": [], "late_on": [], "excused_on": []}
        for r in rows:
            key = {"absent": "absent_on", "late": "late_on", "excused": "excused_on"}.get(r["status"] or "")
            if key and r["code"] in courses:
                courses[r["code"]][key].append(r["starts_at"][:10] + (f" ({r['note']})" if r["note"] else ""))
    return {"number": s["number"], "name": name(s, lang), "major": s["major"], "year": s["year"], "courses": courses}


@tool
def session_report(course_code: str, config: RunnableConfig, on_date: Optional[str] = None) -> dict:
    """Who attended one class. on_date is YYYY-MM-DD; leave it empty for the most recent recorded class."""
    owner, lang = owner_of(config), lang_of(config)
    with tx() as db:
        c = find_course(db, owner, course_code)
        if not c:
            return {"error": f"no course {course_code}"}
        sessions = session_rates(db, c["id"])
        pick = [s for s in sessions if not on_date or s["startsAt"][:10] == on_date]
        if not pick:
            return {"error": "no recorded class on that date", "dates": [s["startsAt"][:10] for s in sessions[-8:]]}
        s = pick[-1]
        marks = db.execute(
            "SELECT st.name_ar, st.name_en, st.number, a.status, a.marked_at, a.note FROM attendance a "
            "JOIN students st ON st.id = a.student_id WHERE a.session_id = ? ORDER BY st.name_en", (s["id"],),
        ).fetchall()
    def who(status):
        return [f"{name(m, lang)} ({m['number']})" + (f" {m['marked_at'][11:16]}" if status == "late" else "")
                for m in marks if m["status"] == status]
    return {"course": c["code"], "date": s["startsAt"][:10], "starts": s["startsAt"][11:16], "topic": s["topic"],
            "present": s["present"], "late": s["late"], "absent": s["absent"], "excused": s["excused"],
            "rate": s["rate"], "absent_students": who("absent"), "late_students": who("late"),
            "excused_students": who("excused")}


@tool
def attendance_trend(config: RunnableConfig, course_code: Optional[str] = None) -> list[dict]:
    """Attendance rate by week of term (week 1 = first week), for one course or all of them together."""
    owner = owner_of(config)
    weeks: dict[int, list[int]] = {}
    with tx() as db:
        courses = ([find_course(db, owner, course_code)] if course_code else
                   db.execute("SELECT * FROM courses WHERE owner_id = ?", (owner,)).fetchall())
        for c in filter(None, courses):
            start = date.fromisoformat(c["term_start"])
            for s in session_rates(db, c["id"]):
                w = weeks.setdefault((date.fromisoformat(s["startsAt"][:10]) - start).days // 7 + 1, [0, 0])
                w[0] += s["present"] + s["late"]
                w[1] += s["marked"]
    return [{"week": k, "rate": round(a / m, 3) if m else None, "marks": m} for k, (a, m) in sorted(weeks.items())]


READ_TOOLS = [list_courses, at_risk_students, student_record, session_report, attendance_trend]
