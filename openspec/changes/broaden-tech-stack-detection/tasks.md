# Tasks: Broaden Tech Stack Detection

## Implementation Tasks

- [x] **T1** — Worker: Update `isInteresting` filter
    - [x] Add `README.md`, `README`, `LICENSE`
    - [x] Add Go manifests (`go.mod`, `go.sum`)
    - [x] Add Python manifests (`requirements.txt`, `pyproject.toml`, `setup.py`)
    - [x] Add PHP manifests (`composer.json`)
    - [x] Add Rust/Ruby/Java manifests (`Cargo.toml`, `Gemfile`, `pom.xml`, `build.gradle`)
- [x] **T2** — Worker: Update `priority` mapping
    - [x] Set all primary manifests to P1
    - [x] Set `README.md` to P2
    - [x] Adjust existing JS/TS priorities to match new scale
- [x] **T3** — Worker: Refine Evidence Pack selection
    - [x] Ensure `selected.slice(0, 15)` captures the most relevant signals first
- [ ] **T4** — Verification: Run Analysis
    - [ ] Trigger analysis for a known polyglot or non-JS repository
    - [ ] Verify that `README.md` and non-JS manifests are listed in the "Evidence found" logs
    - [ ] Confirm the LLM correctly identifies the tech stack from the broadened evidence

## Success Criteria
- [ ] Any repo with a `README.md` includes it in the analysis.
- [ ] Tech stacks for Go, Python, and other supported languages are detected.
- [ ] The worker does not crash on empty or large manifests.
