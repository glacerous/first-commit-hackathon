import express from "express";
import pg from 'pg';
import cors from 'cors';
import * as dotenv from 'dotenv';

dotenv.config();

const {Pool} = pg

const app = express();
export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
})

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Register a new repository and trigger analysis
app.post("/api/repos", async (req, res) => {
    const { url, owner, name, default_branch } = req.body;

    if (!url || !owner || !name) {
        return res.status(400).json({ error: "Missing required fields: url, owner, name" });
    }

    try {
        // 1. Insert or get Repo
        const repoRes = await pool.query(
            'INSERT INTO repos (url, owner, name, default_branch) VALUES ($1, $2, $3, $4) ON CONFLICT (url) DO UPDATE SET updated_at = NOW() RETURNING id',
            [url, owner, name, default_branch || 'main']
        );
        const repoId = repoRes.rows[0].id;

        // 2. Create Analysis Job
        const jobRes = await pool.query(
            'INSERT INTO analysis_jobs (repo_id, status) VALUES ($1, $2) RETURNING id',
            [repoId, 'pending']
        );

        res.status(201).json({
            message: "Repository registered and analysis scheduled",
            repoId,
            jobId: jobRes.rows[0].id
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// List all repositories
app.get("/api/repos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id, r.url, r.owner, r.name, r.default_branch, r.created_at, r.updated_at,
        aj.id AS latest_job_id,
        aj.status AS latest_job_status,
        aj.progress AS latest_job_progress,
        aj.error_message AS latest_job_error,
        aj.created_at AS latest_job_created_at,
        aj.finished_at AS latest_job_finished_at
      FROM public.repos r
      LEFT JOIN LATERAL (
        SELECT id, status, progress, error_message, created_at, finished_at
        FROM public.analysis_jobs
        WHERE repo_id = r.id
        ORDER BY created_at DESC
        LIMIT 1
      ) aj ON true
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get repository details including findings
app.get("/api/repos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const repoRes = await pool.query(`SELECT * FROM public.repos WHERE id=$1`, [id]);
    if (repoRes.rows.length === 0) return res.status(404).json({ error: "Repository not found" });

    const componentsRes = await pool.query(
      `
      SELECT
        dc.*,
        COALESCE(
          json_agg(json_build_object(
            'id', e.id,
            'file_path', e.file_path,
            'snippet', e.snippet,
            'created_at', e.created_at
          )) FILTER (WHERE e.id IS NOT NULL),
          '[]'::json
        ) AS evidence
      FROM public.detected_components dc
      LEFT JOIN public.evidence e ON e.component_id = dc.id
      WHERE dc.repo_id = $1
      GROUP BY dc.id
      ORDER BY COALESCE(dc.confidence,0) DESC, dc.created_at DESC
      `,
      [id]
    );

    const jobsRes = await pool.query(
      `SELECT * FROM public.analysis_jobs WHERE repo_id=$1 ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      repo: repoRes.rows[0],
      components: componentsRes.rows,
      analysisJobs: jobsRes.rows,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on ${PORT}`));