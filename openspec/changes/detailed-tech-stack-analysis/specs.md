# Specs: Detailed Tech Stack Analysis

## 1. LLM Prompt Refinement
Update the system prompt in `apps/worker/src/index.ts` to include:
- Instructions to identify **UI Libraries** (Radix, Shadcn, Lucide, Recharts).
- Instructions to identify **Logic/Utility Libraries** (Zod, Axios, TanStack Query, SWR, Date-fns).
- Instructions to identify **Animation/Motion Libraries** (Framer Motion, Motion).
- Instructions to identify **Authentication/ORM** (NextAuth, Prisma, Better Auth).

## 2. Expanded Component Types
Expand the `type` field in the LLM output schema to include:
- `language`: PLs (Go, TS, Python).
- `framework`: Large frameworks (Next.js, Gin, Django).
- `library`: General purpose libraries (Axios, Date-fns).
- `ui_component`: UI/Design libraries (Radix, Lucide, Recharts).
- `state_management`: (React Query, SWR, Redux).
- `validation`: (Zod, Yup).
- `animation`: (Framer Motion).
- `database`: DBs and ORMs (Prisma, PostgreSQL).
- `cache`, `ci_cd`, `tooling`, `infra`, `testing`, `other`.

## 3. Success Criteria
- [ ] At least 10+ components are detected for a complex repo like the one provided by the user.
- [ ] UI components are correctly categorized.
- [ ] Descriptions explain the role of these libraries (e.g., "Zod is used for schema validation and type safety").
