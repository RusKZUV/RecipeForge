from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from app.expiry import compute_expiry_status
from app.config import ALMATY_TZ


def test_expiry_status_calculations():
    # Fixed Almaty time: 2026-10-20 14:00:00 UTC+5
    fixed_now = datetime(2026, 10, 20, 14, 0, 0, tzinfo=ALMATY_TZ)

    assert compute_expiry_status(None, fixed_now) == "fresh"
    assert compute_expiry_status("", fixed_now) == "fresh"
    assert compute_expiry_status("2026-10-20", fixed_now) == "expires_today"
    assert compute_expiry_status("2026-10-21", fixed_now) == "expiring_soon"
    assert compute_expiry_status("2026-10-23", fixed_now) == "expiring_soon"
    assert compute_expiry_status("2026-10-24", fixed_now) == "fresh"
    assert compute_expiry_status("2026-10-19", fixed_now) == "expired"


def test_almaty_midnight_boundary():
    # 23:59:59 on 2026-10-20 in Almaty
    just_before_midnight = datetime(2026, 10, 20, 23, 59, 59, tzinfo=ALMATY_TZ)
    assert compute_expiry_status("2026-10-20", just_before_midnight) == "expires_today"

    # 00:00:01 on 2026-10-21 in Almaty (which is 19:00:01 on Oct 20 in UTC)
    just_after_midnight = datetime(2026, 10, 21, 0, 0, 1, tzinfo=ALMATY_TZ)
    # The item with expires_on "2026-10-20" is now expired in Almaty calendar!
    assert compute_expiry_status("2026-10-20", just_after_midnight) == "expired"
