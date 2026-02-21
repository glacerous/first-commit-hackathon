BEGIN;

CREATE TABLE IF NOT EXISTS public.repos (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id SERIAL PRIMARY KEY,
  repo_id INT NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.detected_components (
  id SERIAL PRIMARY KEY,
  repo_id INT NOT NULL REFERENCES public.repos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  version TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.evidence (
  id SERIAL PRIMARY KEY,
  component_id INT NOT NULL REFERENCES public.detected_components(id) ON DELETE CASCADE,
  file_path TEXT,
  snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;


ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS leased_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS worker_id TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

BEGIN;

ALTER TABLE public.analysis_jobs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;

-- biar updated_at otomatis ke-update saat row berubah (opsional; paling simpel: update manual di query)
-- kalau mau benar, bisa pakai trigger. Tapi hackathon: manual update di UPDATE query aja.

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_repo_created
ON public.analysis_jobs (repo_id, created_at DESC);

COMMIT;

-- Add description to detected_components for LLM-generated descriptions
ALTER TABLE public.detected_components
ADD COLUMN IF NOT EXISTS description TEXT;