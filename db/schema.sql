-- Repoly Database Schema

-- Repositories
CREATE TABLE IF NOT EXISTS repos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Jobs
CREATE TABLE IF NOT EXISTS analysis_jobs (
    id SERIAL PRIMARY KEY,
    repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER DEFAULT 0,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Detected Components
CREATE TABLE IF NOT EXISTS detected_components (
    id SERIAL PRIMARY KEY,
    repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, -- e.g., library, framework, tool
    name TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evidence for Detected Components
CREATE TABLE IF NOT EXISTS evidence (
    id SERIAL PRIMARY KEY,
    component_id INTEGER REFERENCES detected_components(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    reason TEXT,
    excerpt TEXT,
    line_start INTEGER,
    line_end INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project Entry Points
CREATE TABLE IF NOT EXISTS entry_points (
    id SERIAL PRIMARY KEY,
    repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., main, index, config
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
