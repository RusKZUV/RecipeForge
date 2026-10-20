# RecipeForge — Plan and Product Specification

Status: MVP scope agreed. Source: brainstorm decisions Q1–Q20 (see `docs/brainstorm.md`).
This document is living: update it when decisions change.

---

## 1. Vision

RecipeForge helps **budget-conscious students** cook affordable meals from what they already have, reduce food waste, and spend as little as possible on extra groceries.

Demo story: *"I have 8 items in my fridge, two expire soon. What can I cook, what do I need to buy, and how much will it cost?"*

End-to-end flow: **add pantry → find recipes → buy missing items → cook → leftovers update the pantry.**

## 2. Target user (Q1)

Primary persona: a student in a dorm or shared flat in Kazakhstan. Limited budget, basic kitchen (stovetop, maybe microwave, often no oven), cooks mostly for one person.

Other audiences (health-conscious, busy professionals, families) are out of scope for MVP.

## 3. Tech stack (Q18)

| Layer | Choice |
|---|---|
| Frontend | React + TypeScript + Vite (SPA), Vitest + React Testing Library |
| Frontend service layer | `src/services`: interface, mock implementation, real HTTP client (switch via config) |
| API contract | `openapi.yaml` at repo root |
| Backend | FastAPI + Pydantic, dependencies via `uv` |
| ORM / DB | SQLAlchemy 2.x + SQLite. DB URL from `DATABASE_URL`. No SQLite-specific features |
| Auth | Own implementation: hashed passwords (argon2/bcrypt), bearer tokens with expiry |
| Tests | pytest (backend), Vitest (frontend), Playwright for E2E if time allows |
| Run | Makefile: `make run`, `make test`, `make seed`, `make seed-check`; backend port 8091 |

Technical rules:
- Money: price per base unit stored as integer tenge (KZT); costs computed with `Decimal` and rounded up to whole tenge for display. Never `float`.
- Dates: expiry compared by the user's **calendar date** in Almaty time (UTC+5), not server UTC.
- No Alembic migrations in MVP (`create_all` on start). Migrations and Postgres are post-MVP.
- CORS origins come from env.
- Seed data lives in JSON; the seed script is idempotent.

## 4. Development approach

Iterations (each is a group of GitHub issues, labeled `iter-*`):
1. `iter-1-frontend`: frontend with mock service layer (must simulate auth: register, token, 401 on expiry)
2. `iter-2-contract`: `openapi.yaml` derived from the frontend service layer
3. `iter-3-backend-memory`: FastAPI backend with in-memory store and seed data
4. `iter-4-sqlite`: SQLAlchemy + SQLite persistence
5. `iter-5-integration`: connect frontend to real backend, E2E testing

Issue labels: `mvp`, `post-mvp`, `user-test-bug`. Workflow and roles: see `docs/process.md`.

## 5. Domain model (entities)

- **User**: id, email (unique, case-insensitive), password_hash, default_servings (default 1), dietary_filters, equipment, assumed_staples (profile setting: pepper, oil), created_at
- **Ingredient** (catalog): id, canonical_name, category, base_unit, price_per_base_unit (integer KZT), assumed_staple (bool, default false; water and salt flagged by default), flags (`contains_meat`, `contains_animal_product`, `contains_gluten`, `contains_dairy`, `contains_nuts`), unit_approximations (pcs/cup/spoon to g/ml), variant_of (nullable)
- **IngredientAlias**: ingredient_id, alias (incl. Russian names)
- **PantryItem**: id, user_id, ingredient_id (or custom name), quantity, unit, expires_on (nullable)
- **CustomIngredient**: user-defined, no flags, never matches recipes
- **Recipe**: id, owner_id (null for seed), title, servings, time_minutes, equipment[], is_seed, source and license_note (origin of the text, original wording required)
- **RecipeIngredient**: recipe_id, ingredient_id, quantity, unit, optional (bool)
- **RecipeStep**: recipe_id, position, text, timer_seconds (nullable)
- **SubstitutionRule**: from_ingredient, to_ingredient, ratio, quality (0..1), note, context (any in MVP), tags
- **UserPrice**: user_id, ingredient_id, price (integer KZT), unit, updated_at (override of the seed price)
- **ShoppingListItem**: user_id, ingredient_id, quantity, unit, source recipe(s), servings, checked
- **Favorite**: user_id, recipe_id (unique pair)
- **CookingHistory**: user_id, recipe_id (nullable if deleted), recipe_title snapshot, cooked_at, servings
- **CookSession** (client-side persisted): recipe snapshot, current step, timers as end timestamps

