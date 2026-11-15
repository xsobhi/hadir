"""Hadir's web server: the JSON API under /api and the built single-page app for everything else."""
from __future__ import annotations

import threading
import time
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, Response

from .api import assistant, auth_routes, courses, live, overview, pabbel_auth, roster, students
from .config import PUBLIC_ORIGIN, WEB_DIST
from .db import init_db, now_iso, tx
from .ratelimit import prune

init_db()
app = FastAPI(title="Hadir", docs_url=None, redoc_url=None, openapi_url=None)
for module in (auth_routes, pabbel_auth, overview, courses, roster, live, students, assistant):
    app.include_router(module.router)

ALLOWED_HOSTS = {urlparse(PUBLIC_ORIGIN).netloc, "localhost:8731", "127.0.0.1:8731", "localhost:8732", "127.0.0.1:8732"}


@app.middleware("http")
async def guard(request: Request, call_next):
    # Cookie auth + SameSite=Lax already blocks most cross-site posts; also refuse a foreign Origin outright.
    if request.method not in ("GET", "HEAD", "OPTIONS") and request.url.path.startswith("/api/"):
        origin = request.headers.get("origin")
        if origin and urlparse(origin).netloc not in ALLOWED_HOSTS:
            return JSONResponse({"detail": "bad_origin"}, status_code=403)
    response: Response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Permissions-Policy", "camera=(self), microphone=(), geolocation=()")
    if request.url.path.startswith("/api/"):
        response.headers.setdefault("Cache-Control", "no-store")
    return response


@app.get("/api/health")
def health():
    return {"ok": True, "at": now_iso()}


@app.get("/{path:path}", include_in_schema=False)
def spa(path: str):
    if path.startswith("api/"):
        return JSONResponse({"detail": "not_found"}, status_code=404)
    target = (WEB_DIST / path).resolve()
    if path and target.is_file() and WEB_DIST.resolve() in target.parents:
        cache = "public, max-age=31536000, immutable" if path.startswith("assets/") else "public, max-age=300"
        return FileResponse(target, headers={"Cache-Control": cache})
    index = WEB_DIST / "index.html"
    if not index.exists():
        return JSONResponse({"detail": "web build missing"}, status_code=503)
    return FileResponse(index, headers={"Cache-Control": "no-cache"})


def _janitor() -> None:
    """Hourly: drop expired demo workspaces (with everything in them), sign-in sessions and rate events."""
    while True:
        try:
            stamp = now_iso()
            with tx() as db:
                gone = db.execute("SELECT t.id FROM agent_threads t JOIN users u ON u.id = t.owner_id "
                                  "WHERE u.is_demo = 1 AND u.expires_at < ?", (stamp,)).fetchall()
                db.execute("DELETE FROM users WHERE is_demo = 1 AND expires_at < ?", (stamp,))
                db.execute("DELETE FROM auth_sessions WHERE expires_at < ?", (stamp,))
            prune()
            if gone:
                from .agent.graph import checkpointer
                for t in gone:
                    checkpointer.delete_thread(t["id"])
        except Exception as exc:  # keep the loop alive; the next hour retries
            print("janitor:", exc, flush=True)
        time.sleep(3600)


threading.Thread(target=_janitor, name="janitor", daemon=True).start()
