# Process

## Tasks
- GitHub Issues are the only backlog. One issue at a time.
- Labels:
  - Scope: `mvp`, `post-mvp`, `user-test-bug`
  - Phase: `iter-1-frontend`, `iter-2-contract`, `iter-3-backend-memory`, `iter-4-sqlite`, `iter-5-integration`
- Work order: lowest phase first. `user-test-bug` issues are handled as soon as they are filed.
- `post-mvp` issues are not groomed or implemented until promoted to `mvp`.
- Read the acceptance criteria before starting and before closing.

## Roles
- PM - grooms a task before anyone implements it. Follows `docs/team/pm.md`.
- Engineer - implements one groomed task. Follows `docs/team/software-engineer.md`.
- QA - verifies the result against the acceptance criteria and closes the issue on PASS. Follows `docs/team/qa-engineer.md`.

## Orchestrator
The main session is the orchestrator. It launches PM, Engineer and QA as separate subagents or sessions. It does not groom, implement or test itself.

Lifecycle:
1. Pick the next open issue labelled `mvp` or `user-test-bug` (lowest phase first).
2. PM grooms it.
3. Engineer implements it and comments what was done. The issue stays open.
4. QA verifies it and posts PASS or FAIL as an issue comment.
5. On FAIL, go back to step 3 with the QA comment as input.
6. On PASS, QA closes the issue.
7. Repeat until no open `mvp` or `user-test-bug` issues remain.

Stop condition: `gh issue list --label mvp --state open` and `gh issue list --label user-test-bug --state open` both return nothing.

## Rules
- Do not skip grooming.
- The Engineer never closes issues. QA never changes code. Only QA closes issues.
- Commit after every finished issue.
- If something in these documents turns out to be wrong or missing, update the document and commit the change.
- When the person corrects the agent, update the relevant document so the correction is not needed again.

## User testing
- After each phase, run the app and test it as a user (see `docs/testing-guidelines.md`).
- Every bug found gets a GitHub issue with label `user-test-bug`, with Goal, Description and reproduction steps.
- The issue asks PM to groom it and QA to add more test cases.
