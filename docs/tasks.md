# RecipeForge Tasks

Backlog of vertical slices organized by development phase.
Each task fits one agent session (UI + logic + tests where relevant).

## 1. Frontend project scaffolding and services abstraction
Phase: iter-1-frontend
Scope: mvp
Goal: Initialize React + Vite + TypeScript frontend with a passing test and the services abstraction layer.
Description: Scaffold the frontend application with configuration to switch between mock service and real HTTP client via environment config. Implement initial service interfaces, a mock implementation simulating responses and auth, and verify setup with a passing Vitest test. Establish project structure and code standards according to AGENTS.md.

## 2. Design system tokens and foundational layout
Phase: iter-1-frontend
Scope: mvp
Goal: Establish distinctive visual design tokens, responsive layout shell, and core UI primitives.
Description: Define typography, color tokens, and layout containers tailored for a student budget cook app with a non-generic aesthetic. Build reusable components (buttons, inputs, cards, badges) and document tokens in `docs/design-system.md`. Include component tests verifying design token styles and core layout rendering.

## 3. User authentication and profile settings UI
Phase: iter-1-frontend
Scope: mvp
Goal: Implement user registration, login, logout, profile settings, and simulated session expiry in the mock service.
Description: Create authentication screens and user profile controls for dietary filters, equipment, and assumed staples settings (pepper and oil). Implement mock auth service simulating registration, bearer token issuance, and 401 Unauthorized responses upon token expiration. Add tests covering form validation, auth state transitions, and route protection.

## 4. Ingredient catalog search and autocomplete UI
Phase: iter-1-frontend
Scope: mvp
Goal: Deliver search-and-select ingredient autocomplete supporting English canonical names and Russian aliases.
Description: Build an autocomplete search component querying the mock catalog service by canonical names and Russian aliases with category grouping. Support default base units and unit approximations with client-side normalization. Write component tests covering English searches, Russian alias matches, and empty state rendering.

## 5. Pantry inventory management with Almaty expiry statuses
Phase: iter-1-frontend
Scope: mvp
Goal: Allow users to manage pantry items with quantities and view expiry badges calculated in Almaty time.
Description: Implement pantry list view with item quantity editing, deletion, and addition via search-and-select autocomplete. Display dynamic expiry status badges (`fresh`, `expiring_soon`, `expires_today`, `expired`) relative to Almaty midnight (UTC+5), accompanied by an expiring items alert banner. Include tests for item mutations, banner behavior, and timezone-aware expiry computations.

## 6. Recipe catalog views and user recipe creation UI
Phase: iter-1-frontend
Scope: mvp
Goal: Render seed recipe details and provide an interactive form for creating private user recipes.
Description: Build recipe list cards and detailed views displaying ingredients, equipment, ordered instructions, and author tags. Create a user recipe editor with ingredient selection, quantity/unit validation, and dynamic step ordering. Add unit and component tests verifying recipe rendering, validation rules, and mock creation persistence.

## 7. Recipe matching and Balanced scoring UI
Phase: iter-1-frontend
Scope: mvp
Goal: Display ranked recipe matches scored by coverage, urgency, missing cost, and fit with active filter toggles.
Description: Implement client-side matching using the formula `0.45*coverage + 0.25*urgency + 0.20*missing_cost + 0.10*fit`, applying equipment, dietary, and expiry hard filters. Render recipe cards showing coverage percentage, explanation badges, missing cost estimates (or "price unknown"), and substitution suggestions. Include tests for scoring calculations, tie-break rules, and filter exclusion logic.

## 8. Budget shopping list with "Bought -> Pantry" transfer
Phase: iter-1-frontend
Scope: mvp
Goal: Generate a category-grouped shopping list from missing recipe ingredients and transfer bought items into the pantry.
Description: Implement shopping list view that aggregates missing recipe ingredients, calculates approximate KZT costs, and excludes assumed staples. Provide a "Bought" checkbox action that moves purchased ingredients directly into the pantry inventory with quantity and expiry confirmation. Write tests verifying ingredient deduplication, cost calculation, and pantry state updates.

