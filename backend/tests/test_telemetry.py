import os
from unittest.mock import patch
from fastapi import FastAPI
from opentelemetry import trace, metrics
from telemetry import setup_telemetry


def test_setup_telemetry_configures_providers():
    test_app = FastAPI()
    
    with patch.dict(os.environ, {
        "OTEL_SERVICE_NAME": "recipeforge-backend",
        "ENVIRONMENT": "development",
        "OTEL_EXPORTER_OTLP_ENDPOINT": "http://otel-collector:4317"
    }):
        setup_telemetry(test_app)
        
        assert getattr(test_app.state, "telemetry_initialized", False) is True
        
        # Verify TracerProvider is configured with expected resource
        tracer_provider = trace.get_tracer_provider()
        resource_attrs = tracer_provider.resource.attributes
        assert resource_attrs.get("service.name") == "recipeforge-backend"
        assert resource_attrs.get("deployment.environment") == "development"
        
        # Verify idempotency
        setup_telemetry(test_app)
        assert getattr(test_app.state, "telemetry_initialized", False) is True


def test_backend_main_shim_imports_and_instruments():
    import main as backend_main
    assert hasattr(backend_main, "app")
    assert hasattr(backend_main, "setup_telemetry")
    assert getattr(backend_main.app.state, "telemetry_initialized", False) is True
