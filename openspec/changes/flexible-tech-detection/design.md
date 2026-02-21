# Design: Flexible Tech Stack Detection

## Overview
This change moves the analysis worker from a "validating guard" to a "helpful observer." Instead of strictly policing the LLM's output, it will clean up and normalize the output to ensure a successful job completion.

## Component: Analysis Worker (`apps/worker`)

### 1. Prompt Logic
**Current**: Strict constraints ("MUST", "Use ONLY").
**New**: Guidance-based ("SHOULD", "Include if detected").
This prevents the LLM from omitting technologies just because it can't find a perfect 200-character snippet.

### 2. Validation Rewrite
The current validation loop is too aggressive:
```typescript
if (!Array.isArray(c.evidence) || c.evidence.length === 0) throw new Error(...);
```
**New Design**:
- Initialize defaults for `evidence` and `description`.
- Use a `map` or `filter` approach to sanitize the list of components rather than aborting.
- If a component has no `evidence`, we inject a virtual evidence entry so the database schema remains satisfied.

### 3. Error Boundary
The `groqDetectComponents` function should handle internal parsing errors locally and return an empty or partial list of components rather than bubbling up a crash to the job status manager.

## Data Flow
1. LLM returns JSON.
2. Worker parses JSON (with fallback for malformed markers).
3. Worker iterates through components.
4. If a component is "mostly valid" (has a name and type), it is kept.
5. Missing pieces (description, evidence) are filled with sensible defaults.
6. The cleaned list is returned for database insertion.
