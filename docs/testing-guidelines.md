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
- **Empty Pantry Matches**: Verify that a user with an empty pantry receives matches sorted cleanly by lower missing cost, with coverage=0.0 and urgency=0.0, avoiding division by zero.
- **Midnight Boundary in Almaty**: Expiry calculation at 23:59:59 (expires_today) vs 00:00:01 (expired) based on Asia/Almaty time (UTC+5).
- **Multi-Tenant Protection**: Verify cross-user item modifications return 403 Forbidden or 404 Not Found, and deletion of account invalidates all user-associated access tokens immediately.
- **Seed Recipe Mutability Guard**: Verify that modifying or deleting seeded recipes returns 403 Forbidden.
- **Atomic Pantry Deductions**: Verify that cook completions deduct recipe ingredients down to zero without negative pantry balances.
- **Quick Item Search Add Responsiveness (#32)**: Verify that clicking "Add item" or submitting via Enter with a valid ingredient dispatches `pantry.addItem`, increments the pantry item count and updates the inventory card without a page reload, and clears the input field. Verify that empty or whitespace input triggers validation feedback without service calls, Cancel resets input and errors, in-flight requests disable the button, and service rejections preserve the input value and display visible error messages.
- **Clickable Recipe Cards & Recipe Details Modal (#33)**: Verify that recipe cards in the Matches tab have `role="button"`, focusability (`tabIndex={0}`), `cursor: pointer`, and `aria-label`. Verify that clicking a card or pressing Enter/Space requests recipe details via `GET /recipes/{id}` and opens the Recipe Details modal displaying title, cooking time, servings, equipment, complete ingredients (with quantities, units, and optional indicators), ordered steps (with timer tags if defined), and source/license notes. Verify loading indicator during fetch, visible error handling with retry and dismiss options on failure, and dismissal via Close button, backdrop click, or Escape key, properly restoring focus to the activated card.
- **Pantry Item Deletion & Missing Ingredients to Shopping (#34)**: Verify that each pantry inventory item features an accessible delete button (🗑️) that triggers `DELETE /pantry/{id}` and immediately updates the UI, rendering the empty state when items reach 0. Verify that `RecipeDetailsModal` provides an "Add missing to Shopping" button calculating non-staple missing ingredients against available pantry stock and unit conversions, posting to `POST /shopping` and disabling when all ingredients exist in pantry. Verify that the Shopping tab displays active items from `GET /shopping` and allows removing or marking items as bought with immediate state removal and backend synchronization.

