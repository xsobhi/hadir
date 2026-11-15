"""SQLite access: one short-lived connection per call site, WAL mode, rows as dicts."""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator

from .config import DB_PATH, TZ

SCHEMA = Path(__file__).with_name("data") / "schema.sql"


def _dict_row(cursor: sqlite3.Cursor, row: tuple) -> dict[str, Any]:
    return {col[0]: row[i] for i, col in enumerate(cursor.description)}


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15, check_same_thread=False)
    conn.row_factory = _dict_row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 15000")
    return conn


@contextmanager
def tx() -> Iterator[sqlite3.Connection]:
    """A connection whose work commits on success and rolls back on any exception."""
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    conn = connect()
    try:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript(SCHEMA.read_text(encoding="utf-8"))
        conn.commit()
    finally:
        conn.close()


def now() -> datetime:
    return datetime.now(TZ)


def now_iso() -> str:
    return now().isoformat(timespec="seconds")


def parse_dt(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    return dt if dt.tzinfo else dt.replace(tzinfo=TZ)
