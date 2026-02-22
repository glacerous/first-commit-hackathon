http://first-commit.hackathon.sev-2.com/lab?repoId=1&jobId=28



# Repoly 🏙️

**Understand Any Repository as a Living System**

Repoly is an AI-powered repository visualization system that transforms static codebases into an interactive 3D environment. By simply providing a GitHub repository URL, Repoly autonomously analyzes the tech stack, dependencies, and infrastructure, mapping them into a procedurally generated 3D cityscape.

## 🚀 Features

- **Automated Ingestion**: Clones your repository and extracts architectural information using an advanced analysis engine powered by Groq and Llama.
- **AI-Powered Tech Stack Discovery**: Detects languages, libraries, frameworks, UI components, databases, and CI/CD tools accurately, directly from your manifests and source files.
- **Live 3D Schematic**: Renders the repository as a navigable 3D world, where:
  - Languages & Services become **Towers**
  - Databases & Caches become **Silos**
  - Tooling & Frameworks become **Power Plants**
  - CI/CD & Infra become **Transmission Towers**
- **Deep Inspection**: Click on any building to view detailed component properties, confidence scores, version information, and supporting evidence snippets extracted straight from your codebase.
- **Asset Directory**: A quick HUD to locate and focus on specific components by category.

## 🏗️ Architecture

Repoly is structured as a monorepo containing three core services:

1. **Web Frontend (`apps/web`)**
   A Next.js application providing the landing page and the 3D Lab environment built with Three.js. It visualizes the repository components dynamically and provides a tactical HUD overlay.

2. **API Backend (`apps/api`)**
   An Express.js REST API handling repository registration, analysis job scheduling, and serving component/analysis data to the frontend.

3. **Analysis Worker (`apps/worker`)**
   A robust Node.js background worker that:
   - Clones repositories using `simple-git`.
   - Traverses files to collect evidence (`package.json`, `go.mod`, `docker-compose.yml`, etc.).
   - Communicates with the Groq API to intelligently parse the tech stack.
   - Saves detected components and evidence into the PostgreSQL database.

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, Three.js, Vanilla CSS
- **Backend API**: Node.js, Express, TypeScript
- **Worker**: Node.js, TypeScript, `simple-git`, Groq SDK/API
- **Database**: PostgreSQL
- **Monorepo Tooling**: npm workspaces

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Groq API Key
- GitHub Personal Access Token (for cloning repos without rate limits)

### 1. Database Setup
Create a PostgreSQL database and initialize the schema using the provided SQL file:
```bash
psql -d your_db -f db/schema.sql
```

### 2. Environment Variables
Create a `.env` file at the root of the project and provide the required keys:
```env
PORT=3001
PGHOST=localhost
PGPORT=5432
PGDATABASE=first_commit
PGUSER=postgres
PGPASSWORD=yourpassword

GITHUB_TOKEN=your_github_token
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-70b-versatile
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Install Dependencies
Install dependencies from the root directory:
```bash
npm install
```

### 4. Run the Application
You can run the three services concurrently using npm script aliases defined in the root package.json (or via workspaces):

**Terminal 1 (Frontend):**
```bash
npm run dev --workspace=apps/web
```

**Terminal 2 (API Backend):**
```bash
npm run dev:api
```

**Terminal 3 (Analysis Worker):**
```bash
npm run dev:worker
```

The web application will be available at `http://localhost:3000`, and the API runs on `http://localhost:3001`.

## 📌 How it Works under the hood

1. The user inputs a GitHub URL on the Next.js frontend, which sends a request to the Express API.
2. The API creates a generic `repo` record and queues an `analysis_job` in PostgreSQL.
3. The Worker constantly polls the database. When it picks up the job, it clones the repository.
4. The worker extracts files like `package.json`, `docker-compose.yml`, `requirements.txt`, etc.
5. It passes a heavily optimized "evidence pack" to the LLM (Groq) with a strict schema to detect any dependencies and map them into specific types (e.g. `state_management`, `language`, `database`).
6. The detections, alongside code snippets as proof, are saved to the database.
7. The Lab page polls the API and visualizes these stored components via procedural generation with Three.js.
