import os
from fastapi import FastAPI
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor


def setup_telemetry(app: FastAPI) -> None:
    """
    Configures OpenTelemetry tracing and metrics for the FastAPI application,
    exporting data to an OpenTelemetry Collector via OTLP/gRPC.
    """
    if getattr(app.state, "telemetry_initialized", False):
        return

    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")
    service_name = os.getenv("OTEL_SERVICE_NAME", "recipeforge-backend")
    environment = os.getenv("ENVIRONMENT", os.getenv("APP_ENV", "development"))

    resource = Resource.create(
        {
            "service.name": service_name,
            "deployment.environment": environment,
        }
    )

    insecure = not endpoint.startswith("https://")

    # Set up TracerProvider (BatchSpanProcessor -> OTLP gRPC)
    tracer_provider = TracerProvider(resource=resource)
    span_exporter = OTLPSpanExporter(endpoint=endpoint, insecure=insecure)
    tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))
    trace.set_tracer_provider(tracer_provider)

    # Set up MeterProvider (PeriodicExportingMetricReader -> OTLP gRPC)
    metric_exporter = OTLPMetricExporter(endpoint=endpoint, insecure=insecure)
    metric_reader = PeriodicExportingMetricReader(metric_exporter)
    meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
    metrics.set_meter_provider(meter_provider)

    # Instrument FastAPI application
    FastAPIInstrumentor.instrument_app(app)
    app.state.telemetry_initialized = True
