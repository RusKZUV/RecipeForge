import os
import time
from typing import Optional, Dict, Any, List
from opentelemetry import metrics

meter = metrics.get_meter("recipeforge", "0.1.0")

# Histogram bucket boundaries specified in requirements: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
HISTOGRAM_BUCKETS: List[float] = [0.01, 0.05, 0.1, 0.5, 1, 2, 5]


class CounterWrapper:
    """
    Wrapper around OpenTelemetry Counter providing compatibility with both
    standard OpenTelemetry methods (.add) and Prometheus-style methods (.inc, .labels).
    """
    def __init__(self, otel_counter, default_labels: Optional[Dict[str, str]] = None):
        self._otel_counter = otel_counter
        self._default_labels = default_labels or {}

    def add(self, amount: int = 1, attributes: Optional[Dict[str, Any]] = None) -> None:
        attrs = {**self._default_labels, **(attributes or {})}
        self._otel_counter.add(amount, attrs if attrs else None)

    def inc(self, amount: int = 1) -> None:
        self.add(amount, self._default_labels)

    def labels(self, **kwargs) -> "CounterWrapper":
        return CounterWrapper(self._otel_counter, default_labels={**self._default_labels, **kwargs})

    def __getattr__(self, name: str):
        return getattr(self._otel_counter, name)


class HistogramWrapper:
    """
    Wrapper around OpenTelemetry Histogram providing compatibility with both
    standard OpenTelemetry methods (.record) and Prometheus-style methods (.observe, .labels, .time).
    """
    def __init__(self, otel_histogram, buckets: Optional[List[float]] = None, default_labels: Optional[Dict[str, str]] = None):
        self._otel_histogram = otel_histogram
        self.buckets = buckets or HISTOGRAM_BUCKETS
        self._default_labels = default_labels or {}

    def record(self, amount: float, attributes: Optional[Dict[str, Any]] = None) -> None:
        attrs = {**self._default_labels, **(attributes or {})}
        self._otel_histogram.record(amount, attrs if attrs else None)

    def observe(self, amount: float) -> None:
        self.record(amount, self._default_labels)

    def labels(self, **kwargs) -> "HistogramWrapper":
        return HistogramWrapper(self._otel_histogram, buckets=self.buckets, default_labels={**self._default_labels, **kwargs})

    def time(self):
        class TimerContext:
            def __init__(self, histogram):
                self._histogram = histogram
                self._start = None

            def __enter__(self):
                self._start = time.perf_counter()
                return self

            def __exit__(self, exc_type, exc_val, exc_tb):
                duration = time.perf_counter() - self._start
                self._histogram.record(duration)

        return TimerContext(self)

    def __getattr__(self, name: str):
        return getattr(self._otel_histogram, name)


# 1. recipeforge_recipes_created_total (Counter, label environment)
_raw_recipes_created = meter.create_counter(
    name="recipeforge_recipes_created_total",
    description="Total number of recipes created",
    unit="1",
)
recipeforge_recipes_created_total = CounterWrapper(_raw_recipes_created)

# 2. recipeforge_pantry_match_requests_total (Counter)
_raw_pantry_match_requests = meter.create_counter(
    name="recipeforge_pantry_match_requests_total",
    description="Total number of pantry match requests",
    unit="1",
)
recipeforge_pantry_match_requests_total = CounterWrapper(_raw_pantry_match_requests)

# 3. recipeforge_pantry_match_duration_seconds (Histogram, buckets [0.01, 0.05, 0.1, 0.5, 1, 2, 5])
_raw_pantry_match_duration = meter.create_histogram(
    name="recipeforge_pantry_match_duration_seconds",
    description="Duration of pantry matching process in seconds",
    unit="s",
)
recipeforge_pantry_match_duration_seconds = HistogramWrapper(_raw_pantry_match_duration, buckets=HISTOGRAM_BUCKETS)
