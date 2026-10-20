# AGENTS.md — Agent Operating Guide & Project Memory

This document is the **ultimate source of truth** and operational memory for autonomous and human agents working on **RecipeForge**. Read this file alongside `docs/process.md` and `docs/plan.md` before performing any task.

---

## 🎯 1. Project Mission & Tech Stack

### Mission
**RecipeForge** is a full-stack web application that helps budget-conscious students cook delicious, affordable meals using ingredients they already have in their pantry—saving money and dramatically reducing dorm food waste.

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Vitest, React Testing Library.
- **Backend**: FastAPI, Python 3.10+, Pydantic v2, pytest, `uv` package manager.
- **Database & ORM**: SQLite, SQLAlchemy 2.x (declarative ORM, strictly DBMS-agnostic).
- **Design System**: "Kitchen notebook" warm paper aesthetic (`#F6EFE2`), Fraunces serif headings, tactile cards, ink borders (`#2B2118`), and accessible status tokens.

### Core CLI Commands
- **Backend**:
  - Sync environment: `cd backend && uv sync`
  - Run tests: `cd backend && uv run pytest`
  - Start server: `cd backend && uv run uvicorn app.main:app --reload --port 8091`
  - Seed database: `cd backend && uv run python -m app.seed`
- **Frontend**:
  - Install dependencies: `cd frontend && npm install`
  - Run tests: `cd frontend && npm test`
  - Start dev server: `cd frontend && npm run dev`
  - Build production: `cd frontend && npm run build`
- **Root Automation Scripts**:
  - Cross-platform `Makefile`: `make run`, `make test`, `make seed`, `make seed-check`
  - Windows Command Scripts: `run.cmd` (concurrent launch), `test.cmd` (runs both test suites), `seed.cmd`

---

## 🔄 2. Strict Iteration Workflow (CRITICAL)

The project strictly adhered to a sequential 5-phase execution model. No phase was started before the previous phase was completely verified and passing:

1. **Iteration 1: Frontend with MockService (`iter-1-frontend`)**
   - Built complete user interface views: authentication, pantry management, recipe matches, shopping list, profile, and cook mode.
   - Decoupled from backend using an in-memory client (`MockApiService`) adhering to domain interfaces.
   - Verified with 20+ unit and component tests before backend scaffolding began.

2. **Iteration 2: API Contract Specification (`iter-2-contract`)**
   - Formalized the complete API contract in [`openapi.yaml`](openapi.yaml) at repo root.
   - Specified request/response schemas, validation rules, status codes (401, 403, 404, 422), and integer KZT currency formats.
   - Acted as the authoritative contract binding frontend and backend.

3. **Iteration 3: Backend with In-Memory Storage (`iter-3-backend-memory`)**
   - Scaffolded FastAPI backend on port 8091 with `uv`.
   - Implemented in-memory stores for authentication, catalog normalization, Almaty-timezone expiry calculation, recipe matching with Balanced scoring, and shopping lists.
   - Table-driven unit tests verified business algorithms independently of persistence.

4. **Iteration 4: Backend with SQLite Storage (`iter-4-sqlite`)**
   - Designed SQLAlchemy 2.x declarative ORM models and database engine driven by `DATABASE_URL`.
   - Replaced in-memory stores with persistent SQLAlchemy repository layers.
   - Created idempotent seeder (`app.seed`) populating 80 catalog ingredients and 25 seed recipes, verified with `make seed-check`.

5. **Iteration 5: Frontend + Backend Integration & CORS (`iter-5-integration`)**
   - Implemented `HttpApiService` in `frontend/src/services/httpApi.ts` matching `openapi.yaml`.
   - Wired live authentication, session persistence, bearer token headers, and CORS on port 8091.
   - Verified end-to-end pantry-to-recipe-to-cooking user journeys across live frontend and SQLite backend.

