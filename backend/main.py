from app.main import app
from telemetry import setup_telemetry

setup_telemetry(app)

__all__ = ["app", "setup_telemetry"]
