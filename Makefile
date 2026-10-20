.PHONY: run test seed seed-check run-backend run-frontend test-backend test-frontend

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
