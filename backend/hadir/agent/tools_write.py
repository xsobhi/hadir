"""Tools that change data. The graph pauses for the professor's approval before any of them runs."""
from __future__ import annotations

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langgraph.config import get_stream_writer

from ..db import now_iso, tx
from ..sessions import set_mark
from ..stats import student_summaries
from .context import find_course, lang_of, name, owner_of
from .reflection import notice_graph


def _student_in_course(db, owner: int, number: str, course_code: str):
    course = find_course(db, owner, course_code)
    student = db.execute("SELECT * FROM students WHERE owner_id = ? AND number = ?", (owner, number.strip())).fetchone()
    if not course or not student:
        return course, student, None
    summary = next((s for s in student_summaries(db, course) if s["id"] == student["id"]), None)
    return course, student, summary


def _run_reflection(facts: str, lang: str) -> dict:
    """Run the draft/critique/revise graph, reporting each step to the browser as it happens."""
    try:
        write = get_stream_writer()
    except Exception:  # outside a streaming run (tests): progress is optional
        write = lambda _event: None  # noqa: E731
    state = {"facts": facts, "lang": lang, "draft": "", "critique": "", "rounds": 0}
    for update in notice_graph.stream(state, stream_mode="updates"):
        for node, change in update.items():
            state.update(change)
            event = {"type": "reflection", "stage": node, "round": state["rounds"]}
            if node == "critique":
                event["verdict"] = "approved" if state["critique"].strip().upper().startswith("APPROVED") else "revise"
            write(event)
    return state


@tool
def draft_warning_notice(student_number: str, course_code: str, config: RunnableConfig) -> dict:
    """Draft (but do not save) an attendance warning notice for one student in one course. Uses a
    draft -> critique -> revise loop so the letter matches the real record. Show the draft to the professor."""
    owner, lang = owner_of(config), lang_of(config)
    with tx() as db:
        course, student, s = _student_in_course(db, owner, student_number, course_code)
        if not s:
            return {"error": "student or course not found, or the student is not enrolled"}
        absences = db.execute(
            "SELECT cs.starts_at FROM attendance a JOIN class_sessions cs ON cs.id = a.session_id "
            "WHERE a.student_id = ? AND cs.course_id = ? AND a.status = 'absent' ORDER BY cs.starts_at",
            (student["id"], course["id"]),
        ).fetchall()
        professor = db.execute("SELECT name, title FROM users WHERE id = ?", (owner,)).fetchone()
    facts = (
        f"Student: {name(student, lang)}, number {student['number']}\n"
        f"Course: {course['code']} {name(course, lang)}, section {course['section']}\n"
        f"Unexcused absences: {s['absent']} of {s['allowed']} allowed "
        f"({course['absence_limit_pct']}% of the term's classes); late arrivals: {s['late']}\n"
        f"Absence dates: {', '.join(a['starts_at'][:10] for a in absences) or 'none'}\n"
        f"Remaining before the limit: {max(s['allowed'] - s['absent'], 0)}\n"
        f"Past the limit the student may be barred from the final exam.\n"
        f"Excuses: submit documents to the professor or the faculty office within one week.\n"
        f"Signed: {professor['title']} {professor['name']}"
    )
    result = _run_reflection(facts, lang)
    return {"student_number": student["number"], "course": course["code"], "level": s["level"],
            "critique_rounds": result["rounds"], "notice": result["draft"]}


@tool
def excuse_absence(student_number: str, course_code: str, class_date: str, reason: str,
                   config: RunnableConfig) -> dict:
    """Change one recorded absence to excused (needs the professor's approval). class_date is YYYY-MM-DD."""
    owner = owner_of(config)
    with tx() as db:
        course, student, _ = _student_in_course(db, owner, student_number, course_code)
        if not course or not student:
            return {"error": "student or course not found"}
        row = db.execute(
            "SELECT a.session_id, a.status FROM attendance a JOIN class_sessions cs ON cs.id = a.session_id "
            "WHERE a.student_id = ? AND cs.course_id = ? AND substr(cs.starts_at, 1, 10) = ?",
            (student["id"], course["id"], class_date),
        ).fetchone()
        if not row:
            return {"error": f"no recorded class on {class_date}"}
        if row["status"] != "absent":
            return {"error": f"that class is recorded as {row['status']}, not absent"}
        set_mark(db, row["session_id"], student["id"], "excused", reason, method="assistant")
    return {"ok": True, "student_number": student_number, "course": course["code"], "date": class_date}


@tool
def save_warning_notice(student_number: str, course_code: str, notice: str, config: RunnableConfig) -> dict:
    """Save a warning notice to the student's record (needs the professor's approval)."""
    owner = owner_of(config)
    with tx() as db:
        course, student, s = _student_in_course(db, owner, student_number, course_code)
        if not s:
            return {"error": "student or course not found, or the student is not enrolled"}
        notice_id = db.execute(
            "INSERT INTO notices (owner_id, student_id, course_id, level, body, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (owner, student["id"], course["id"], s["level"], notice.strip()[:4000], now_iso()),
        ).lastrowid
    return {"ok": True, "notice_id": notice_id}


WRITE_TOOLS = [excuse_absence, save_warning_notice]
WRITE_NAMES = {t.name for t in WRITE_TOOLS}
