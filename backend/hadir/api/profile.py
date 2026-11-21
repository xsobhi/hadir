"""The signed-in user's local profile and a small, re-encoded profile picture."""
from __future__ import annotations

import base64
import binascii
import io
import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field

from ..auth import current_user, public_user
from ..db import tx

router = APIRouter(prefix="/api/profile")


class ProfileIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=80)
    title: str = Field(default="", max_length=80)
    department: str = Field(default="", max_length=120)
    gender: str = Field(default="", pattern="^(m|f|)$")


class PictureIn(BaseModel):
    image: str = Field(max_length=1_500_000)


@router.patch("")
def update_profile(body: ProfileIn, user: dict = Depends(current_user)):
    with tx() as db:
        db.execute("UPDATE users SET name=?, title=?, department=?, gender=? WHERE id=?",
                   (body.name, body.title, body.department, body.gender, user["id"]))
        saved = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    return {"user": public_user(saved)}


def _picture(value: str) -> bytes:
    header, sep, payload = value.partition(",")
    if not sep or header not in ("data:image/webp;base64", "data:image/png;base64", "data:image/jpeg;base64"):
        raise HTTPException(422, "bad_picture")
    try:
        raw = base64.b64decode(payload, validate=True)
        with Image.open(io.BytesIO(raw)) as img:
            if img.format not in ("WEBP", "PNG", "JPEG") or not (1 <= img.width <= 512 and 1 <= img.height <= 512):
                raise HTTPException(422, "picture_too_large")
            if getattr(img, "n_frames", 1) != 1:
                raise HTTPException(422, "bad_picture")
            img.load()
            # New pixels only: discard EXIF, comments and other original metadata.
            clean = Image.new("RGB", img.size, "white")
            rgba = img.convert("RGBA")
            clean.paste(rgba, mask=rgba.getchannel("A"))
            output = io.BytesIO()
            clean.save(output, format="WEBP", quality=90)
            return output.getvalue()
    except (ValueError, binascii.Error, UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise HTTPException(422, "bad_picture") from exc


@router.post("/avatar")
def save_picture(body: PictureIn, user: dict = Depends(current_user)):
    picture = _picture(body.image)
    with tx() as db:
        db.execute("UPDATE users SET avatar=?, avatar_version=? WHERE id=?",
                   (picture, secrets.token_hex(12), user["id"]))
        saved = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    return {"user": public_user(saved)}


@router.delete("/avatar")
def remove_picture(user: dict = Depends(current_user)):
    with tx() as db:
        db.execute("UPDATE users SET avatar=NULL, avatar_version='' WHERE id=?", (user["id"],))
        saved = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
    return {"user": public_user(saved)}


@router.get("/avatar")
def get_picture(user: dict = Depends(current_user)):
    if not user.get("avatar"):
        raise HTTPException(404, "not_found")
    return Response(user["avatar"], media_type="image/webp", headers={"Cache-Control": "private, no-store"})
