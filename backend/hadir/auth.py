"""Password hashing (stdlib scrypt), cookie sessions, and the FastAPI dependency that resolves the professor."""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import timedelta

from fastapi import HTTPException, Request, Response

from .config import COOKIE_SECURE, SESSION_DAYS
from .db import now, now_iso, tx

COOKIE = "hadir_session"
_N, _R, _P = 2**14, 8, 1


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, dklen=32)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored or not stored.startswith("scrypt$"):
        return False
    _, salt_hex, digest_hex = stored.split("$")
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=_N, r=_R, p=_P, dklen=32)
    return hmac.compare_digest(digest.hex(), digest_hex)


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def start_session(response: Response, user_id: int) -> None:
    token = secrets.token_urlsafe(32)
    expires = now() + timedelta(days=SESSION_DAYS)
    with tx() as db:
        db.execute(
            "INSERT INTO auth_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            (_token_hash(token), user_id, expires.isoformat(timespec="seconds")),
        )
    response.set_cookie(
        COOKIE, token, max_age=SESSION_DAYS * 86400, httponly=True,
        secure=COOKIE_SECURE, samesite="lax", path="/",
    )


def end_session(request: Request, response: Response) -> None:
    token = request.cookies.get(COOKIE)
    if token:
        with tx() as db:
            db.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (_token_hash(token),))
    response.delete_cookie(COOKIE, path="/")


def public_user(row: dict) -> dict:
    return {
        "id": row["id"], "name": row["name"], "email": row["email"], "title": row["title"],
        "department": row["department"], "isDemo": bool(row["is_demo"]), "expiresAt": row["expires_at"],
        "gender": row.get("gender", ""),
        "avatarUrl": f"/api/profile/avatar?v={row['avatar_version']}" if row.get("avatar_version") else None,
    }


def current_user(request: Request) -> dict:
    """Dependency: the signed-in professor, or 401."""
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, "not_signed_in")
    with tx() as db:
        row = db.execute(
            "SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id "
            "WHERE s.token_hash = ? AND s.expires_at > ?",
            (_token_hash(token), now_iso()),
        ).fetchone()
    if not row:
        raise HTTPException(401, "not_signed_in")
    return row


def client_ip(request: Request) -> str:
    # Cloudflare sits in front of Caddy; its header carries the visitor's address.
    return (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )
