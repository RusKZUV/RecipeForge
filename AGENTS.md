# RecipeForge

Web app that helps budget-conscious students cook affordable meals from ingredients they already have.
Product plan: `docs/plan.md`. Read `docs/process.md` before starting any task.

## Commands
- Backend: `cd backend && uv sync`, `uv run pytest`, `uv run uvicorn app.main:app --reload --port 8091`
- Frontend: `cd frontend && npm i && npm run dev`, `npm test`
- Root `Makefile`: `make run`, `make test`, `make seed`, `make seed-check`
- Windows without `make`: also keep equivalent `run.cmd`, `test.cmd`, `seed.cmd` scripts in the repo root

## Rules
- Stack: React + TypeScript + Vite (frontend), FastAPI + Pydantic (backend), SQLAlchemy 2.x + SQLite.
- Database URL comes from env `DATABASE_URL`. Use the ORM only. No SQLite-specific SQL or features.
- The frontend talks to the backend ONLY through `frontend/src/services` (mock client or real client, switched by config).
- `openapi.yaml` in the repo root is the API contract. Keep it in sync with the backend.
- Money is stored as integer tenge (KZT) or Decimal. Never float.
- Expiry dates are compared by the user's calendar date in Almaty time (UTC+5), not server UTC.
- Scoring weights, thresholds and limits live in config, not hard-coded.
- Do not add a dependency without asking.
- Commit regularly with clear messages.
- Never claim an ingredient is safe to eat or a recipe is allergen-safe.

## Documents
- `docs/process.md` - workflow, roles, orchestrator (READ FIRST)
- `docs/plan.md` - product plan and specification (source of truth for behavior)
- `docs/task-template.md` - issue template
- `docs/team/pm.md`, `docs/team/software-engineer.md`, `docs/team/qa-engineer.md` - role definitions
- `docs/testing-guidelines.md` - testing strategy and checklist (read before writing tests)
- `docs/design-system.md` - design tokens and rules (read before UI work)
- `openapi.yaml` - API contract (keep in sync with backend)
- `brainstorm.md` - original brainstorming chat (do not edit)
