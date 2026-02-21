# Specs: LLM Analysis Description — End-to-End Display

## 1. Database Migration

### `db/schema.sql` — add description column
```sql
ALTER TABLE public.detected_components
ADD COLUMN IF NOT EXISTS description TEXT;
```

This migration must be run on the live database before deploying the new worker. It is backward-compatible (nullable column).

---

## 2. Worker — Groq Prompt Extension

### File: `apps/worker/src/index.ts`

**System prompt shape** — each component in the `components[]` array **MUST** now include a `description` field:

```json
{
  "components": [
    {
      "name": "string",
      "type": "language|framework|database|cache|ci_cd|tooling|infra|testing|other",
      "version": "string or null",
      "confidence": number,
      "description": "string — 1-2 sentences, plain English, what this component does in this repo",
      "evidence": [
        { "file_path": "string", "snippet": "short quote <=200 chars" }
      ]
    }
  ]
}
```

**Validation rules:**
- `description` is a required string in LLM output
- Max 500 characters (trim if longer)
- If the field is missing or not a string, set it to `null` (do not throw)

**`insertAll()` function** — update the INSERT query to include `description`:
```sql
INSERT INTO public.detected_components (repo_id, name, type, version, confidence, description)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id
```

---

## 3. API — `GET /api/repos/:id`

**No code changes required.** The existing `SELECT dc.*` query returns all columns, so `description` will be automatically included in the `components` array once the DB column exists.

**Response shape** (updated):
```json
{
  "repo": { ... },
  "components": [
    {
      "id": 1,
      "repo_id": 123,
      "name": "Next.js",
      "type": "framework",
      "version": "14",
      "confidence": 0.95,
      "description": "Next.js is the React framework used for the frontend of this repository, handling SSR and routing.",
      "evidence": [ ... ],
      "created_at": "..."
    }
  ],
  "analysisJobs": [ ... ]
}
```

---

## 4. Frontend — Component Card Click-to-Describe

### File(s): `apps/web/src` (component cards page/component)

**Requirements:**
1. The component card (building) is already rendered — it must be made clickable
2. On click → set `selectedComponent` state to the clicked component object
3. Render a modal/panel overlay showing:
   - `selectedComponent.name` (heading)
   - `selectedComponent.type` (badge/label)
   - `selectedComponent.version` (if not null)
   - `selectedComponent.description` (body text)
   - Fallback if `description` is null or empty: show *"No description available."*
4. The modal must have a close button / click-outside-to-close behavior
5. No new API calls needed — data is already in the page's loaded state

### Acceptance Criteria
- [ ] Clicking any component card opens the description modal
- [ ] Modal shows the LLM-generated description text
- [ ] Modal handles null/empty description gracefully
- [ ] Modal can be closed
- [ ] No new API endpoints needed