## 6. Features and rules

### 6.1 Accounts (Q10)
- Required. Register (email + password), login, logout, current user, delete account (cascades all user data).
- Hashed passwords; bearer token with expiry. Expired token redirects to login without losing entered data.
- Phase 1 mock service must simulate auth (register, login, token, 401 on expiry).
- No email verification in MVP. Login errors do not reveal which field is wrong.
- Strict per-user isolation: other users' resources return 404/403 (covered by tests).
- Demo account with pre-filled pantry ("Try with demo data"). Starter pantry kits for new users.
- Profile: dietary filters, equipment, default servings, assumed staples setting (pepper and oil).
- Concurrent devices allowed; last write wins.

### 6.2 Ingredient catalog and normalization (Q3)
- Seeded catalog, about 80 ingredients for the first release (more can be added later), with aliases (incl. Russian names, Q22), categories, base unit, integer KZT price per base unit (Q23), dietary flags, variants.
- Assumed staples: ingredient catalog gets a flag `assumed_staple` (default: water, salt). Staples are excluded from coverage and from "to buy" / shopping list, but are still shown in the recipe. Pepper and oil are configurable as a user profile setting.
- Normalization is deterministic, no AI: lowercase, trim, simple plural handling, alias lookup.
- Same normalization service is used for search, bulk entry and recipe creation.
- **Variant** (cherry tomato → tomato): partial match with weight 0.8.
- Units: conversion inside one type (g/kg, ml/l). pcs/cup/spoon via per-ingredient approximations. If no approximation exists, comparison is flagged as inexact.
- Unknown ingredient can be added as custom; it never matches recipes and triggers a warning on recipes that contain it.

### 6.3 Pantry (Q2, Q14, Q16)
- Item: ingredient, quantity, unit, optional expiry date.
- Entry methods:
  - **Search and select:** autocomplete over canonical names and aliases; default unit from catalog.
  - **Bulk entry:** text split only by commas and newlines; each fragment normalized. No quantity/unit parsing.
- Review screen after bulk submit (the original typed text is kept next to each row): green = recognized, yellow = ambiguous (choose candidate), red = not found (add as custom or skip). Quantity, unit and expiry can be set per row. Confirm saves atomically.
- Fragments containing numbers are flagged yellow with a hint to set quantity below (single documented behavior).
- Duplicates inside one input are merged; limit 100 fragments.
- Existing item: offer to merge or create a separate entry (different expiry dates are separate entries).
- Overbuying leaves the remainder in the pantry.

**Expiry handling (Q16).** Status is computed at request time:
- `fresh`: no date or beyond threshold
- `expiring_soon`: within 3 days (configurable)
- `expires_today`
- `expired`

Rules:
- Expired items are excluded from matching by default and clearly flagged. Toggle "Include expired items" (off by default, shows a warning).
- In-app alert banner on home and pantry: "N items expiring soon" with a button that opens matches sorted by urgency. No push/email notifications in MVP.
- Actions on expired items: discard, or edit the date.
- Persistent note: dates are user-entered estimates; the app never claims an item is safe.
- No date = no boost and no warning. "Expires today" is not expired until the day ends.
- Cook mode warns before starting if an expired item is used.

### 6.4 Recipes (Q9, Q19)
- **Seed set:** 25 hand-curated structured recipes for the first release (more can be added later), written in original wording (AI-assisted drafts allowed, quantities and timings reviewed by the author).
  - Budget student dishes, mostly stovetop/microwave.
  - Coverage across dietary filters (vegan, gluten-free, dairy-free, nut-free).
  - Dishes that rely on substitutions.
  - Dishes with multiple timers.
  - Edge-case test recipes (single ingredient, boundary units).
