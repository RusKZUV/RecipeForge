# 🍳 RecipeForge

> **Smart dorm cooking from ingredients you already have.**  
> RecipeForge is a full-stack web application designed to help budget-conscious students cook delicious, affordable meals using what's already in their pantry—saving money and dramatically reducing food waste.

---

## 🚀 Overview

RecipeForge solves a real problem: students waste food and money because they don't know what to cook with whatever random ingredients are sitting in their kitchen. 

### Key Highlights
- 🥫 **Pantry Tracking**: Track available stock with real-time expiry dates calculated in Almaty time (UTC+5).
- 🎯 **Balanced Match Engine**: Deterministic 4-factor scoring (`0.45 * coverage + 0.25 * urgency + 0.20 * missing_cost + 0.10 * fit`) ranked with ingredient substitutions and dietary preferences.
- 🛒 **Budget Shopping List**: 1-click addition of missing ingredients from recipe details with duplicate merging, staple exclusion, and KZT (₸) price estimates.
- ⏱️ **Cook Mode**: Step-by-step guidance with parallel countdown timers and atomic pantry inventory deduction upon completion.
- 🎨 **Kitchen Notebook Design**: Handcrafted warm-paper aesthetic with tactile cards, Fraunces serif headings, and accessible color tokens.

---

## 🛠️ Architecture & Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | Responsive UI, service layer abstraction, mock-to-real API switch |
| **Backend** | FastAPI, Python 3.10+, Pydantic v2 | Clean architecture: Routers -> Services -> Repositories |
| **Database & ORM** | SQLite, SQLAlchemy | Normalized relational model: `pantry_items`, `recipes`, `constraints` |

### Architectural Principles
- **Clean Service Boundaries**: The frontend communicates with the backend exclusively via an interchangeable service layer (`frontend/src/services`), effortlessly toggled between `MockApiService` and `HttpApiService`.
- **API-First Contract**: Complete OpenAPI 3.0 contract formalized in [`openapi.yaml`](openapi.yaml) keeping frontend and backend synchronized.
- **Financial & Time Accuracy**: All prices and costs are tracked strictly in integer Kazakhstani Tenge (KZT ₸) or `Decimal`—never floating-point numbers. Expiration status uses injectable time boundaries relative to Almaty midnight.
- **Strict Multi-Tenancy**: Data access across pantry, recipes, and shopping lists is strictly partitioned by user identity.

---

## 🤖 AI-Native Workflow

RecipeForge was engineered from the ground up using an **AI-native autonomous agent workflow**:
- **Specification-Driven**: Grounded in comprehensive behavioral specifications in [`docs/plan.md`](docs/plan.md).
- **GitHub Issues Backlog**: Backlog managed strictly via GitHub issues tagged by scope (`mvp`, `user-test-bug`) and development phase.
- **Multi-Agent Pair Programming**: Orchestrated role-specialized subagents adhering to [`AGENTS.md`](AGENTS.md) and [`docs/process.md`](docs/process.md):
  - 📋 **Product Manager (PM)**: Grooms issues, specifies checkable acceptance criteria, and bounds scope without modifying code ([`docs/team/pm.md`](docs/team/pm.md)).
  - 💻 **Software Engineer**: Implements groomed criteria, enforces architectural boundaries, and writes tests ([`docs/team/software-engineer.md`](docs/team/software-engineer.md)).
  - 🧪 **QA Engineer**: Validates against acceptance criteria on running services, executes test suites, documents regression cases, and closes issues on PASS ([`docs/team/qa-engineer.md`](docs/team/qa-engineer.md)).

---

## 💻 Local Setup & Run

