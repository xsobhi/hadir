"""Sign in with Pabbel: authorization code + PKCE against accounts.pabbel.com, then a normal Hadir session.

The code is exchanged here, server to server, with the client secret and the PKCE verifier; the Pabbel
token is used once to read who signed in and is never stored or sent to the browser.
"""
from __future__ import annotations

import base64
import hashlib
import json
import secrets
import urllib.request
from urllib.parse import urlencode

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from ..auth import start_session
from ..config import COOKIE_SECURE, PABBEL_API, PABBEL_CLIENT_ID, PABBEL_CLIENT_SECRET, PABBEL_CONSENT_URL, PUBLIC_ORIGIN
from ..db import now_iso, tx

router = APIRouter(prefix="/api/auth/pabbel")
HANDSHAKE = "hadir_pabbel"
CALLBACK = f"{PUBLIC_ORIGIN}/api/auth/pabbel/callback"
UA = "Hadir/1.0 (+https://hadir.xsobhi.com)"


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def _call(method: str, path: str, body: dict | None = None, token: str | None = None) -> dict:
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{PABBEL_API}{path}", method=method, headers=headers,
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.loads(res.read().decode())


@router.get("/start")
def start(lang: str = "ar"):
    if not PABBEL_CLIENT_ID:
        return RedirectResponse("/signin?error=pabbel_off", status_code=303)
    state, verifier = _b64(secrets.token_bytes(16)), _b64(secrets.token_bytes(32))
    challenge = _b64(hashlib.sha256(verifier.encode()).digest())
    query = urlencode({"client_id": PABBEL_CLIENT_ID, "redirect_uri": CALLBACK, "scope": "profile", "state": state,
                       "code_challenge": challenge, "code_challenge_method": "S256", "lang": lang})
    out = RedirectResponse(f"{PABBEL_CONSENT_URL}?{query}", status_code=303)
    out.set_cookie(HANDSHAKE, f"{state}.{verifier}", max_age=600, httponly=True, secure=COOKIE_SECURE,
                   samesite="lax", path="/api/auth/pabbel")
    return out


def _profile_user(me: dict) -> tuple[str, str, str, str]:
    user = me.get("user", me)  # /auth/me answers {user, token}
    first, last = (user.get("firstName") or "").strip(), (user.get("lastName") or "").strip()
    email = (user.get("email") or "").strip().lower()
    name = f"{first} {last}".strip() or user.get("name") or email.split("@")[0]
    gender = {"female": "f", "male": "m", "f": "f", "m": "m"}.get(str(user.get("gender") or "").lower(), "")
    return str(user["id"]), email, name, gender


def link_account(pabbel_id: str, email: str, name: str, gender: str) -> int:
    """The Hadir account for this Pabbel account: by Pabbel id, else a same-email account is linked, else a new one."""
    with tx() as db:
        row = db.execute("SELECT id FROM users WHERE pabbel_id = ?", (pabbel_id,)).fetchone()
        if row:
            db.execute("UPDATE users SET name = ?, gender = CASE WHEN ? != '' THEN ? ELSE gender END WHERE id = ?",
                       (name, gender, gender, row["id"]))
            return row["id"]
        row = db.execute("SELECT id FROM users WHERE email = ? AND is_demo = 0", (email,)).fetchone()
        if row:
            db.execute("UPDATE users SET pabbel_id = ? WHERE id = ?", (pabbel_id, row["id"]))
            return row["id"]
        return db.execute(
            "INSERT INTO users (name, email, pabbel_id, gender, created_at) VALUES (?, ?, ?, ?, ?)",
            (name, email or f"pabbel-{pabbel_id}@hadir.local", pabbel_id, gender, now_iso()),
        ).lastrowid


@router.get("/callback")
def callback(request: Request, code: str = "", state: str = "", error: str = ""):
    fail = lambda reason: RedirectResponse(f"/signin?error={reason}", status_code=303)  # noqa: E731
    shake = request.cookies.get(HANDSHAKE, "")
    saved_state, _, verifier = shake.partition(".")
    if not shake or not state or not secrets.compare_digest(state, saved_state):
        return fail("state")
    if error or not code:
        return fail("cancelled")
    try:
        grant = _call("POST", "/oauth/token", {"clientId": PABBEL_CLIENT_ID, "clientSecret": PABBEL_CLIENT_SECRET,
                                               "code": code, "codeVerifier": verifier})
        pabbel_id, email, name, gender = _profile_user(_call("GET", "/auth/me", token=grant["accessToken"]))
    except Exception:
        return fail("exchange")
    out = RedirectResponse("/app", status_code=303)
    out.delete_cookie(HANDSHAKE, path="/api/auth/pabbel")
    start_session(out, link_account(pabbel_id, email, name, gender))
    return out
