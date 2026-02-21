# Tasks: Detailed Tech Stack Analysis

## Implementation Tasks

- [x] **T1** — Worker: Update `groqDetectComponents` Prompt
    - [x] Add explicit instructions to detect UI, logical, animation, and utility libraries.
    - [x] Add categories for `library`, `ui_component`, `validation`, `animation`, `state_management`.
    - [x] Instruct the LLM to provide high-quality descriptions for these "sub-framework" components.
- [x] **T2** — Worker: Update Type Validation
    - [x] Update the allowed `type` check in `groqDetectComponents` to include new categories.
- [x] **T3** — Verification: Analyze Complex Repo
    - [x] Trigger analysis for the current project.
    - [x] Verify that libraries like `framer-motion`, `zod`, and `lucide-react` are detected.
    - [x] Check if the side panel properly displays these new types.

## Success Criteria
- [x] The "Lab" 3D scene shows a diverse set of buildings representing the complexity of the project.
- [x] At least 10 key libraries are detected beyond the core frameworks.
- [x] No regression in detection quality for existing languages/frameworks.
