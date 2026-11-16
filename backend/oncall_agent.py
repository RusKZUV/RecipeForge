"""
On-call AI agent for RecipeForge alert triage.

Receives Alertmanager webhook payloads, queries Prometheus for recent metric
data, and returns a human-readable triage report.
"""

import logging
import urllib.request
import urllib.parse
import urllib.error
import json
from typing import Any

logger = logging.getLogger(__name__)

PROMETHEUS_URL = "http://prometheus:9090"


def _build_prometheus_query(alertname: str) -> str:
    """Return an appropriate PromQL expression for the given alert name."""
    if alertname == "HighPantryMatchLatency":
        return "histogram_quantile(0.95, rate(recipeforge_pantry_match_duration_seconds_bucket[5m]))"
    if alertname == "HighErrorRate":
        return (
            "sum(rate(http_server_request_duration_seconds_count"
            '{http_status_code=~"5.."}[5m]))'
        )
    # Fallback: query the metric whose name matches the alert
    return alertname


def _query_prometheus(expr: str) -> list[float]:
    """
    Issue an instant query to Prometheus and return all numeric sample values.

    Returns an empty list when Prometheus is unreachable or the query returns
    no data, so the rest of the agent degrades gracefully.
    """
    params = urllib.parse.urlencode({"query": expr})
    url = f"{PROMETHEUS_URL}/api/v1/query?{params}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            payload = json.loads(resp.read().decode())
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        logger.warning("Prometheus query failed (%s): %s", expr, exc)
        return []

    values: list[float] = []
    for result in payload.get("data", {}).get("result", []):
        # Instant query returns [timestamp, value] pairs
        raw = result.get("value", [None, None])[1]
        if raw is not None:
            try:
                values.append(float(raw))
            except (TypeError, ValueError):
                pass
    return values


def _compute_trend(values: list[float]) -> str:
    """Return a 'min / max / avg' trend string, or 'N/A' when no data."""
    if not values:
        return "N/A"
    v_min = min(values)
    v_max = max(values)
    v_avg = sum(values) / len(values)
    return f"min={v_min:.4f} / max={v_max:.4f} / avg={v_avg:.4f}"


def generate_triage_report(alert_data: dict[str, Any]) -> str:
    """
    Parse an Alertmanager webhook payload and return a triage report string.

    The function is intentionally synchronous and side-effect-free (aside from
    the outbound Prometheus HTTP call) so it is easy to unit-test.

    Parameters
    ----------
    alert_data:
        The decoded JSON body sent by Alertmanager.  Supports both the top-level
        envelope format (``{"alerts": [...]}`` with common labels) and a single
        alert dict directly.

    Returns
    -------
    str
        A report line per alert in the payload:
        ``"ALERT: [name], Severity: [sev], Trend: [min/max/avg]"``
    """
    # Alertmanager sends a list of alerts inside the envelope.
    # We also accept a bare dict for simpler testing / manual calls.
    alerts: list[dict[str, Any]] = alert_data.get("alerts", [alert_data])

    report_lines: list[str] = []
    for alert in alerts:
        labels: dict[str, str] = alert.get("labels", {})
        alertname: str = labels.get("alertname", alert.get("alertname", "Unknown"))
        severity: str = labels.get("severity", alert.get("severity", "unknown"))

        expr = _build_prometheus_query(alertname)
        try:
            values = _query_prometheus(expr)
        except Exception as exc:
            logger.warning("Unexpected error querying Prometheus for %s: %s", alertname, exc)
            values = []
        trend = _compute_trend(values)

        line = f"ALERT: {alertname}, Severity: {severity}, Trend: {trend}"
        report_lines.append(line)
        logger.info("Triage report generated — %s", line)

    return "\n".join(report_lines) if report_lines else "No alerts in payload."
