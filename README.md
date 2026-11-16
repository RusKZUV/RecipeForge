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

## 🌍 Environments

RecipeForge ships three runtime environments, each fully isolated from the others.

### Development (Docker, hot-reload)

Runs FastAPI with live code-mounting and an isolated PostgreSQL container on port `5433`:

```bash
# Start dev stack (PostgreSQL on 5433, FastAPI on 8091 with hot-reload)
docker compose --env-file .env.dev -f docker-compose.dev.yml up -d --build

# Tail logs
docker compose -f docker-compose.dev.yml logs -f

# Stop
docker compose -f docker-compose.dev.yml down
# or
make docker-dev-up / make docker-dev-down
```

The backend API (and Swagger docs) will be available at `http://localhost:8091/docs`.

### Production (Docker, optimised multi-stage build)

Compiles the React SPA into static assets and serves them via FastAPI on port `8000`, backed by an isolated PostgreSQL container:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
# or
make docker-prod-up
```

App available at `http://localhost:8000`.

### Local (no Docker)

```bash
# Backend
cd backend && uv sync && uv run uvicorn app.main:app --reload --port 8091

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

> [!IMPORTANT]
> **Environment isolation is enforced on 4 independent layers** — runtime safety guard, network isolation, volume partitioning, and credential isolation. See the full matrix below.

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
- **Backend**: **37 passed, 0 failed** (`pytest` + FastAPI `TestClient`) — including 10 tests for the AI on-call agent

---

## CI/CD

RecipeForge includes automated continuous integration and a manual, gated production deployment pipeline using GitHub Actions.

> [!NOTE]
> Для активации подтверждения (approval) нужно зайти в **Settings -> Environments -> production -> добавить Required reviewers**.  
> *(To activate manual approval before deployment, navigate to **Settings -> Environments -> production -> add Required reviewers**).*

### 1. Manual Production Deployment Workflow (`deploy-prod.yml`)

The production deployment workflow (`.github/workflows/deploy-prod.yml`) is triggered on-demand via `workflow_dispatch` and runs within the protected GitHub `production` environment:
1. **Checkout**: Checks out the production release branch.
2. **Build**: Builds the multi-stage production Docker image (`Dockerfile`).
3. **Registry Push / Verification**: Pushes the image to the configured container registry (or validates locally on runner if external registry is omitted).
4. **Deploy Trigger**: Calls the Render production deploy hook (`secrets.RENDER_DEPLOY_HOOK`).

### 2. How to Configure Environment Protection Rules (Approval / Required Reviewers)

To enforce mandatory human review and approval before any production deployment executes:

1. In your GitHub repository, navigate to the **Settings** tab.
2. In the left navigation sidebar, select **Environments** (under *Code and automation*).
3. Click **New environment**, name it `production`, and click **Configure environment** (or select existing `production`).
4. Under **Deployment protection rules**, enable the **Required reviewers** checkbox.
5. Search for and select the GitHub usernames or teams authorized to approve production releases.
6. *(Optional)* Under **Deployment branches**, select **Selected branches** and add `main` to prevent deployments from experimental branches.
7. Click **Save protection rules**.

> **Итог**: Для активации подтверждения (approval) нужно зайти в **Settings -> Environments -> production -> добавить Required reviewers**.

### 3. How to Run the Production Deployment Manually

Once configured, releases can be triggered with one click:

1. Navigate to the **Actions** tab in your GitHub repository.
2. In the left workflow list, select **Deploy to Production**.
3. Click the **Run workflow** dropdown on the right side.
4. Select the branch (default: `main`) and optionally enter a deployment reason or release tag.
5. Click the green **Run workflow** button.
6. **Approval Gate**: If Required Reviewers are configured, the workflow will pause at the `deploy-production` job with status `Waiting`. An authorized reviewer clicks **Review deployments**, selects the `production` environment, and clicks **Approve and deploy** to execute release.

---

## 📊 Observability Stack

RecipeForge ships a full, production-aligned local observability stack powered by OpenTelemetry, Prometheus, Loki, Tempo, and Grafana.

### Component Ports

| Component | Port(s) | Purpose |
| :--- | :--- | :--- |
| **OpenTelemetry Collector** | `4317` gRPC · `4318` HTTP · `8889` metrics | Central ingestion pipeline for traces, metrics, and logs |
| **Prometheus** | `9090` | Timeseries metric scraping from `otel-collector:8889` |
| **Alertmanager** | `9093` | Alert routing and webhook delivery |
| **Loki** | `3100` | Log aggregation and query engine |
| **Tempo** | `3200` | Distributed trace storage and query |
| **Grafana** | `3000` (admin / admin) | Unified dashboards — Prometheus, Loki, and Tempo datasources pre-wired |

### Starting the Stack

```bash
# Launch everything (all services in observability/docker-compose.yml)
docker compose -f observability/docker-compose.yml up -d
# or
make observability-up

# Tail logs
docker compose -f observability/docker-compose.yml logs -f
# or
make observability-logs

