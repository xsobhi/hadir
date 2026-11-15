"""A tiny sliding-window counter in SQLite, enough for a public demo's abuse limits."""
from __future__ import annotations

from datetime import timedelta

from .db import now, tx


def hit(kind: str, subject: str, limit: int, window: timedelta) -> bool:
    """Record one event and return True, or return False without recording when the window is full."""
    since = (now() - window).isoformat(timespec="seconds")
    with tx() as db:
        used = db.execute(
            "SELECT COUNT(*) AS n FROM rate_events WHERE kind = ? AND subject = ? AND at > ?",
            (kind, subject, since),
        ).fetchone()["n"]
        if used >= limit:
            return False
        db.execute(
            "INSERT INTO rate_events (kind, subject, at) VALUES (?, ?, ?)",
            (kind, subject, now().isoformat(timespec="seconds")),
        )
    return True


def prune() -> None:
    cutoff = (now() - timedelta(days=2)).isoformat(timespec="seconds")
    with tx() as db:
        db.execute("DELETE FROM rate_events WHERE at < ?", (cutoff,))