- **User recipes:** title, servings, time, equipment, catalog ingredients with quantity and unit, ordered steps with optional timer duration.
  - Private to the author; editable/deletable only by the author. Seed recipes are read-only.
  - Validation: at least 1 ingredient and 1 step, positive quantities, known units, sane upper limits (50 ingredients/steps).
  - Custom ingredients flag the recipe as "contains unknown ingredient" (no dietary guarantees).
- Deleting a recipe: shopping list lines remain, marked "recipe deleted". Cook mode uses a snapshot taken at start.
- `make seed-check` validates ids, units, positive quantities and non-empty steps. Seed script is idempotent.

### 6.5 Matching and ranking (Q4, Q15)
Per recipe, components in 0..1:
- **coverage:** `coverage = sum(score_i) / count(required ingredients)`, where `score_i` is 1.0 exact, 0.8 variant, substitution quality (capped 0.8), or the available share for partial quantity (`available_qty / required_qty * match_type_weight`). Every ingredient weighs the same. Optional ingredients (`optional = true`) and assumed staples (water, salt; pepper and oil per profile setting) are excluded from `count(required ingredients)` and coverage, and never counted as missing (though still shown in the recipe).
- **urgency:** pantry items used with status `expiring_soon`/`expires_today`; each item weight `w = 1 - days_left/(threshold+1)`; `urgency = min(1, sum(w))`.
- **missing_cost:** `1 - min(1, to_buy_cost / reference_budget)`; reference budget in config (3000 ₸, Q21). Unknown price counts as 0 in `missing_cost`, and the card shows "price unknown". Assumed staples are excluded from "to buy".
- **fit:** time-based, 1.0 up to 20 minutes, decreasing linearly to 0 at 90 minutes.

```
score = 0.45*coverage + 0.25*urgency + 0.20*missing_cost + 0.10*fit
```
Weights and thresholds live in config, not in code.

Hard filters before scoring:
- Missing required equipment
- Active dietary filters (Q6)
- Expired items excluded unless toggled on

Tie-break: higher urgency, lower missing cost, name, id (deterministic).

Sort modes: "Balanced" (default), "Only what I have", "Use most of my pantry", "Cheapest to complete".

Each card shows an explanation ("92% available, missing 1 item ≈ 400 ₸, saves milk expiring tomorrow"; missing items with unknown price show "price unknown") and a score breakdown. Optional top section "Ready to cook now" (coverage 100%).

Pagination (Q15):
- `limit` (default 12, max 50), `offset`; response includes `total`. UI "12 of 31" with a "Show more" button. No infinite scroll.
- Minimum coverage 30% hidden by default (config), toggle "Show all".
- Changing sort mode resets to page one. Invalid `limit`/`offset` return 422; offset beyond the list returns an empty page.
- Empty states: empty pantry (show cheapest/simplest recipes plus hint), and "filters excluded everything".

### 6.6 Substitutions (Q5)
- Predefined rules, about 25–40 in seed. One step only (no chains).
- Rule: from, to, ratio, quality, note, context (any in MVP), tags.
- Counts toward coverage with weight = quality, capped at 0.8 (never beats an exact match). Best available substitute is chosen. Partial quantity counts partially; remainder is treated as missing. Substitute use can earn urgency bonus.
- Respects active dietary filters (dairy-free blocks milk → yogurt but allows milk → oat milk).
- One pantry item cannot serve as both main ingredient and substitute if quantity is insufficient.
- UI: "No milk, using yogurt (x0.75, will be tangier)". Global toggle "Show substitutions".

### 6.7 Dietary filters (Q6)
- Filters: vegetarian, vegan, gluten-free, dairy-free, nut-free. Saved in the profile.
- Properties are **derived** from ingredient flags, not hand-tagged per recipe.
- Vegan implies vegetarian and dairy-free. Multiple filters combine with AND. Honey is flagged as an animal product.
- Ingredients with unknown flags (custom) trigger a warning on the recipe rather than silent inclusion.
- Persistent note: filters help select recipes but do not replace label checks for allergies.

