import sys
from pathlib import Path

# Add backend directory to sys.path if not present
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from metrics import (
    recipeforge_recipes_created_total,
    recipeforge_pantry_match_requests_total,
    recipeforge_pantry_match_duration_seconds,
    HISTOGRAM_BUCKETS,
)

__all__ = [
    "recipeforge_recipes_created_total",
    "recipeforge_pantry_match_requests_total",
    "recipeforge_pantry_match_duration_seconds",
    "HISTOGRAM_BUCKETS",
]
