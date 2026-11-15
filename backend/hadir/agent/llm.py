"""The chat model behind the assistant: any OpenAI-compatible endpoint (DeepSeek by default)."""
from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI

from ..config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL


@lru_cache(maxsize=4)
def chat_model(temperature: float = 0.2, max_tokens: int = 1200) -> ChatOpenAI:
    if not LLM_API_KEY:
        raise RuntimeError("HADIR_LLM_API_KEY is not set")
    return ChatOpenAI(
        model=LLM_MODEL, base_url=LLM_BASE_URL, api_key=LLM_API_KEY,
        temperature=temperature, max_tokens=max_tokens, timeout=60, max_retries=2,
        streaming=True,
    )