### 6.8 Prices and costs (Q13, Q21, Q23)
- One region and currency: Kazakhstan, tenge (₸). Nationwide approximate prices with Almaty as the reference (Q23), labeled "estimate" in UI. Seed prices are verified and rounded by the project author.
- Money storage and computation: price per base unit stored as integer tenge (1 kg / 1 l / 1 pcs). Recipe and shopping costs are computed with `Decimal` and rounded up to whole tenge for display. Never use `float`.
- Per-user price override (UserPrice), editable from the shopping list and ingredient page, resettable to default.
- Priority: user price, then seed price, else "price unknown" (counts as 0 in `missing_cost`, card shows "price unknown", excluded from cost totals).
- Cost shown per recipe: total, per serving, "to buy" (missing items only, excluding assumed staples). Reference budget for scoring is 3000 ₸ (Q21).
- Price entered in another unit is converted (Q3 rules) or rejected with a clear message. Zero/negative prices rejected; sane maximum; division by zero protected.
- Prices are a reference table, not snapshots. UI shows when a price was last edited by the user (`updated_at`).

### 6.9 Shopping list (Q7)
- "Add missing to shopping list" button on a recipe. List contains only the difference between needed and pantry, taking chosen substitutions and servings into account. Assumed staples (water, salt; pepper and oil per profile setting) are excluded from "to buy".
- Duplicates merged with unit conversion; unconvertible units stay as separate lines.
- Grouped by catalog category. Each line shows source recipes.
- Estimated cost per line and total ("approximate"); items without price excluded from the total.
- "Bought" moves items into the pantry (default quantity and expiry editable).
- Manual edit, delete, add custom line. Piece items are rounded up to whole units when buying.

### 6.10 Cook mode (Q8)
- One step per screen, progress indicator, back/forward.
- Per-step ingredient checkboxes; shows substitutions in use.
- Timers on steps with duration: pause, reset, alert. **Several timers can run in parallel.**
- Progress and timers persist across reloads (stored as end timestamps, background tabs handled). Resume prompt if the user leaves mid-recipe. Wake-lock where supported.
- Timers do not scale with servings.
- Finish screen **"I cooked this"**: shows pantry deductions (with substitution ratios and servings), editable, confirm. Quantities never below zero; zero-quantity items are removed.

### 6.11 Servings (Q20)
- Selector 1–12 (step 1) on the recipe page and in cook mode. Default in profile (default 1).
- Linear scaling: `qty * selected_servings / recipe_servings`.
- Matching, cost, shopping list, cook mode and pantry deduction use the selected servings.
- Rounding: displayed to 0.1 for g/ml and 0.5 for pieces; piece items round up when buying; unit conversion after scaling.
- Non-linear items (salt, spices, baking) scale linearly with the note "season to taste".
- Servings 0, negative, non-integer or above max return 422. Changing servings in cook mode keeps progress and timers.
- Cut candidate if time is short (see section 9).

### 6.12 Favorites and history (Q17)
- Heart toggle on recipe card and detail page (seed and own recipes). Idempotent add/remove. Favorites screen.
- Cooking history record created on "I cooked this" confirmation (recipe, date, servings). History screen with "Cook again" which opens the recipe card with current score.
- Deleting a recipe removes it from favorites; history keeps the title snapshot marked "recipe deleted".
- Favorites and history do not affect ranking in MVP.

## 7. MVP scope (Balanced MVP, Q11)

| Block | Included |
|---|---|
| Accounts | Register, login, logout, profile, delete account, demo account, isolation |
| Catalog | Seeded ingredients (~80 items for first release), aliases, variants, categories, integer prices, assumed staples, flags, autocomplete |
| Pantry | CRUD, quantity, unit, expiry, conversion, statuses, banner, bulk entry with review screen |
| Recipes | 25 seed recipes (first release; more can be added later), user recipes with validation |
| Matching | Balanced scoring, hard filters, sort modes, explanations, pagination |
| Substitutions | Rules table, scoring integration, toggle |
| Diets | 5 filters derived from flags, warnings |
| Prices | KZT estimates, per-user overrides, cost per recipe/serving/to buy |
| Shopping list | Auto-build, merge, categories, cost, bought → pantry, manual edit |
| Cook mode | Steps, checkboxes, parallel timers, persistence, "I cooked this" |
| Servings | Selector, scaling across all features |
| Favorites/history | Hearts, history, cook again |
| Platform | Makefile, README, OpenAPI, SQLAlchemy + SQLite, seed + seed-check, tests |

