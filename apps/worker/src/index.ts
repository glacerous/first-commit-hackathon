import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
});

const POLL_MS = Number(process.env.POLL_MS || 5000);

async function sleep(ms: number) {
    await new Promise((r) => setTimeout(r, ms));
}

async function processJob(jobId: number, repoId: number) {
    console.log(`[Worker] Processing job ${jobId} for repo ${repoId}`);

    await pool.query(
        `UPDATE public.analysis_jobs
   SET status=$1, progress=$2, updated_at=NOW(), error_message=NULL
   WHERE id=$3`,
        ["running", 1, jobId]
    );

    try {
        // simulate analysis progress
        await pool.query(
            `UPDATE public.analysis_jobs SET progress=$1, updated_at=NOW() WHERE id=$2`,
            [50, jobId]
        );

        await pool.query(`DELETE FROM public.detected_components WHERE repo_id = $1`, [repoId]);

        const compRes = await pool.query(
            `
      INSERT INTO public.detected_components (repo_id, name, type, version, confidence)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
            [repoId, "Next.js", "framework", null, 0.95]
        );

        const componentId = Number(compRes.rows[0].id);

        await pool.query(
            `
      INSERT INTO public.evidence (component_id, file_path, snippet)
      VALUES ($1, $2, $3)
      `,
            [componentId, "package.json", "Detected via package.json (mock)"]
        );

        await pool.query(
            `UPDATE public.analysis_jobs
            SET status=$1, progress=$2, updated_at=NOW(), finished_at=NOW()
            WHERE id=$3`,
            ["succeeded", 100, jobId]
        );

        console.log(`[Worker] Job ${jobId} succeeded`);
    } catch (err: any) {
        console.error(`[Worker] Job ${jobId} failed:`, err?.message ?? err);

        await pool.query(
            `UPDATE public.analysis_jobs
            SET status=$1, updated_at=NOW(), finished_at=NOW(), error_message=$2
            WHERE id=$3`,
            ["failed", String(err?.message ?? err).slice(0, 5000), jobId]
        );
    }
}

async function pollOnce() {
    // ambil 1 job pending
    const res = await pool.query(
        `
    SELECT id, repo_id
    FROM public.analysis_jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    `
    );

    if (res.rows.length === 0) return;

    const jobId = Number(res.rows[0].id);
    const repoId = Number(res.rows[0].repo_id);

    // penting: langsung process (tanpa setInterval overlap)
    await processJob(jobId, repoId);
}

async function main() {
    console.log(`[Worker] Started. Polling every ${POLL_MS}ms...`);
    while (true) {
        try {
            await pollOnce();
        } catch (e: any) {
            console.error("[Worker] poll error:", e?.message ?? e);
        }
        await sleep(POLL_MS);
    }
}

main().catch((e) => {
    console.error("[Worker] fatal:", e);
    process.exit(1);
});