## 9. Guided cook mode with parallel timers and "I cooked this"
Phase: iter-1-frontend
Scope: mvp
Goal: Provide a step-by-step cooking interface with parallel timers and pantry stock deduction upon completion.
Description: Build a multi-step cooking wizard featuring ingredient checklists, substitution reminders, and independently running timers persisted via end timestamps across page reloads. Implement the "I cooked this" summary dialog allowing users to review and confirm pantry inventory deductions. Add tests covering timer lifecycle, step navigation, and stock deduction calculations.

## 10. Application error boundaries, empty states, and loading states
Phase: iter-1-frontend
Scope: mvp
Goal: Provide comprehensive empty states, loading indicators, and error boundaries across all frontend views.
Description: Implement dedicated empty state components for empty pantry, zero recipe matches, and empty shopping lists with actionable next steps. Add loading spinners and React error boundaries to catch unexpected runtime exceptions with user-friendly recovery prompts. Include tests verifying empty state messaging, loading transitions, and error boundary recovery.

## 11. OpenAPI 3.0 contract specification
Phase: iter-2-contract
Scope: mvp
Goal: Formalize the complete HTTP API contract in `openapi.yaml` covering all endpoints, schemas, and error responses.
Description: Draft `openapi.yaml` at repo root defining endpoints for auth, catalog, pantry, recipes, matching, and shopping list based on the frontend service layer. Specify request/response schemas, status codes (including 401, 403, 404, 422), validation rules, and integer KZT currency representations. Validate the specification using automated schema linting to guarantee syntax correctness.

## 12. Frontend real API client and contract validation
Phase: iter-2-contract
Scope: mvp
Goal: Implement the HTTP API client in `frontend/src/services` complying strictly with the OpenAPI specification.
Description: Implement real HTTP client methods matching the service interface with bearer token injection and standard error handling. Verify that mock service fixtures and HTTP request/response payloads adhere to the schemas defined in `openapi.yaml`. Add test suites validating serialization, deserialization, auth header handling, and config switching.

## 13. Empty FastAPI backend project and testing setup
Phase: iter-3-backend-memory
Scope: mvp
Goal: Initialize FastAPI backend project with uv, Pydantic, pytest configuration, and a passing test.
Description: Scaffold the backend application directory using `uv`, configure `app.main:app` running on port 8091, and set up CORS from environment variables. Configure pytest with fixtures, code style tooling, and a passing health-check test endpoint. Ensure scripts and dependency management comply with AGENTS.md rules.

## 14. In-memory authentication and multi-tenant isolation
Phase: iter-3-backend-memory
Scope: mvp
Goal: Implement registration, login, bearer token validation, and per-user data isolation in memory.
Description: Build `/auth/register`, `/auth/login`, and `/auth/me` endpoints using secure password hashing and bearer token generation with expiration. Implement FastAPI dependency injection providing authenticated user context and rejecting unauthorized or expired tokens with 401. Write tests verifying registration, login errors, token expiration, and strict multi-tenant resource protection.

## 15. Ingredient catalog and normalization engine with unit conversions
Phase: iter-3-backend-memory
Scope: mvp
Goal: Provide catalog querying, deterministic normalization, and unit conversion logic in the backend.
Description: Implement catalog endpoints supporting English canonical names and Russian aliases with category and dietary metadata. Build the deterministic normalization engine (lowercase, trim, alias lookup) and unit conversion utilities (mass, volume, piece approximations). Add table-driven tests verifying normalization rules, conversion calculations, and invalid unit errors.

## 16. In-memory pantry inventory and Almaty-timezone expiry calculation
Phase: iter-3-backend-memory
Scope: mvp
Goal: Provide in-memory pantry CRUD endpoints with real-time expiry status evaluation relative to Almaty midnight.
Description: Create endpoints to list, add, update, and delete pantry items with positive quantities and valid units. Calculate expiry statuses (`fresh`, `expiring_soon`, `expires_today`, `expired`) based on calendar dates in Almaty time (UTC+5) using an injectable clock. Add unit and endpoint tests covering CRUD operations, user isolation, and midnight boundary scenarios.

