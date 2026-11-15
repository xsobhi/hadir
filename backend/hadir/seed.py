"""Builds a fresh demo workspace: one professor, three courses, ~100 students and the term's attendance so far.

The term is placed so that today is in week 10 of 16 and every class before today is already recorded,
which leaves today's class (if one is scheduled) waiting to be taken by the visitor.
"""
from __future__ import annotations

import random
import secrets
from datetime import date, datetime, timedelta

from .config import DEMO_TTL_HOURS, TZ
from .data.names import COURSES, FAMILY, FIRST_FEMALE, FIRST_MALE, MAJORS, PROFESSOR
from .db import now, tx


def _term_start(today: date) -> date:
    days_since_sunday = (today.weekday() + 1) % 7
    return today - timedelta(days=days_since_sunday + 9 * 7)


def _people(rng: random.Random, count: int) -> list[dict]:
    seen: set[tuple[str, str]] = set()
    numbers: set[str] = set()
    people = []
    while len(people) < count:
        gender = "m" if rng.random() < 0.5 else "f"
        first = rng.choice(FIRST_MALE if gender == "m" else FIRST_FEMALE)
        family = rng.choice(FAMILY)
        if (first[1], family[1]) in seen:
            continue
        seen.add((first[1], family[1]))
        major = rng.choice(MAJORS)
        year = rng.choice([2, 2, 3, 3, 3, 4])
        number = f"120{2026 - year - 2000:02d}{rng.randint(1000, 9999)}"
        if number in numbers:
            continue
        numbers.add(number)
        people.append({
            "number": number,
            "name_ar": f"{first[0]} {family[0]}", "name_en": f"{first[1]} {family[1]}",
            "major": major[0] + "|" + major[1], "year": year, "gender": gender,
            # How reliably they come, how often late: most are steady, a few drift towards the limit.
            "show": rng.choice([0.99, 0.98, 0.97, 0.96, 0.95, 0.95, 0.94, 0.93, 0.92, 0.9, 0.87, 0.82, 0.74, 0.66]),
            "late": rng.choice([0.02, 0.04, 0.05, 0.08, 0.12, 0.2]),
        })
    return people


def _meetings(course: dict, term_start: date, until: date) -> list[datetime]:
    days = {int(d) for d in course["days"].split(",")}
    hh, mm = (int(x) for x in course["start_time"].split(":"))
    out, day = [], term_start
    while day < until:
        if day.weekday() in days:
            out.append(datetime(day.year, day.month, day.day, hh, mm, tzinfo=TZ))
        day += timedelta(days=1)
    return out


def create_demo_workspace(lang: str = "ar") -> int:
    rng = random.Random(secrets.randbits(32))
    created = now()
    en = lang == "en"
    with tx() as db:
        user_id = db.execute(
            "INSERT INTO users (name, email, title, department, is_demo, gender, created_at, expires_at) "
            "VALUES (?, ?, ?, ?, 1, 'f', ?, ?)",
            (PROFESSOR["name_en"] if en else PROFESSOR["name"], f"demo-{secrets.token_hex(6)}@hadir.local",
             PROFESSOR["title_en"] if en else PROFESSOR["title_ar"],
             PROFESSOR["department_en"] if en else PROFESSOR["department_ar"],
             created.isoformat(timespec="seconds"),
             (created + timedelta(hours=DEMO_TTL_HOURS)).isoformat(timespec="seconds")),
        ).lastrowid
        seed_workspace(db, user_id, lang, rng)
    return user_id


def seed_workspace(db, user_id: int, lang: str, rng: random.Random | None = None) -> None:
    """Fill an account with the three sample courses, their students and the term's attendance so far."""
    rng = rng or random.Random(secrets.randbits(32))
    today = now().date()
    term_start = _term_start(today)
    en = lang == "en"
    people = _people(rng, 96)
    for p in people:
        p["id"] = db.execute(
            "INSERT INTO students (owner_id, number, name_ar, name_en, major, year, gender) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, p["number"], p["name_ar"], p["name_en"], p["major"].split("|")[0 if not en else 1], p["year"],
             p["gender"]),
        ).lastrowid
    for spec in COURSES:
        _seed_course(db, rng, user_id, spec, people, term_start, today, en)


def _seed_course(db, rng, user_id, spec, people, term_start, today, en) -> None:
    course_id = db.execute(
        "INSERT INTO courses (owner_id, code, name_ar, name_en, section, room, days, start_time, duration_min,"
        " term_start, term_weeks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 16)",
        (user_id, spec["code"], spec["name_ar"], spec["name_en"], spec["section"], spec["room"], spec["days"],
         spec["start_time"], spec["duration_min"], term_start.isoformat()),
    ).lastrowid
    roster = rng.sample(people, spec["size"])
    db.executemany("INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)",
                   [(course_id, p["id"]) for p in roster])
    meetings = _meetings(spec, term_start, today)
    for i, starts in enumerate(meetings):
        topic = spec["topics"][(i // 2) % len(spec["topics"])][1 if en else 0]
        session_id = db.execute(
            "INSERT INTO class_sessions (course_id, starts_at, topic, status, closed_at) VALUES (?, ?, ?, 'closed', ?)",
            (course_id, starts.isoformat(timespec="seconds"), topic,
             (starts + timedelta(minutes=spec["duration_min"])).isoformat(timespec="seconds")),
        ).lastrowid
        # Week 8 is midterms: attendance dips a little across the board.
        dip = 0.05 if (starts.date() - term_start).days // 7 == 7 else 0.0
        rows = [_mark(rng, session_id, p, starts, dip, en) for p in roster]
        db.executemany(
            "INSERT INTO attendance (session_id, student_id, status, marked_at, method, note) VALUES (?, ?, ?, ?, ?, ?)",
            rows,
        )


def _mark(rng, session_id, person, starts: datetime, dip: float, en: bool) -> tuple:
    if rng.random() < person["show"] - dip:
        if rng.random() < person["late"]:
            arrived = starts + timedelta(minutes=rng.randint(11, 35), seconds=rng.randint(0, 59))
            return (session_id, person["id"], "late", arrived.isoformat(timespec="seconds"), "scan", "")
        arrived = starts + timedelta(minutes=rng.randint(-6, 9), seconds=rng.randint(0, 59))
        method = "manual" if rng.random() < 0.03 else "scan"
        return (session_id, person["id"], "present", arrived.isoformat(timespec="seconds"), method, "")
    closed = (starts + timedelta(minutes=90)).isoformat(timespec="seconds")
    if rng.random() < 0.18:
        note = rng.choice(["Medical report", "Family emergency", "University activity"] if en
                          else ["تقرير طبي", "ظرف عائلي طارئ", "نشاط جامعي"])
        return (session_id, person["id"], "excused", closed, "manual", note)
    return (session_id, person["id"], "absent", closed, "auto", "")
