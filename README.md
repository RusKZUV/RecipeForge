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

## 🧪 Testing

RecipeForge maintains 100% passing test suites across both frontend and backend layers, with comprehensive coverage for edge cases, Almaty midnight boundaries, multi-tenant isolation, and UI accessibility.

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
- **Frontend**: **107 passed across 13 test files** (`vitest` + React Testing Library)
- **Backend**: **15 passed, 0 failed** (`pytest` + FastAPI `TestClient`)

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
