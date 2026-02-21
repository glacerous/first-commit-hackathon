# Proposal: LLM Analysis Description — End-to-End Display

## Problem
The worker already uses Groq to detect tech-stack components (name, type, version, confidence, evidence) for a repository, but it does **not** generate a human-readable `description` for each component.

As a result, the API returns components without any explanation, and the frontend has no textual description to show users when they click on a building/component card.

## Goal
1. **Worker**: Extend the Groq prompt to also return a `description` string per component — a concise, plain-English explanation of what the component does in the context of this repo.
2. **Database**: Add `description TEXT` column to `public.detected_components`.
3. **API**: The existing `GET /api/repos/:id` endpoint returns `components` — the new `description` field will be included automatically once it's stored in the DB.
4. **Frontend (apps/web)**: When a user clicks on a building/component card, display a modal or panel that shows the LLM-generated `description`.

## Affected Areas

| Area | Change |
|---|---|
| `db/schema.sql` | Add `ALTER TABLE detected_components ADD COLUMN description TEXT` |
| `apps/worker/src/index.ts` | Extend Groq system prompt to include `description` field; validate & store it |
| `apps/api/src/index.ts` | No logic change needed — description is returned in existing `SELECT dc.*` |
| `apps/web/src` (components/pages) | Add click handler on building/component card to show description |

## Non-Goals
- No streaming of descriptions
- No separate endpoint for descriptions (reuse existing `/api/repos/:id`)
- No background re-analysis — description is generated as part of the existing job flow

## Impacted Capabilities
- `GET /api/repos/:id` → components array now includes `description`
- Worker job → now stores `description` per detected component
