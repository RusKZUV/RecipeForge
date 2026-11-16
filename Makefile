.PHONY: run test seed seed-check run-backend run-frontend test-backend test-frontend docker-build docker-up docker-down docker-dev-up docker-dev-down docker-dev-logs docker-prod-up docker-prod-down docker-prod-logs

run:
	@echo "Starting RecipeForge services..."
	@powershell -Command "Start-Process -NoNewWindow uv -ArgumentList 'run', 'uvicorn', 'app.main:app', '--reload', '--port', '8091' -WorkingDirectory 'backend'; Set-Location 'frontend'; npm run dev"

run-backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8091

run-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && uv run pytest

test-frontend:
	cd frontend && npm test

seed:
	cd backend && uv run python -m app.seed

seed-check:
	cd backend && uv run python -m app.seed_check

# Development Docker Environment (docker-compose.dev.yml)
docker-dev-build:
	docker compose --env-file .env.dev -f docker-compose.dev.yml build

docker-dev-up:
	docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

docker-dev-down:
	docker compose --env-file .env.dev -f docker-compose.dev.yml down

docker-dev-logs:
	docker compose --env-file .env.dev -f docker-compose.dev.yml logs -f

# Production Docker Environment (docker-compose.prod.yml)
docker-prod-build:
	docker compose --env-file .env.prod -f docker-compose.prod.yml build

docker-prod-up:
	docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

docker-prod-down:
	docker compose --env-file .env.prod -f docker-compose.prod.yml down

docker-prod-logs:
	docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f

# Default shortcuts
docker-build: docker-dev-build
docker-up: docker-dev-up
docker-down: docker-dev-down