# Stop
docker compose -f observability/docker-compose.yml down
# or
make observability-down
```

### Grafana Dashboard

Access Grafana at **[http://localhost:3000](http://localhost:3000)** (`admin` / `admin`).

A pre-provisioned **RecipeForge** dashboard (`observability/grafana/dashboards/recipeforge.json`) loads automatically and contains four panels:

| Panel | PromQL Expression |
| :--- | :--- |
| **Recipes Created (rate)** | `rate(recipeforge_recipes_created_total[5m])` |
| **Pantry Match Rate** | `rate(recipeforge_pantry_match_requests_total[5m])` |
| **Pantry Match p95** | `histogram_quantile(0.95, rate(recipeforge_pantry_match_duration_seconds_bucket[5m]))` |
| **HTTP 5xx Error Rate** | `sum(rate(http_server_request_duration_seconds_count{http_status_code=~"5.."}[5m]))` |

Dashboard provisioning is configured in `observability/grafana/provisioning/dashboards/default.yaml` and scans for new JSON files every 10 seconds.

---

## 🚨 Alerts

Alert rules are defined in `observability/prometheus/alert-rules.yml` and loaded automatically by Prometheus.

| Alert | Expression | Threshold | `for` | Severity |
| :--- | :--- | :--- | :--- | :--- |
| **HighPantryMatchLatency** | `histogram_quantile(0.95, rate(recipeforge_pantry_match_duration_seconds_bucket{environment="production"}[5m]))` | `> 2 s` | 5 m | warning |
| **HighErrorRate** | `sum(rate(http_server_request_duration_seconds_count{http_status_code=~"5..",environment="production"}[5m])) / sum(rate(http_server_request_duration_seconds_count{environment="production"}[5m]))` | `> 5 %` | 5 m | critical |

Alertmanager (`observability/alertmanager/alertmanager.yml`) routes all firing alerts to the webhook receiver at `http://host.docker.internal:8000/webhook/alert`.

View active alerts at **[http://localhost:9090/alerts](http://localhost:9090/alerts)** (Prometheus) or **[http://localhost:9093](http://localhost:9093)** (Alertmanager).

---

## 🤖 AI On-call Agent

RecipeForge includes an AI on-call triage agent (`backend/oncall_agent.py`) that is invoked automatically whenever Alertmanager fires an alert.

### How It Works

```
Alertmanager fires alert
        │
        ▼
POST http://host.docker.internal:8000/webhook/alert
        │
        ▼
webhook_alert() in app/main.py
        │
        ▼
generate_triage_report(alert_data)   ← oncall_agent.py
        │
        ├── Parse alertname + severity from labels
        ├── Build PromQL expression for the alert
        ├── Query http://prometheus:9090/api/v1/query
        ├── Compute min / max / avg across returned samples
        └── Return: "ALERT: [name], Severity: [sev], Trend: [min/max/avg]"
        │
        ▼
Report logged at INFO level + returned in JSON response body
```

### Calling the Webhook Manually

```bash
curl -X POST http://localhost:8000/webhook/alert \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [{
      "labels": {
        "alertname": "HighPantryMatchLatency",
        "severity": "warning"
      },
      "status": "firing"
    }]
  }'
```

**Example response:**
```json
{
  "report": "ALERT: HighPantryMatchLatency, Severity: warning, Trend: min=0.0310 / max=1.8200 / avg=0.4125"
}
```

The agent degrades gracefully: if Prometheus is unreachable, `Trend: N/A` is reported without raising an error.

---

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
│   │   └── main.py        # FastAPI app entry point, CORS, /webhook/alert
│   ├── oncall_agent.py    # AI on-call triage agent (Prometheus query + report)
│   └── tests/             # Backend pytest integration test suite (37 tests)
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components (notebook theme, cards, modals, layout)
│   │   ├── context/       # Auth and application state context
│   │   ├── services/      # Service abstraction layer (Mock & HTTP clients)
│   │   ├── styles/        # Design system tokens and CSS variables
│   │   └── types/         # TypeScript domain interfaces
│   └── src/App.test.tsx   # Frontend integration tests
├── observability/
│   ├── docker-compose.yml          # Full observability stack (OTel, Prometheus, Alertmanager, Loki, Tempo, Grafana)
│   ├── prometheus.yml              # Prometheus scrape + alerting config
│   ├── prometheus/
│   │   └── alert-rules.yml         # HighPantryMatchLatency + HighErrorRate alert rules
│   ├── alertmanager/
│   │   └── alertmanager.yml        # Webhook receiver → /webhook/alert
│   ├── grafana/
│   │   ├── dashboards/
│   │   │   └── recipeforge.json    # Pre-built 4-panel RecipeForge dashboard
│   │   └── provisioning/
│   │       ├── dashboards/default.yaml   # Auto-provision dashboard JSON files
│   │       └── datasources/datasources.yml  # Prometheus, Loki, Tempo datasources
│   ├── collector-config.yaml
│   ├── tempo-config.yaml
│   └── loki-config.yaml
├── docs/                  # Product specifications, design tokens, agent roles
├── openapi.yaml           # Source of truth API contract
├── run.cmd / test.cmd     # Windows automation scripts
└── README.md
```

---

## 📜 License & Acknowledgments
Built with ❤️ for dorm students and home cooks everywhere.