## 8. Post-MVP (by waves, Q12)

Each post-MVP issue references the MVP decision it extends and why it was deferred.

**Wave 1 — cheap extensions of the MVP**
- Free-text pantry input with quantities ("half a bag of potatoes"), typo correction (Q3, Q14)
- Custom excluded ingredients and allergens (Q6)
- Cheaper alternatives and budget limit in the shopping list (Q7)
- Collections, notes, ratings for saved recipes (Q17)
- Push/email expiry notifications, opened-status shelf life (Q2, Q16)
- Price prefill from "bought" and receipts (Q13)
- Personalization of ranking by favorites/history (Q4, Q17)
- Non-linear scaling rules for spices/baking (Q20)

**Wave 2 — external dependencies**
- External recipe API, import by URL/photo, free-text ingredient parsing (Q9, Q19)
- Context-aware and AI-generated substitutions (Q5)
- AI cooking assistant, voice control (Q8)
- Weekly meal planner, meal-prep mode and leftovers planning (Q20)

**Wave 3 — community**
- Public recipe sharing, ratings, reviews, following
- Shared pantry and shopping list with roommates

**Wave 4 — advanced tracking**
- Barcode/receipt scanning, photo recognition (Q14)
- Nutrition tracking, keto/halal/high-protein diets (Q6)
- Real store prices, multiple regions/currencies, price history (Q13)

**Platform and reliability**
- Email verification, password reset, OAuth, refresh tokens, server-side session invalidation, login rate limiting (Q10)
- Alembic migrations, Postgres, containerization, CI/CD, deployment, monitoring
- Infinite scroll, ranking cache (Q15)

## 9. Risks and cut list

- Scoring and normalization/unit conversion are the most complex parts: split into small issues with explicit formulas and test cases.
- If time runs short, return to post-MVP in this order: (1) adjustable servings UI (keep the multiplier in code), (2) cooking history, (3) sort modes other than Balanced.
- Seed data (catalog, prices, recipes) is real work: schedule it early in iteration 3.

## 10. Edge cases (summary)

- Empty pantry, all items expired, filters exclude everything.
- Same expiry date and equal scores: deterministic tie-break.
- Unit mismatch without approximation: flagged as inexact.
- Recipe or ingredient deleted while referenced by list, history or cook session.
- Price in a different unit, zero price, unknown price.
- Date boundaries around midnight Almaty time.
- Cook mode: tab in background, reload mid-step, expired ingredient, deduction exceeding stock.
- Data isolation between users, account deletion cascade.

## 11. Open questions

- Exact seed prices in KZT (to be verified against local stores by the author).
- Final list of the starter pantry kits.
- Whether to add Playwright E2E in the time budget.

## 12. Decision log

| Q | Decision |
|---|---|
| 1 | Budget-conscious students |
| 2 | Pantry with quantities and expiry dates |
| 3 | Smart normalization, no AI |
| 4 | Balanced scoring (coverage, urgency, cost, fit) |
| 5 | Basic substitutions table |
| 6 | Five standard dietary filters, derived from flags |
| 7 | Budget-aware automatic shopping list |
| 8 | Guided cook mode, parallel timers, "I cooked this" |
| 9 | Hybrid: seed recipes plus user recipes |
| 10 | Accounts required |
| 11 | Balanced MVP |
| 12 | All post-MVP groups in ordered waves, plus platform group |
| 13 | Hybrid pricing, KZT, per-user overrides |
| 14 | Search-and-select plus bulk entry with review |
| 15 | Page size 12 with "Show more" |
| 16 | Prioritize expiring + strict for expired, in-app alerts only |
| 17 | Favorites + cooking history (moved into MVP) |
| 18 | React + FastAPI + SQLAlchemy + SQLite |
| 19 | Hand-curated 25 recipes and ~80 ingredients for first release |
| 20 | Adjustable servings (moved into MVP) |
| 21 | Reference budget 3000 KZT |
| 22 | English UI with Russian catalog aliases |
| 23 | Nationwide approximate prices with Almaty as the reference |
