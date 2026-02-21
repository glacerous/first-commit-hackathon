# Tasks: Flexible Tech Stack Detection

## Implementation Tasks

- [x] **T1** — Worker: Relax Prompt Constraints
    - [x] Update the system prompt to make evidence optional.
    - [x] Encourage "best-effort" detection for significant tools like Prettier, ESLint, etc.
- [x] **T2** — Worker: Resilient Component Validation
    - [x] Update the validation loop to inject default evidence/description instead of throwing errors.
    - [x] Log warnings for partially valid components but keep them in the results.
- [x] **T3** — Verification: Run Analysis
    - [x] Trigger analysis for a repository where a tool (like Prettier) previously failed.
    - [x] Confirm no "missing evidence" errors occur and the job completes.
    - [x] Verify that components with "Detected via metadata" placeholders appear in the UI.

## Success Criteria
- [x] Analysis jobs reach "done" status even if some components have missing details.
- [x] Users see a more complete tech stack without technical job failures.
- [x] No more "Job failed" messages in the worker for individual component errors.