### Prerequisites
- **Python**: 3.10 or higher & [`uv`](https://github.com/astral-sh/uv)
- **Node.js**: v18+ & `npm`
- **Git**

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies and sync virtual environment
uv sync

# Run database seeder (seeds 80 catalog ingredients & 25 starter recipes)
uv run python -m app.seed

# Start the FastAPI development server
uv run uvicorn app.main:app --reload --port 8091
```

The backend API will be running at `http://localhost:8091` (interactive Swagger documentation available at `http://localhost:8091/docs`).

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### ⚡ Quick Start (Windows)
For single-command startup on Windows:
```cmd
run.cmd
```
*(Runs backend on port 8091 and frontend on port 5173 concurrently).*

---

## 🐳 Docker Environments (Development & Production)

RecipeForge provides strictly decoupled, isolated environments for local development and production deployments.

### Environment Matrix & Isolation Safeguards

| Feature / Variable | Development (`docker-compose.dev.yml`) | Production (`docker-compose.prod.yml`) |
| :--- | :--- | :--- |
| **Config File** | `docker-compose.dev.yml` | `docker-compose.prod.yml` |
| **Env File** | `.env.dev` | `.env.prod` |
| **`ENVIRONMENT` / `DEBUG`** | `development` / `true` | `production` / `false` |
| **App Port (Host)** | `8091` | `8000` |
| **PostgreSQL Port (Host)** | `5433` (avoids port collisions) | `127.0.0.1:5432` (loopback only) |
| **Container Names** | `recipeforge-app-dev`, `recipeforge-db-dev` | `recipeforge-app-prod`, `recipeforge-db-prod` |
| **Database & User** | `recipeforge_dev_db` / `recipeforge_dev_user` | `recipeforge_prod_db` / `recipeforge_prod_user` |
| **Named Storage Volume** | `recipeforge_postgres_dev_data` | `recipeforge_postgres_prod_data` |
| **Docker Network** | `recipeforge_dev_net` (isolated bridge) | `recipeforge_prod_net` (isolated bridge) |
| **Code Mounting** | `./backend/app:/app/app` (hot-reload enabled) | Immutable build from `Dockerfile` |
| **CORS Origins** | `http://localhost:5173,http://localhost:3000,http://localhost:8091` | `http://localhost:8000,http://127.0.0.1:8000` |
| **Database Safeguard** | 🛡️ Runtime safety guard aborts if prod DB targeted | 🔒 Dedicated credentials & isolated network |

> [!IMPORTANT]
> **Production Protection Guarantee**: Dev configurations can never accidentally mutate the production database. Protection is enforced on 4 independent layers:
> 1. **Runtime Safety Guard**: `backend/app/config.py` validates `DATABASE_URL` upon application startup. If `ENVIRONMENT=development` and the database URL contains production targets (`recipeforge_prod`, `prod_db`), the application immediately halts with a `RuntimeError`.
> 2. **Network Isolation**: The dev container network (`recipeforge_dev_net`) has no DNS routing or network bridge to the prod container network (`recipeforge_prod_net`).
> 3. **Volume Partitioning**: Development uses `recipeforge_postgres_dev_data`, completely separated on disk from `recipeforge_postgres_prod_data`.
> 4. **Credential Isolation**: Dev user credentials have no permissions or existence on the production PostgreSQL database.

### 1. Running the Development Environment

The development environment runs FastAPI with auto-reload enabled and an isolated PostgreSQL container on port `5433`.

```bash
# Start dev services (PostgreSQL on 5433, FastAPI on 8091 with hot-reload)
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d

# View live development logs
docker compose -f docker-compose.dev.yml logs -f

# Stop development services
docker compose -f docker-compose.dev.yml down
```

*Or using the cross-platform Makefile:*
```bash
make docker-dev-up
make docker-dev-logs
make docker-dev-down
```

> **Note on SQLite local development**: If you prefer running with SQLite instead of the PostgreSQL container, edit `.env.dev` to set `DATABASE_URL=sqlite:///./recipeforge_dev.db` and start the backend locally or with `docker compose -f docker-compose.dev.yml up app-dev`.

### 2. Running the Production Environment

The production environment executes an optimized multi-stage build: compiles the React SPA frontend into static assets and serves them via FastAPI on port `8000` backed by an isolated production PostgreSQL instance.

```bash
# Build and start production services
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# View production logs
docker compose -f docker-compose.prod.yml logs -f

# Stop production services
docker compose -f docker-compose.prod.yml down
```

*Or using the cross-platform Makefile:*
```bash
make docker-prod-up
make docker-prod-logs
make docker-prod-down
```

---

## 🧪 Testing

RecipeForge maintains 100% passing test suites across both frontend and backend layers, with comprehensive coverage for edge cases, Almaty midnight boundaries, multi-tenant isolation, environment safety guards, and UI accessibility.

### Running Test Suites

**Run all tests together:**
```cmd
test.cmd
```

**Run Backend Tests:**
```bash
cd backend
uv run pytest
```

**Run Frontend Tests:**
```bash
cd frontend
npm test
```

### ✅ Test Results
- **Frontend**: **110 passed across 13 test files** (`vitest` + React Testing Library)
- **Backend**: **23 passed, 0 failed** (`pytest` + FastAPI `TestClient`)

---

## 📂 Project Structure

```
RecipeForge/
├── backend/
│   ├── app/
│   │   ├── routers/       # Endpoints: auth, pantry, recipes, matches, shopping
│   │   ├── models.py      # SQLAlchemy 2.x declarative ORM models
│   │   ├── schemas.py     # Pydantic v2 validation models
│   │   ├── seed.py        # Seed dataset (80 ingredients, 25 recipes)
│   │   └── main.py        # FastAPI app entry point & CORS configuration
│   └── tests/             # Backend pytest integration test suite
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components (notebook theme, cards, modals, layout)
│   │   ├── context/       # Auth and application state context
│   │   ├── services/      # Service abstraction layer (Mock & HTTP clients)
│   │   ├── styles/        # Design system tokens and CSS variables
│   │   └── types/         # TypeScript domain interfaces
│   └── src/App.test.tsx   # Frontend integration tests
├── docs/                  # Product specifications, design tokens, agent roles
├── openapi.yaml           # Source of truth API contract
├── run.cmd / test.cmd     # Windows automation scripts
└── README.md
```

---

## 📜 License & Acknowledgments
Built with ❤️ for dorm students and home cooks everywhere.
