# Proposal: Flexible Tech Stack Detection

Make the analysis worker more resilient by relaxing strict evidence requirements and ensuring that minor detection errors do not fail the entire job.

## Goal
The current system fails the entire analysis job if the LLM detects a component but fails to provide a formatted evidence snippet or if the snippet doesn't perfectly match the provided files. This "all-or-nothing" approach is frustrating for users. We should move to a "best-effort" model where we show as much as we can find without crashing.

## Proposed Scope
1.  **Relax Prompt Rules**: Update the LLM system prompt to make evidence *optional but encouraged* rather than mandatory.
2.  **Graceful Validation**: Update `groqDetectComponents` to filter out invalid components (missing evidence, bad schema) instead of throwing an error that kills the job.
3.  **Default Handling**: Provide fallback values (e.g., "Detection confirmed via project files") if evidence is missing but the LLM is confident about a component.
4.  **Resilient JSON Parsing**: Ensure the worker handles slightly malformed JSON from the LLM more gracefully.

## Success Criteria
- [ ] Analysis jobs complete successfully even if some components lack perfect evidence.
- [ ] No more "Component [Name] missing evidence" failures.
- [ ] The full tech stack is displayed based on "best-effort" detection.
