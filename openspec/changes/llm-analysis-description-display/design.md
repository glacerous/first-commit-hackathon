# Design: LLM Analysis Description — End-to-End Display

## Architecture Decisions

### 1. Description Generation (Worker)
- **Where**: In `groqDetectComponents()` in `apps/worker/src/index.ts`
- **How**: Extend the existing Groq system prompt to include a `description` field per component
- **Format**: `"description": "1-2 sentence plain-English explanation of what this component does in this repo"`
- The description must be concise (max 300 chars recommended), factual, and derived from the evidence

### 2. Database Storage
- **Migration**: Add `description TEXT` column to `public.detected_components`
- **Migration approach**: Add `ALTER TABLE` statement to `db/schema.sql` (same pattern as existing migrations in the file)
- **Nullable**: `description` is optional in DB — if LLM omits it, we store `null`

### 3. API Layer
- **No changes needed** to `apps/api/src/index.ts`
- The existing `SELECT dc.*` already returns all columns including the new `description`
- Response shape for `GET /api/repos/:id` will automatically include `description` per component

### 4. Frontend — Click-to-Describe
- **Component**: In `apps/web/src`, identify the component that renders the building/component cards
- **Interaction**: On card click → open a modal/drawer showing the LLM description
- **Data source**: The `description` field already present in the `/api/repos/:id` response
- **Fallback**: If `description` is null/empty, show a "No description available" placeholder

## Data Flow

```
[Worker job runs]
  → Groq LLM returns components[] with description
  → Worker stores description in detected_components.description
  
[User visits repo page]
  → GET /api/repos/:id
  → Response includes components[].description
  → Frontend renders component cards (buildings)
  → User clicks a building → Modal/panel shows description
```

## Component State

The frontend component card needs:
- `selectedComponent` state (null or a component object)
- On click: set `selectedComponent`
- Modal: shows `selectedComponent.name`, `selectedComponent.type`, `selectedComponent.description`
