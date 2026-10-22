"""Shared backend configuration (single source of truth).

Loads ``backend/.env`` if present (git-ignored; see .env.example), reads
MySQL settings from the environment, and validates them. There is
intentionally **no default password**: a historical personal password was
removed from the code and must not come back.

Consumers: ``main.py``, ``setup_db.py``, ``train_rl.py``.
"""
import os

from dotenv import load_dotenv

# Load backend/.env regardless of the launch directory.
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "dynamic_pricing")


class ConfigError(RuntimeError):
    """Raised when required configuration is missing."""


def validate_db_password():
    """Fail loudly and early if the MySQL password is not configured."""
    if not DB_PASS:
        raise ConfigError(
            "DB_PASS is not configured. Copy backend/.env.example to "
            "backend/.env and set DB_PASS; the code has no password default."
        )


DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
