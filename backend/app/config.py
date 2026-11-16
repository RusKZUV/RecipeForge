import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

try:
    from zoneinfo import ZoneInfo
    ALMATY_TZ = ZoneInfo("Asia/Almaty")
except Exception:
    ALMATY_TZ = timezone(timedelta(hours=5), name="Almaty")


def load_environment() -> None:
    """
    Loads environment variables from .env.dev or .env.prod based on ENVIRONMENT/APP_ENV,
    without overriding variables already set in the execution environment (Docker/CI).
    """
    env_file = os.getenv("ENV_FILE")
    if env_file and Path(env_file).is_file():
        load_dotenv(dotenv_path=env_file, override=False)
        return

    current_dir = Path(__file__).resolve().parent
    project_root = current_dir.parent.parent  # backend/app -> backend -> root

    app_env = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).lower()

    if app_env in ("production", "prod"):
        candidates = [project_root / ".env.prod", current_dir / ".env.prod", Path(".env.prod")]
    else:
        candidates = [project_root / ".env.dev", current_dir / ".env.dev", Path(".env.dev")]

    for candidate in candidates:
        if candidate.is_file():
            load_dotenv(dotenv_path=candidate, override=False)
            break

    # Also load generic .env if present
    for generic in [project_root / ".env", current_dir / ".env", Path(".env")]:
        if generic.is_file():
            load_dotenv(dotenv_path=generic, override=False)
            break


load_environment()


class AppConfig:
    @property
    def ENVIRONMENT(self) -> str:
        return os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development")).lower()

    @property
    def DEBUG(self) -> bool:
        default_debug = "false" if self.ENVIRONMENT in ("production", "prod") else "true"
        return os.getenv("DEBUG", default_debug).lower() in ("true", "1", "yes")

    @property
    def PORT(self) -> int:
        default_port = "8000" if self.ENVIRONMENT in ("production", "prod") else "8091"
        return int(os.getenv("PORT", default_port))

    @property
    def DATABASE_URL(self) -> str:
        return os.getenv("DATABASE_URL", "sqlite:///./recipeforge.db")

    @property
    def JWT_SECRET(self) -> str:
        return os.getenv("JWT_SECRET", "recipeforge-insecure-secret-key-change-me")

    @property
    def TOKEN_EXPIRE_SECONDS(self) -> int:
        return int(os.getenv("TOKEN_EXPIRE_SECONDS", "86400"))  # 24 hours

    @property
    def CORS_ORIGINS(self) -> list[str]:
        default = (
            "http://localhost:8000,http://127.0.0.1:8000"
            if self.ENVIRONMENT in ("production", "prod")
            else "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8091"
        )
        raw = os.getenv("CORS_ORIGINS", default)
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    # Scoring config (from docs/plan.md Section 6.5)
    WEIGHT_COVERAGE: float = 0.45
    WEIGHT_URGENCY: float = 0.25
    WEIGHT_MISSING_COST: float = 0.20
    WEIGHT_FIT: float = 0.10

    REFERENCE_BUDGET_KZT: int = 3000
    EXPIRY_URGENCY_THRESHOLD_DAYS: int = 3
    MIN_COVERAGE_FILTER_DEFAULT: float = 0.30
    DEFAULT_PAGE_SIZE: int = 12
    MAX_PAGE_SIZE: int = 50
    SUBSTITUTION_QUALITY_CAP: float = 0.80

    @classmethod
    def get_almaty_now(cls) -> datetime:
        return datetime.now(ALMATY_TZ)

    def validate_safety(self) -> None:
        """
        Critical safety guard ensuring dev/test environment NEVER accidentally
        connects to or mutates a production database.
        """
        env = self.ENVIRONMENT
        db = self.DATABASE_URL.lower()

        if env in ("development", "dev", "local", "test"):
            prod_indicators = ["recipeforge_prod", "prod_db", "prod-db"]
            for indicator in prod_indicators:
                if indicator in db:
                    raise RuntimeError(
                        f"CRITICAL SAFETY VIOLATION: Environment is configured as '{env}', "
                        f"but DATABASE_URL points to a production database target ('{self.DATABASE_URL}'). "
                        "Dev configuration is strictly prohibited from writing to or connecting to production databases."
                    )


config = AppConfig()