## 17. In-memory recipe catalog, user recipe creation, and seed validation
Phase: iter-3-backend-memory
Scope: mvp
Goal: Serve seeded recipes, allow author-isolated recipe creation, and validate seed dataset integrity.
Description: Implement endpoints for querying public seed recipes and creating private user recipes with ingredients, equipment, and ordered steps. Implement seed data loader for 25 recipes and ~80 ingredients alongside a `seed-check` validation routine verifying positive quantities, IDs, and valid units. Add pytest cases for recipe validation, author permissions, and seed integrity.

## 18. In-memory recipe matching and scoring engine
Phase: iter-3-backend-memory
Scope: mvp
Goal: Implement recipe matching with Balanced scoring, hard filters, substitution rules, and cost calculations.
Description: Build recipe matching endpoint applying dietary, equipment, and expiry hard filters followed by Balanced ranking (`0.45*coverage + 0.25*urgency + 0.20*missing_cost + 0.10*fit`). Support substitution rules (quality capped at 0.8), assumed staples exclusions, and integer KZT costs with 3000 KZT reference budget. Add parameterized tests verifying deterministic scoring, tie-breaking, and filter enforcement.

## 19. SQLAlchemy 2.x ORM models and database configuration
Phase: iter-4-sqlite
Scope: mvp
Goal: Define SQLAlchemy 2.x ORM models and database engine configuration supporting SQLite persistence.
Description: Create declarative ORM models for users, ingredients, aliases, pantry items, recipes, steps, substitutions, and shopping items without SQLite-specific SQL. Configure engine and session management using `DATABASE_URL` with automatic schema creation (`create_all`) on startup. Add tests verifying model definitions, relationship cascading, and integer KZT column mappings.

## 20. Persistent repositories for auth, catalog, pantry, and recipes
Phase: iter-4-sqlite
Scope: mvp
Goal: Implement SQLAlchemy repositories replacing in-memory stores with SQLite database persistence and seeding.
Description: Migrate backend services to query and persist entities using SQLAlchemy sessions, maintaining strict multi-tenant isolation. Implement idempotent database seeder (`make seed`) populating the 80 catalog ingredients and 25 seed recipes into SQLite. Add integration tests verifying data persistence across database restarts and multi-tenant query boundaries.

## 21. Persistent shopping list and cook session completion
Phase: iter-4-sqlite
Scope: mvp
Goal: Persist shopping list items and implement atomic pantry inventory deduction upon recipe completion.
Description: Create shopping list persistence endpoints supporting item additions, deduplication, and the "bought" transition to pantry inventory. Build the "I cooked this" endpoint executing atomic pantry stock deductions based on recipe ingredients and substitutions without dropping below zero. Include tests for shopping list operations, atomic transactions, and stock deduction accuracy.

## 22. Frontend and backend integration with live authentication
Phase: iter-5-integration
Scope: mvp
Goal: Connect the React frontend to the live FastAPI backend with end-to-end authentication and token lifecycle.
Description: Configure frontend HTTP service layer and environment variables to communicate with the FastAPI backend on port 8091 with CORS enabled. Verify end-to-end registration, login, profile updates, and automatic redirection to login upon 401 token expiration. Add automated integration tests verifying real HTTP requests, response handling, and header injection.

## 23. End-to-end pantry-to-cooking user journey integration
Phase: iter-5-integration
Scope: mvp
Goal: Verify the complete user journey from pantry management through recipe matching, shopping, and cooking.
Description: Integrate all application views against the persistent backend to ensure consistent state transitions across the full workflow. Validate that pantry changes update match rankings, missing ingredients transfer to shopping list, and "I cooked this" deducts inventory in SQLite. Add comprehensive integration test scenarios covering edge cases like unit conversions and substitutions.

