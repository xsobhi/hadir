"""Sign up, sign in, the one-click demo workspace, and sign out."""
from __future__ import annotations

import re
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from ..auth import client_ip, current_user, end_session, hash_password, public_user, start_session, verify_password
from ..config import DEMO_PER_IP_PER_HOUR
from ..db import now_iso, tx
from ..ratelimit import hit
from ..seed import create_demo_workspace

router = APIRouter(prefix="/api/auth")
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SignUp(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(max_length=120)
    password: str = Field(min_length=8, max_length=200)
    department: str = Field(default="", max_length=120)


class SignIn(BaseModel):
    email: str
    password: str


class Demo(BaseModel):
    lang: str = "ar"


@router.post("/register")
def register(body: SignUp, request: Request, response: Response):
    email = body.email.strip().lower()
    if not EMAIL.match(email):
        raise HTTPException(422, "bad_email")
    if not hit("register", client_ip(request), 10, timedelta(hours=1)):
        raise HTTPException(429, "too_many")
    with tx() as db:
        if db.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
            raise HTTPException(409, "email_taken")
        user_id = db.execute(
            "INSERT INTO users (name, email, password_hash, department, created_at) VALUES (?, ?, ?, ?, ?)",
            (body.name.strip(), email, hash_password(body.password), body.department.strip(), now_iso()),
        ).lastrowid
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    start_session(response, user_id)
    return {"user": public_user(user)}


@router.post("/login")
def login(body: SignIn, request: Request, response: Response):
    if not hit("login", client_ip(request), 20, timedelta(minutes=15)):
        raise HTTPException(429, "too_many")
    with tx() as db:
        user = db.execute("SELECT * FROM users WHERE email = ? AND is_demo = 0",
                          (body.email.strip().lower(),)).fetchone()
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "wrong_credentials")
    start_session(response, user["id"])
    return {"user": public_user(user)}


@router.post("/demo")
def demo(body: Demo, request: Request, response: Response):
    if not hit("demo", client_ip(request), DEMO_PER_IP_PER_HOUR, timedelta(hours=1)):
        raise HTTPException(429, "too_many")
    user_id = create_demo_workspace("en" if body.lang == "en" else "ar")
    with tx() as db:
        user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    start_session(response, user_id)
    return {"user": public_user(user)}


@router.get("/me")
def me(user: dict = Depends(current_user)):
    return {"user": public_user(user)}


@router.post("/logout")
def logout(request: Request, response: Response):
    end_session(request, response)
    return {"ok": True}
