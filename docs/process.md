# Process (READ FIRST)

## Backlog & Issues
- GitHub Issues are the only backlog. Work on one issue at a time.
- Labels:
  - Scope: `mvp`, `post-mvp`, `user-test-bug`
  - Phase: `iter-1-frontend`, `iter-2-contract`, `iter-3-backend-memory`, `iter-4-sqlite`, `iter-5-integration`
- Phases are worked strictly in order.
- `post-mvp` issues are not groomed or implemented until promoted to `mvp`.

## Roles
- **PM**: Grooms a task before implementation begins. Follows `docs/team/pm.md`.
- **Software Engineer**: Implements one groomed task. Follows `docs/team/software-engineer.md`.
- **QA Engineer**: Verifies work against acceptance criteria and running app; closes the issue on PASS. Follows `docs/team/qa-engineer.md`.

## Orchestrator
The main session acts as the orchestrator. It launches PM, Engineer, and QA as separate subagents and never grooms, implements, or tests itself.

### Lifecycle
1. **Pick issue**: Pick the next open issue labelled `mvp` or `user-test-bug` (lowest phase first).
2. **Groom**: PM grooms the issue.
3. **Implement**: Engineer implements it, comments on what was done, and leaves the issue open.
4. **Verify**: QA verifies the implementation against acceptance criteria and posts a `PASS` or `FAIL` comment.
5. **On FAIL**: Return to step 3 with the QA comment as input.
6. **On PASS**: QA closes the issue.
7. **Repeat**: Repeat until no open `mvp` or `user-test-bug` issues remain.

Stop condition: `gh issue list --label mvp --state open` and `gh issue list --label user-test-bug --state open` both return no open issues.

## Rules
- Do not skip grooming.
- The Engineer never closes issues.
- QA never fixes code.
- Only QA closes issues.
- Commit regularly, referencing the issue number in commit messages.
- Do not add any new dependencies without asking first.
- Process documents are living — update them when the user corrects an agent (always commit current work first).

## user-test-bug Flow
- When a bug is found by running the app, file a GitHub issue with the `user-test-bug` label containing: Goal, Description, Steps to reproduce, Expected result, and Actual result.
- PM grooms the issue and adds acceptance criteria.
- QA adds test cases (automated regression tests or in testing guidelines) and re-checks the fix live on the running app.

## Documents List
- `docs/plan.md` — Product plan and specification (source of truth for behavior).
- `brainstorm.md` — Brainstorm chat (Q1–Q20).
- `docs/task-template.md` — Issue grooming template.
- `docs/testing-guidelines.md` — Testing strategy, test rules, and checklists.
- `docs/design-system.md` — UI design direction and tokens.
- `openapi.yaml` — API contract (created in iteration 2).
