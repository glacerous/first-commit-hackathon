# Design: Detailed Tech Stack Analysis

## Overview
This change refines the decision-making process of the LLM in the worker to ensure it doesn't just "cherry-pick" the most famous frameworks, but instead provides a rich map of the actual technology choices made in the codebase.

## Component: Analysis Worker (`apps/worker`)

### 1. `groqDetectComponents` Prompt
**Change**: Shift from "detect tech stack" to "perform a comprehensive technical audit of detected libraries and tools".
**Prompt Expansion**:
- Add a list of "Areas of Interest": UI/UX, Data Fetching, Validation, State, Infrastructure, Tooling.
- Relax the "Evidence" constraint to allow broader detection from `package.json` dependencies.

### 2. Output Schema
**Change**: Update the enum for `type` to accommodate the more granular categories. This will allow the frontend to potentially use different "building" styles for libraries vs. frameworks in the future (though for now they use the types mapped to existing styles).

## Data Enrichment
By detecting more libraries (Zod, Framer Motion, Axios), the "Lab" 3D scene will become more populated and better represent the complexity of the project.

## Implementation Details
- Update the string literal `system` in `apps/worker/src/index.ts`.
- Update the type validation logic in the worker to handle the new enum values.
