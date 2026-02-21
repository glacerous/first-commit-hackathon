import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function processJob(jobId: number, repoId: number) {
    console.log(`[Worker] Processing job ${jobId} for repo ${repoId}`);

    // 1. Mark as running
    await pool.query(
        'UPDATE analysis_jobs SET status = $1, updated_at = NOW() WHERE id = $2',
        ['running', jobId]
    );

    try {
        // 2. Simulate analysis (placeholder for real analysis logic)
        // In the future, this is where LLM mapping and tech stack detection happens
        await pool.query(
            'UPDATE analysis_jobs SET progress = 50, updated_at = NOW() WHERE id = $1',
            [jobId]
        );

        // Mocking component detection
        await pool.query(
            'INSERT INTO detected_components (repo_id, kind, name, confidence, description) VALUES ($1, $2, $3, $4, $5)',
            [repoId, 'framework', 'Next.js', 0.95, 'Detected via package.json']
        );

        // 3. Mark as completed
        await pool.query(
            'UPDATE analysis_jobs SET status = $1, progress = 100, updated_at = NOW() WHERE id = $2',
            ['completed', jobId]
        );
        console.log(`[Worker] Job ${jobId} completed successfully`);

    } catch (error: any) {
        console.error(`[Worker] Job ${jobId} failed:`, error.message);
        await pool.query(
            'UPDATE analysis_jobs SET status = $1, error = $2, updated_at = NOW() WHERE id = $3',
            ['failed', error.message, jobId]
        );
    }
}

async function poolJobs() {
    console.log('[Worker] Checking for pending jobs...');
    const res = await pool.query(
        'SELECT id, repo_id FROM analysis_jobs WHERE status = $1 ORDER BY created_at ASC LIMIT 1',
        ['pending']
    );

    if (res.rows.length > 0) {
        const { id, repo_id } = res.rows[0];
        await processJob(id, repo_id);
    }
}

async function main() {
    console.log('[Worker] Started and polling...');
    setInterval(poolJobs, 5000); // Poll every 5 seconds
}

main().catch(console.error);
