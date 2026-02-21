# Design: Broaden Tech Stack Detection

## Overview
This change modifies the evidence collection phase of the analysis worker to be language-agnostic and context-aware.

## Component: Analysis Worker (`apps/worker`)

### 1. `isInteresting(p: string)`
Currently, this function uses a rigid `p.endsWith(...)` chain.
**Change**: Convert to a more robust check that includes a wider variety of filenames.

### 2. `priority(p: string)`
Currently, this function uses a simple numeric scale favoring JS files.
**Change**: Update the mapping to treat all primary manifest files (across languages) as top priority, followed immediately by `README.md`.

### 3. `buildEvidencePack(repoDir: string)`
This function orchestrates the filtering and selection.
**Change**: Update the `allPaths` filtering to include the new `isInteresting` logic. Ensure that even if a repo has many manifest files, the top-level ones are picked.

## Data Flow
1.  Worker clones the repository.
2.  `walkFiles` finds all files up to depth 6.
3.  `isInteresting` filters the thousands of files down to a list of "signal" files.
4.  `priority` sorts these files.
5.  `chosen` takes the top 15.
6.  Files are read and sent to the LLM.

## Rationale
- **README.md**: Often contains the most concise human-readable description of the tech stack.
- **Polyglot Support**: Many modern repos use multiple languages (e.g., Go backend, React frontend). We need to see both.
- **Token Efficiency**: By prioritizing manifests over lockfiles, we get more "meaning per character" into the LLM prompt.
