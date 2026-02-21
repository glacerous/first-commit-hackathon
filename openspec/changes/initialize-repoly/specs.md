# Repoly — System Specification

## 1. System Overview
Repoly is a web-based system that analyzes public GitHub repositories and visualizes their technology stack as a low-poly city. The system is designed to run fully inside a Kubernetes cluster provided by the hackathon organizers.

## 2. Deployment Topology
Containers:
- **web**: Next.js frontend
- **api**: REST API service
- **worker**: background analysis processor

External dependencies:
- **PostgreSQL** (provided by organizers)
- **LLM API** (external)

## 3. Data Model
- **Repo**(id, url, owner, name, default_branch)
- **AnalysisJob**(id, repo_id, status, progress, error)
- **DetectedComponent**(id, repo_id, kind, name, confidence, description)
- **Evidence**(id, component_id, path, reason, excerpt, line_start, line_end)
- **EntryPoint**(id, repo_id, path, type, reason)

## 4. Runtime Constraints
- No local disk persistence (Stateless)
- Horizontal scaling safe
- Jobs must be resumable / idempotent
- Repository contents are NOT stored permanently (only metadata + evidence excerpts)