## 24. Root Makefile and Windows command scripts automation
Phase: iter-5-integration
Scope: mvp
Goal: Provide cross-platform automation commands for running, testing, seeding, and verifying the application.
Description: Create root `Makefile` implementing `make run`, `make test`, `make seed`, and `make seed-check`. Provide equivalent Windows batch scripts (`run.cmd`, `test.cmd`, `seed.cmd`) running frontend and backend commands without make. Add test automation verifying that all script targets execute successfully and return zero exit codes.

## 25. Project documentation and manual QA scenario verification
Phase: iter-5-integration
Scope: mvp
Goal: Complete project README and verify all manual QA test scenarios against the running integrated application.
Description: Write `README.md` containing architecture overview, local development setup, environment variables, API documentation, and test execution instructions. Execute the entire manual testing checklist from `docs/testing-guidelines.md` across all features on the running system. Document testing results, verify zero open defects, and ensure seamless developer onboarding.

## 26. Bulk pantry entry with interactive review screen
Phase: iter-5-integration
Scope: post-mvp
Goal: Allow users to paste comma/newline-separated grocery text and review categorized items before saving.
Description: Extends the MVP search-and-select pantry entry (decision Q14) by adding a bulk text parser and color-coded review interface (green for recognized, yellow for ambiguous, red for custom). Deferred to post-MVP to keep initial inventory entry simple and ensure core item management and expiry tracking were proven first. Implement parser logic, duplicate merging, row-level editing, atomic batch insertion, and comprehensive test coverage.

## 27. Recipe favorites and cooking history
Phase: iter-5-integration
Scope: post-mvp
Goal: Allow users to bookmark favorite recipes and view their cooking history with a "Cook again" action.
Description: Extends the MVP recipe catalog and cook mode (decision Q17) with heart toggles, a saved favorites view, and past session history logging. Deferred to post-MVP as cut candidate #2 from section 9 of the plan to focus MVP delivery on immediate pantry matching and cooking guidance. Implement favorites and history endpoints, UI screens, deleted recipe snapshot handling, and unit tests.

## 28. Adjustable servings UI controls
Phase: iter-5-integration
Scope: post-mvp
Goal: Provide interactive 1–12 serving size selectors on recipe details and cook mode with live ingredient scaling.
Description: Extends the MVP servings implementation (decision Q20) where serving scaling was maintained as an internal code multiplier without UI controls. Deferred to post-MVP as cut candidate #1 to avoid edge-case rounding complexities in UI inputs and shopping lists during initial release. Implement serving selectors, linear quantity recalculation with seasoning notes, and responsive layout tests.

## 29. Recipe matching sort modes beyond Balanced
Phase: iter-5-integration
Scope: post-mvp
Goal: Provide alternate recipe sorting modes: "Only what I have", "Use most of my pantry", and "Cheapest to complete".
Description: Extends the MVP single "Balanced" scoring algorithm (decision Q4) with user-selectable sort tabs on the recipe matches screen. Deferred to post-MVP as cut candidate #3 to validate and calibrate the core 4-factor scoring formula with real user testing before introducing alternative sorting strategies. Implement backend sort mode query parameters, sorting algorithms, UI tabs, and test cases.

## 30. Per-user ingredient price overrides
Phase: iter-5-integration
Scope: post-mvp
Goal: Enable users to override estimated catalog prices with custom prices from their local dorm or neighborhood stores.
Description: Extends the MVP nationwide seed pricing structure (decision Q13) with per-user price overrides stored in `UserPrice`. Deferred to post-MVP to focus MVP on approximate budget estimates without requiring complex user price management workflows upfront. Build price editing modal on shopping list and ingredient pages, reset to default action, and persistence tests.

## 31. Starter pantry kits for fast onboarding
Phase: iter-5-integration
Scope: post-mvp
Goal: Offer pre-configured pantry ingredient bundles that new users can add with a single click.
Description: Extends the MVP account creation and demo account flow (decisions Q10 and Q11) with customizable one-click starter kits (e.g., "Dorm Basics", "Budget Asian Pantry"). Deferred to post-MVP pending finalized starter bundle ingredient compositions and user feedback on initial onboarding flows. Implement starter kit fixtures, batch pantry insertion endpoint, onboarding UI modal, and integration tests.