### Multi-Agent Lifecycle
- **Orchestrator**: Dispatches tasks sequentially and never implements or tests directly.
- **Product Manager (PM)**: Grooms issues using `docs/task-template.md`, adds checkable criteria, and bounds scope without modifying code (`docs/team/pm.md`).
- **Software Engineer**: Implements strictly against acceptance criteria, respects architectural boundaries, runs tests, and leaves issues OPEN (`docs/team/software-engineer.md`).
- **QA Engineer**: Verifies work live, adds regression tests, posts `## QA: PASS` / `## QA: FAIL`, and is the ONLY agent permitted to close issues (`docs/team/qa-engineer.md`).

---

## 📐 3. Development & Code Conventions

### Clean Architecture
- **Layering**: `Routers -> Services / Business Logic -> Repositories / ORM Models`.
- **Router Responsibilities**: Parameter validation, dependency injection (DB sessions, current user), HTTP status codes.
- **Service Responsibilities**: Pure business logic (matching formula, urgency calculation, unit conversions, pantry deductions).
- **Repository Responsibilities**: Database queries, relationship joins, transactional consistency.

### Frontend Service Layer Abstraction
- **Rule**: The frontend communicates with the backend **ONLY** through `frontend/src/services`.
- **Switching**: Service factory switches between `MockApiService` and `HttpApiService` based on `VITE_USE_MOCK_API`. Components never call `fetch` or `axios` directly.

### DBMS-Agnostic Database Rules
- **ORM Only**: Use SQLAlchemy 2.x ORM queries and expressions exclusively.
- **No Raw SQL**: Raw SQL queries or SQLite-specific dialect features are strictly forbidden.
- **Configurable Connection**: Connection string is read dynamically from `DATABASE_URL` (defaults to `sqlite:///./recipeforge.db`). Schema creation uses `Base.metadata.create_all(bind=engine)`.

### Financial & Timezone Rules
- **Money as Integer KZT**: Currency is stored and computed strictly as integer Kazakhstani Tenge (KZT ₸) or `Decimal`. Never use floating-point types (`float`) for monetary values.
- **Almaty Midnight (UTC+5)**: Expiry statuses (`fresh`, `expiring_soon`, `expires_today`, `expired`) must be calculated relative to the user's calendar date in Almaty time (UTC+5), not server UTC. Injected clocks are used in testing.
- **Scoring Formulas**: Scoring weights (`0.45, 0.25, 0.20, 0.10`) and thresholds (reference budget `3000 KZT`) reside in configuration constants, not hard-coded values.
- **Food Safety Disclaimer**: Never claim an ingredient is guaranteed safe to eat or a recipe is allergen-safe.

---

## 🗺️ 4. Directory Map

```
RecipeForge/
├── backend/
│   ├── app/
│   │   ├── routers/        # FastAPI endpoint handlers (auth, pantry, recipes, matches, shopping, cook)
│   │   ├── auth.py         # Password hashing (pbkdf2/bcrypt), JWT token generation, auth dependencies
│   │   ├── database.py     # SQLAlchemy engine, sessionmaker, get_db dependency
│   │   ├── models.py       # Declarative ORM models (User, Ingredient, PantryItem, Recipe, etc.)
│   │   ├── schemas.py      # Pydantic v2 request/response validation schemas
│   │   ├── expiry.py       # Almaty-timezone (UTC+5) expiration status engine
│   │   ├── seed.py         # 80 catalog ingredients and 25 seed recipes loader
│   │   ├── seed_check.py   # Integrity validator for seed data
│   │   └── main.py         # Application factory, CORS middleware, lifespan events
│   └── tests/              # Pytest test suite (CRUD, isolation, scoring, seeder)
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable and feature UI components
│   │   │   ├── auth/       # Login, registration, and auth screens
│   │   │   ├── layout/     # TopNav, BottomNav, notebook container Layout
│   │   │   ├── profile/    # Dietary filters, equipment selection, staples
│   │   │   ├── recipes/    # RecipeDetailsModal and recipe display components
│   │   │   └── ui/         # Design system primitives (Button, Card, Badge, Input)
│   │   ├── context/        # AuthContext and global authentication state
│   │   ├── services/       # Service interfaces, MockApiService, HttpApiService, factory
│   │   ├── styles/         # CSS variables, color tokens, typography
│   │   ├── types/          # TypeScript domain models and API contracts
│   │   ├── App.tsx         # Main interactive notebook container
│   │   └── App.test.tsx    # Frontend component and integration tests
├── docs/
│   ├── plan.md             # Authoritative product specifications and behavior requirements
│   ├── process.md          # Multi-agent development lifecycle and orchestrator rules
│   ├── task-template.md    # Template for grooming GitHub issues
│   ├── testing-guidelines.md # Testing guidelines, manual QA checklist, bug-derived test cases
│   ├── design-system.md    # Design system tokens, color palettes, typographic guidelines
│   └── team/               # Role definitions (pm.md, software-engineer.md, qa-engineer.md)
├── openapi.yaml            # Complete OpenAPI 3.0 contract definition
├── Makefile                # Cross-platform project automation
├── run.cmd / test.cmd      # Windows developer automation scripts
└── README.md               # User-facing project documentation
```

