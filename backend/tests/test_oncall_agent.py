"""
Tests for the on-call AI agent (backend/oncall_agent.py) and the
POST /webhook/alert endpoint defined in app/main.py.
"""

import json
from unittest.mock import patch

import pytest


# ---------------------------------------------------------------------------
# oncall_agent unit tests
# ---------------------------------------------------------------------------


class TestGenerateTriageReport:
    """Pure unit tests — Prometheus calls are always mocked."""

    def _import(self):
        from oncall_agent import generate_triage_report  # noqa: PLC0415

        return generate_triage_report

    def test_single_alert_with_prometheus_data(self):
        generate_triage_report = self._import()
        payload = {
            "alerts": [
                {"labels": {"alertname": "HighPantryMatchLatency", "severity": "warning"}}
            ]
        }
        with patch("oncall_agent._query_prometheus", return_value=[0.5, 1.0, 2.0]):
            report = generate_triage_report(payload)

        assert "ALERT: HighPantryMatchLatency" in report
        assert "Severity: warning" in report
        assert "Trend:" in report
        assert "N/A" not in report

    def test_trend_values_min_max_avg(self):
        generate_triage_report = self._import()
        payload = {
            "alerts": [
                {"labels": {"alertname": "HighErrorRate", "severity": "critical"}}
            ]
        }
        with patch("oncall_agent._query_prometheus", return_value=[0.1, 0.3, 0.2]):
            report = generate_triage_report(payload)

        assert "min=0.1000" in report
        assert "max=0.3000" in report
        assert "avg=0.2000" in report

    def test_no_prometheus_data_shows_na(self):
        generate_triage_report = self._import()
        payload = {
            "alerts": [
                {"labels": {"alertname": "SomeAlert", "severity": "info"}}
            ]
        }
        with patch("oncall_agent._query_prometheus", return_value=[]):
            report = generate_triage_report(payload)

        assert "Trend: N/A" in report

    def test_multiple_alerts_produces_multiple_lines(self):
        generate_triage_report = self._import()
        payload = {
            "alerts": [
                {"labels": {"alertname": "AlertA", "severity": "critical"}},
                {"labels": {"alertname": "AlertB", "severity": "warning"}},
            ]
        }
        with patch("oncall_agent._query_prometheus", return_value=[1.0]):
            report = generate_triage_report(payload)

        lines = report.strip().splitlines()
        assert len(lines) == 2
        assert any("AlertA" in l for l in lines)
        assert any("AlertB" in l for l in lines)

    def test_empty_payload_returns_no_alerts_message(self):
        generate_triage_report = self._import()
        with patch("oncall_agent._query_prometheus", return_value=[]):
            report = generate_triage_report({})

        assert "No alerts in payload." in report or "ALERT:" in report

    def test_prometheus_unreachable_degrades_gracefully(self):
        """When Prometheus is down the agent must not raise — it returns N/A."""
        import urllib.error
        generate_triage_report = self._import()
        payload = {
            "alerts": [
                {"labels": {"alertname": "HighPantryMatchLatency", "severity": "warning"}}
            ]
        }
        with patch(
            "oncall_agent._query_prometheus",
            side_effect=urllib.error.URLError("connection refused"),
        ):
            # _query_prometheus already swallows URLError; this test ensures the
            # outer function also survives an unexpected exception from the helper.
            try:
                report = generate_triage_report(payload)
            except urllib.error.URLError:
                pytest.fail("generate_triage_report must not propagate network errors")

        assert "ALERT: HighPantryMatchLatency" in report

    def test_report_format(self):
        """Confirm the exact report format: 'ALERT: X, Severity: Y, Trend: Z'."""
        generate_triage_report = self._import()
        payload = {
            "alerts": [
                {"labels": {"alertname": "MyAlert", "severity": "critical"}}
            ]
        }
        with patch("oncall_agent._query_prometheus", return_value=[1.5]):
            report = generate_triage_report(payload)

        # Must start with ALERT:, contain Severity:, and contain Trend:
        assert report.startswith("ALERT:"), f"Unexpected format: {report}"
        assert ", Severity:" in report
        assert ", Trend:" in report


# ---------------------------------------------------------------------------
# /webhook/alert endpoint integration tests
# ---------------------------------------------------------------------------


class TestWebhookAlertEndpoint:
    def test_webhook_returns_200_with_report(self, client):
        alertmanager_body = {
            "version": "4",
            "groupLabels": {"alertname": "HighErrorRate"},
            "alerts": [
                {
                    "labels": {
                        "alertname": "HighErrorRate",
                        "severity": "critical",
                    },
                    "status": "firing",
                }
            ],
        }
        with patch("oncall_agent._query_prometheus", return_value=[0.08]):
            resp = client.post("/webhook/alert", json=alertmanager_body)

        assert resp.status_code == 200
        body = resp.json()
        assert "report" in body
        assert "ALERT: HighErrorRate" in body["report"]
        assert "Severity: critical" in body["report"]

    def test_webhook_empty_body_does_not_crash(self, client):
        with patch("oncall_agent._query_prometheus", return_value=[]):
            resp = client.post(
                "/webhook/alert",
                content=b"",
                headers={"content-type": "application/json"},
            )
        # May return 200 or 422 depending on FastAPI JSON parsing, but must not 500
        assert resp.status_code != 500

    def test_webhook_no_prometheus_still_returns_200(self, client):
        import urllib.error

        body = {
            "alerts": [
                {"labels": {"alertname": "HighPantryMatchLatency", "severity": "warning"}}
            ]
        }
        with patch(
            "oncall_agent._query_prometheus",
            side_effect=urllib.error.URLError("offline"),
        ):
            try:
                resp = client.post("/webhook/alert", json=body)
                assert resp.status_code == 200
            except urllib.error.URLError:
                pytest.fail("/webhook/alert must not propagate network errors")
