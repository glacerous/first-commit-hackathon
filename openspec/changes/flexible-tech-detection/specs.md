# Specs: Flexible Tech Stack Detection

## 1. Relaxed LLM Rules
Update the system prompt in `apps/worker/src/index.ts`:
- Change: "Every component MUST have evidence with at least 1 item" -> "Every component SHOULD have evidence if available. If evidence is not found in the provided files but the component is clearly present in the metadata, include it anyway."
- Remove: "Use ONLY provided evidence; if not supported, omit the component."
- Add: "If direct evidence is missing from the provided snippets but the component is mentioned in package.json or README filenames, provide a placeholder evidence snippet like: 'Detected via repository metadata'."

## 2. Robust Component Validation
Update the loop in `groqDetectComponents`:
- Remove `throw new Error` for missing evidence or description.
- If a component is missing evidence, provide a fallback evidence array `[{ file_path: "metadata", snippet: "Detected via repository structure" }]`.
- If a component is missing a description, provide a fallback "No description available."
- Log validation warnings to the console instead of crashing the job.

## 3. Worker Job Resilience
Update `processJob`:
- Ensure that the `try...catch` block in the job processing chain specifically handles component mapping failures gracefully, only failing the job if the API call itself fails or the repository cannot be cloned.

## Acceptance Criteria
- [ ] Analysis succeeds even if the LLM detects "Prettier" without a specific file snippet.
- [ ] Components without direct file evidence are still displayed in the UI.
- [ ] No "Component missing evidence" errors appear in the worker logs.