---

## 📝 5. Change Log & Agent Notes

Major milestones and historical agent actions:

1. **Repository Inception & Issue Backlog**:
   - Initialized project repository and established core guidelines.
   - Generated 31 GitHub issues spanning MVP and Post-MVP phases according to `docs/plan.md`.

2. **Full Mock Frontend (Iteration 1)**:
   - Scaffolding with Vite, React 18, TypeScript, and Vitest.
   - Created full Kitchen Notebook design system with tactile tokens.
   - Built UI components for auth, pantry, matches, shopping, and cook wizard using `MockApiService`.

3. **OpenAPI Specification (Iteration 2)**:
   - Authored complete `openapi.yaml` contract defining all request schemas, response codes, and KZT integer pricing.

4. **FastAPI Backend with In-Memory Storage (Iteration 3)**:
   - Implemented in-memory stores for multi-tenant users, pantry items, catalog ingredients, and recipe matching engine.
   - Verified Almaty midnight boundary logic and deterministic 4-factor scoring formulas.

5. **SQLite Persistence with SQLAlchemy ORM (Iteration 4)**:
   - Defined declarative ORM entities with relationship cascades and foreign keys.
   - Created idempotent seed script (`app.seed`) populating 80 ingredients and 25 recipes.
   - Migrated backend routers to persistent SQLAlchemy sessions.

6. **Frontend + Backend Integration (Iteration 5)**:
   - Built `HttpApiService` with bearer token authentication headers.
   - Configured CORS and connected React UI to FastAPI backend on port 8091.
   - Verified end-to-end pantry additions, recipe recommendations, and shopping lists.

7. **Bug Fix #32 — Quick Item Search Responsiveness (`user-test-bug`)**:
   - Resolved unresponsive "Add item" button in Pantry Quick Item Search.
   - Added validation feedback, in-flight disabled states, automatic input clearing, and error alerting.

8. **Bug Fix #33 — Recipe Card Clickability & Details Modal (`user-test-bug`)**:
   - Added `role="button"`, `tabIndex={0}`, keyboard navigation (`Enter`/`Space`), and pointer styling to recipe cards.
   - Implemented `RecipeDetailsModal` fetching `GET /recipes/{id}` with full ingredients, steps, timers, equipment, and dismissal via close button, backdrop, or Escape key.

9. **Feature #34 — Pantry Deletion & Recipe Missing to Shopping (`mvp`)**:
   - Added trash icon button (`🗑️`) to Pantry items triggering `DELETE /pantry/{id}` with immediate UI updates.
   - Added "Add missing to Shopping" button in `RecipeDetailsModal` calculating missing required ingredients (excluding staples) and populating the shopping list.
   - Implemented Shopping tab item removal (`DELETE /shopping/{id}`) and "mark as bought" transfer into pantry inventory (`POST /shopping/{id}/bought`).
   - Verified multi-tenant isolation across all pantry and shopping operations.

10. **Comprehensive Documentation & Quality Assurance**:
    - Completely upgraded `README.md` to top-tier GitHub standards.
    - Verified all test suites passing: **107 frontend tests** (`npm test`), **15 backend tests** (`uv run pytest`).
    - Successfully closed all 34 GitHub issues with verified `## QA: PASS` comments.
