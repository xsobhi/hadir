"""Runtime settings, read once from the environment (and an optional .env next to the backend)."""
from __future__ import annotations

import os
from pathlib import Path
from zoneinfo import ZoneInfo

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent


def _load_dotenv() -> None:
    # On the server the file lives outside the release folder, so a deploy never overwrites it.
    env_file = Path(os.environ.get("HADIR_ENV_FILE", BACKEND_DIR / ".env"))
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()

DATA_DIR = Path(os.environ.get("HADIR_DATA_DIR", BACKEND_DIR / "var"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "hadir.db"
CHECKPOINT_PATH = DATA_DIR / "agent-checkpoints.db"
WEB_DIST = Path(os.environ.get("HADIR_WEB_DIST", ROOT_DIR / "web" / "dist"))

TZ = ZoneInfo(os.environ.get("HADIR_TZ", "Asia/Gaza"))
PUBLIC_ORIGIN = os.environ.get("HADIR_PUBLIC_ORIGIN", "https://hadir.xsobhi.com")
COOKIE_SECURE = os.environ.get("HADIR_COOKIE_SECURE", "1") == "1"

LLM_API_KEY = os.environ.get("HADIR_LLM_API_KEY", "")
LLM_BASE_URL = os.environ.get("HADIR_LLM_BASE_URL", "https://api.deepseek.com")
LLM_MODEL = os.environ.get("HADIR_LLM_MODEL", "deepseek-chat")

# Abuse limits for a public demo: assistant turns per account per day, and for the whole site.
AGENT_DAILY_PER_USER = int(os.environ.get("HADIR_AGENT_DAILY_PER_USER", "40"))
AGENT_DAILY_GLOBAL = int(os.environ.get("HADIR_AGENT_DAILY_GLOBAL", "1500"))
DEMO_PER_IP_PER_HOUR = int(os.environ.get("HADIR_DEMO_PER_IP_PER_HOUR", "12"))
DEMO_TTL_HOURS = int(os.environ.get("HADIR_DEMO_TTL_HOURS", "48"))
SESSION_DAYS = 14
