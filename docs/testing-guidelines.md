# Testing Guidelines

## Commands
- **Backend tests**: `cd backend && uv run pytest`
- **Frontend tests**: `cd frontend && npm test`
- **Run application**: `make run` (or `run.cmd` on Windows)
- **Seed database**: `make seed`
- **Verify seed data**: `make seed-check`

## Rules
- **Behavior-based tests**: Write tests that verify behavior and contract outcomes from the caller's perspective, not brittle implementation details.
- **Table-driven tests**: Use parameterized, table-driven test cases for scoring logic, ingredient normalization, unit conversions, and expiry status calculations.
- **Midnight boundary in Almaty (UTC+5)**: Expiry dates are compared by the user's calendar date in Almaty time (UTC+5), not server UTC. Clock/date must be injected in tests; never rely on the ambient system clock. Test boundaries right before and after midnight UTC+5.
- **Money representation**: Money is stored as integer tenge (KZT) or Decimal. Never use floating-point numbers for currency; test rounding and verify there is no float drift.
- **Deterministic scoring**: The same input must produce identical rankings. Ties are broken deterministically by urgency, lower missing cost, name, and ID.
- **Per-user isolation tests**: Every endpoint must be tested to ensure strict multi-tenant isolation. A user must not be able to view, edit, or delete another user's pantry items, shopping list, or private data (endpoints return 404 or 403).

## Manual Scenario Checklist
Check these scenarios on the live running app after each phase or bugfix:
- [ ] **Auth**: Register a new user, log in, log out, access demo account.
- [ ] **Pantry bulk entry**: Add items by search, paste bulk text containing messy formatting/garbage and duplicate names, add an expired item, and add an item expiring today.
- [ ] **Matches**: View matches with an empty pantry, apply all dietary filters, toggle sort modes, click "Show more", and test servings scaling (1 serving vs recipe for 4).
- [ ] **Substitutions**: Apply a recipe substitution while dietary filter (e.g. dairy-free) is active.
- [ ] **Shopping list**: Merge duplicates, mark items as bought, and apply a price override.
- [ ] **Cook mode**: Run two timers simultaneously, reload page mid-step, and finish cooking with the "I cooked this" pantry deduction.
- [ ] **Backend restart keeps data**: Restart the backend service and verify that all user pantry and recipe data remains intact.

## Bug-derived test cases
<!-- QA appends regression test cases here -->
