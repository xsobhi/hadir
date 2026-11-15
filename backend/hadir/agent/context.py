"""What a tool needs to know about the caller, read from the run's config, plus shared lookups."""
from __future__ import annotations

from langchain_core.runnables import RunnableConfig


def owner_of(config: RunnableConfig) -> int:
    return int(config["configurable"]["owner_id"])


def lang_of(config: RunnableConfig) -> str:
    return config["configurable"].get("lang", "ar")


def find_course(db, owner_id: int, code: str) -> dict | None:
    code = (code or "").strip().upper().replace(" ", "")
    return db.execute(
        "SELECT * FROM courses WHERE owner_id = ? AND REPLACE(UPPER(code), ' ', '') = ? ORDER BY section LIMIT 1",
        (owner_id, code),
    ).fetchone()


def find_students(db, owner_id: int, query: str, limit: int = 6) -> list[dict]:
    """Exact student number first, then a name match in Arabic or English."""
    q = (query or "").strip()
    exact = db.execute("SELECT * FROM students WHERE owner_id = ? AND number = ?", (owner_id, q)).fetchall()
    if exact:
        return exact
    like = f"%{q.lower()}%"
    return db.execute(
        "SELECT * FROM students WHERE owner_id = ? AND (LOWER(name_en) LIKE ? OR name_ar LIKE ?) ORDER BY name_en LIMIT ?",
        (owner_id, like, f"%{q}%", limit),
    ).fetchall()


def name(row: dict, lang: str) -> str:
    return row["name_ar"] if lang == "ar" else row["name_en"]
