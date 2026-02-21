# Proposal: Broaden Tech Stack Detection

Enable the analysis worker to detect a wider range of technologies by expanding the file filtering and evidence collection logic.

## Goal
The current worker only recognizes a limited set of JavaScript/TypeScript files (e.g., `package.json`, `next.config.js`). This proposal aims to include manifests for other languages (Go, Python, PHP, etc.) and leverage `README.md` for high-level tech stack signals.

## Proposed Scope
1.  **Expand `isInteresting`**: Add support for:
    *   **Mainstream Languages**: `go.mod`, `requirements.txt`, `pyproject.toml`, `composer.json`, `Cargo.toml`, `Gemfile`.
    *   **Universal Context**: `README.md` (high priority).
2.  **Adjust Priority**: Ensure language-specific manifests and `README.md` have high priority in the 15-file "Evidence Pack".
3.  **Refine Logic**: Ensure the Groq prompt remains effective with these new file types.

## Success Criteria
- [ ] Worker identifies Go, Python, and other non-JS components when present in a repo.
- [ ] `README.md` is included in the evidence pack if available.
- [ ] Analysis results show more comprehensive tech stacks for polyglot repositories.
