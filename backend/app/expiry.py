from datetime import date, datetime
from typing import Optional
from app.config import config, ALMATY_TZ


def compute_expiry_status(expires_on_str: Optional[str], almaty_now: Optional[datetime] = None) -> str:
    if not expires_on_str:
        return "fresh"

    try:
        exp_date = date.fromisoformat(expires_on_str.strip())
    except Exception:
        return "fresh"

    if almaty_now is None:
        almaty_now = config.get_almaty_now()
    elif almaty_now.tzinfo is None:
        almaty_now = almaty_now.replace(tzinfo=ALMATY_TZ)

    today_almaty = almaty_now.astimezone(ALMATY_TZ).date()
    days_left = (exp_date - today_almaty).days

    if days_left < 0:
        return "expired"
    elif days_left == 0:
        return "expires_today"
    elif days_left <= config.EXPIRY_URGENCY_THRESHOLD_DAYS:
        return "expiring_soon"
    else:
        return "fresh"
