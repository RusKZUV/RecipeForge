# Testing guidelines

## Layers
- Backend unit tests: scoring, normalization, unit conversion, substitutions, expiry status, servings scaling (pytest).
- Backend API tests: every endpoint, auth, per-user data isolation (other users' resources return 404/403).
- Frontend tests: components and the services layer (Vitest + React Testing Library).
- Manual user testing after each phase, on the running app.

## Rules
- Tests must not depend on the current date. Inject the date/clock.
- Test boundaries around midnight Almaty time (UTC+5) for expiry statuses.
- Money is integer tenge: test rounding and no float drift.
- Scoring must be deterministic: same input gives the same order; ties broken by urgency, lower missing cost, name, id.

## Manual user-testing checklist
- Register, log in, log out, demo account
- Pantry: add by search, bulk entry with garbage and duplicates, expired item, item expiring today
- Matches: empty pantry, all filters on, sort modes, "Show more", servings 1 vs recipe for 4
- Substitution with dairy-free active
- Shopping list: merge duplicates, mark as bought, price override
- Cook mode: two timers at once, reload mid-step, "I cooked this" deduction
- Restart the backend: all data is still there

## Bug workflow
Bug found -> GitHub issue with label `user-test-bug` (Goal, Description, steps, expected, actual) -> PM grooms -> QA adds test cases -> Engineer fixes -> QA verifies and closes.

## Added test cases
(QA appends regression cases here.)
