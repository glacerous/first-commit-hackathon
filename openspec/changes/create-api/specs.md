# API Specs — Repo Registry & Analysis Jobs (Express + PostgreSQL)

## Context
This change defines the HTTP contract for an Express API backed by PostgreSQL.
All responses are JSON.

### Environment
- `PORT` default: `3001`
- `DATABASE_URL` is required for DB connection
- DB connection uses SSL: `ssl: { rejectUnauthorized: false }`

### Error Format
- 4xx/5xx errors MUST be returned as:
```json
{ "error": "<message>" } 

## 1. POST /api/repos

### Purpose
Register a new repository for analysis.

### Request Body
```json
{
  "url": "string",
  "owner": "string",
  "name": "string",
  "default_branch": "string (optional)"
}
```

### Responses
- **201 Created**
  ```json
  {
    "message": "Repository registered and analysis scheduled",
    "repoId": 1,
    "jobId": 1
  }
  ```
- **400 Bad Request**
  - Invalid URL format
  - Missing required fields
  ```json
  { "error": "Missing required fields: url, owner, name" }
  ```
- **500 Internal Server Error**
  - Database error
  ```json
  { "error": "Database error: ..." }
  ```

## 2. GET /api/repos

### Purpose
List all registered repositories.

### Query Parameters
- `limit` (optional, default 20)
- `offset` (optional, default 0)

### Responses
- **200 OK**
  ```json
  [
  {
    "id": 1,
    "url": "https://github.com/user/repo",
    "owner": "user",
    "name": "repo",
    "default_branch": "main",
    "created_at": "2026-02-21T00:00:00.000Z",
    "updated_at": "2026-02-21T00:00:00.000Z",
    "latest_job_status": "pending",
    "latest_job_progress": 0
  }
  ]
  ```
- **500 Internal Server Error**
  - Database error
  ```json
  { "error": "Database error: ..." }
  ```

## 3. GET /api/repos/:id

### Purpose
Get repository details.

### Responses
- **200 OK**
  ```json
  {
    "id": 123,
    "url": "https://github.com/owner/repo",
    "owner": "owner",
    "name": "repo",
    "default_branch": "main",
    "created_at": "2026-02-21T..."
  }
  ```
- **404 Not Found**
  - No repo with this ID
  ```json
  { "error": "Repository not found: 123" }
  ```
- **500 Internal Server Error**
  - Database error
  ```json
  { "error": "Database error: ..." }
  ```

