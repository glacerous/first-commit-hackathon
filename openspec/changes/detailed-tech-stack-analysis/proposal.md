# Proposal: Detailed Tech Stack Analysis

Enable the analysis worker to detect a more comprehensive set of technologies by refining the LLM prompt and expanding the component categories.

## Goal
The current analysis often focuses only on "heavyweight" frameworks (like Next.js or Prisma), ignoring significant libraries for UI, animations, state management, and utilities (like Framer Motion, Axios, Zod, or TanStack Query). This proposal aims to make the detection more "greedy" and descriptive of the actual development environment.

## Proposed Scope
1.  **Refine LLM Prompt**: Explicitly instruct the LLM to identify sub-frameworks, UI libraries, animation libraries, state management, validation libraries, and significant utilities.
2.  **Expand Component Types**: Add more granular types like `library`, `ui_component`, `utility`, and `api` to the allowed list.
3.  **Encourage Detailed Scanning**: Instruct the LLM to look deeper into `package.json` and `README.md` for specific "marker" dependencies.

## Success Criteria
- [ ] Worker identifies libraries like `framer-motion`, `zod`, `axios`, and `tanstack-query` when present.
- [ ] Analysis results show a richer set of components (more "buildings" in the 3D scene).
- [ ] Component descriptions remain concise but accurate.
