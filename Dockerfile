# ==============================================================================
# RecipeForge Multi-Stage Production Dockerfile
# Stage 1 (Node): Build the React frontend
# Stage 2 (Python): Serve backend API & compiled frontend static assets on port 8000
# ==============================================================================

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy frontend source and compile production assets
COPY frontend/ ./
ENV VITE_USE_MOCK_API=false
ENV VITE_API_URL=
RUN npm run build

# Stage 2: Python Backend & Static Asset Serving
FROM python:3.12-slim AS runner
WORKDIR /app

# Runtime configuration
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    STATIC_DIR=/app/static

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/app/ ./app/
COPY backend/pyproject.toml ./

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /frontend/dist ./static

# Expose application port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run Uvicorn server on port 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
