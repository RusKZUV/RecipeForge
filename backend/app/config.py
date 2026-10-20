import os
from datetime import datetime, timezone, timedelta

try:
    from zoneinfo import ZoneInfo
    ALMATY_TZ = ZoneInfo("Asia/Almaty")
except Exception:
    ALMATY_TZ = timezone(timedelta(hours=5), name="Almaty")

class AppConfig:
    PORT: int = int(os.getenv("PORT", "8091"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recipeforge.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "recipeforge-insecure-secret-key-change-me")
    TOKEN_EXPIRE_SECONDS: int = int(os.getenv("TOKEN_EXPIRE_SECONDS", "86400"))  # 24 hours
    
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


config = AppConfig()
