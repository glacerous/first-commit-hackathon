# Specs: Broaden Tech Stack Detection

## 1. File Filtering Expansion
Update the `isInteresting` function in `apps/worker/src/index.ts` to include the following file patterns:

| Language/Platform | File Patterns |
| :--- | :--- |
| **Universal** | `README.md`, `README`, `readme.md`, `LICENSE` |
| **Go** | `go.mod`, `go.sum` |
| **Python** | `requirements.txt`, `pyproject.toml`, `setup.py`, `manage.py` |
| **PHP** | `composer.json`, `composer.lock` |
| **Rust** | `Cargo.toml`, `Cargo.lock` |
| **Ruby** | `Gemfile`, `Gemfile.lock` |
| **Java/Kotlin** | `pom.xml`, `build.gradle`, `build.gradle.kts` |
| **Existing (JS/TS)** | `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `next.config.*`, `tailwind.config.*`, `tsconfig.json` |
| **Infra/Other** | `Dockerfile`, `docker-compose.yml`, `prisma/schema.prisma`, `.github/workflows/*.yml` |

## 2. Evidence Priority
Update the `priority` function to ensure high-signal files are selected first within the 15-file limit:

1.  **Priority 1**: `package.json`, `go.mod`, `requirements.txt`, `pyproject.toml`, `composer.json`, `Cargo.toml`, `Gemfile`.
2.  **Priority 2**: `README.md`, `README`.
3.  **Priority 3**: `prisma/schema.prisma`, `next.config.*`, `tailwind.config.*`.
4.  **Priority 4**: `.github/workflows/*`.
5.  **Priority 5**: `Dockerfile`, `docker-compose.yml`.
6.  **Priority 6**: `tsconfig.json`, `manage.py`, `pom.xml`, `build.gradle`.
7.  **Priority 7**: Lockfiles (`go.sum`, `composer.lock`, etc.).

## 3. Evidence Handling
- No changes to the summarization logic for `package.json`.
- Other files should be read as plain text (up to 20,000 characters).
- Lockfiles should be capped at 8,000 characters to prevent token overflow.

## Acceptance Criteria
- [ ] `README.md` is included in the evidence pack for any repository that has it.
- [ ] A Go project with `go.mod` has its tech stack correctly identified.
- [ ] A Python project with `requirements.txt` has its tech stack correctly identified.
- [ ] The total evidence files sent to Groq does not exceed 15.
