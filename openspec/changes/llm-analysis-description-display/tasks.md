# Tasks: LLM Analysis Description — End-to-End Display

## Validation Rules
- DB migration must run successfully before deploying new worker
- Worker LLM output must include `description` per component
- API response for `GET /api/repos/:id` must include `description` in each component
- Frontend modal must appear on-click and display description

---

## Task List

- [x] **T1** — DB Migration: add `description TEXT` column to `detected_components`
  - [x] Add `ALTER TABLE public.detected_components ADD COLUMN IF NOT EXISTS description TEXT;` to `db/schema.sql`
  - [x] Run migration on live DB

- [x] **T2** — Worker: extend Groq system prompt to include `description` field
  - [x] In `groqDetectComponents()`, update system prompt string to require `description` in each component
  - [x] Add validation: if `description` exists and is a string, trim to 500 chars; else set to `null`

- [x] **T3** — Worker: update `insertAll()` to store `description`
  - [x] Change the `INSERT INTO detected_components` query to include `description` column (6th param)

- [x] **T4** — Frontend: make component/building cards clickable, open description modal
  - [x] Identify the card component in `apps/web/src`
  - [x] Add `onClick` handler to set `selectedComponent` state
  - [x] Render a modal (overlay) showing `name`, `type`, `version`, and `description`
  - [x] Handle null/empty `description` with fallback text: *"No description available."*
  - [x] Add close behavior (close button + click-outside)

## Success Criteria
- [x] After rerunning a repo analysis job, each component in `detected_components` has a `description` value
- [x] `GET /api/repos/:id` returns `description` field in each component object
- [x] Clicking a building card on the frontend opens a modal with the LLM description
- [x] Modal gracefully handles missing descriptions
