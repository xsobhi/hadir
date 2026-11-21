"""Shared validation for adding and editing a student."""
from pydantic import BaseModel, ConfigDict, Field, field_validator


def clean_number(raw: str) -> str:
    return "".join(ch for ch in raw if ch.isalnum())[:32]


class StudentIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    number: str = Field(min_length=3, max_length=32)
    nameAr: str = Field(min_length=2, max_length=80)
    nameEn: str = Field(default="", max_length=80)
    major: str = Field(default="", max_length=80)
    year: int = Field(default=1, ge=1, le=7)
    gender: str = Field(default="", pattern="^(m|f|)$")

    @field_validator("number")
    @classmethod
    def valid_number(cls, value: str) -> str:
        number = clean_number(value)
        if len(number) < 3:
            raise ValueError("bad_number")
        return number
