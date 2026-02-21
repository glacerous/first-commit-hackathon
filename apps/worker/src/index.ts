import pg from "pg";
import * as dotenv from "dotenv";
import { simpleGit } from "simple-git";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

dotenv.config();
const { Pool } = pg;

const pool = new Pool(process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
} : {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
});

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
const POLL_MS = Number(process.env.POLL_MS || 5000);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

/**
 * Build an authenticated clone URL if GITHUB_TOKEN is available.
 * Returns both the actual clone URL and a safe URL for logging.
 */
function buildCloneUrl(repoUrl: string): { cloneUrl: string; safeUrl: string } {
  // Normalize to .git
  const normalized = repoUrl.endsWith(".git") ? repoUrl : `${repoUrl}.git`;

  if (!GITHUB_TOKEN) {
    return { cloneUrl: normalized, safeUrl: normalized };
  }

  // Check if it's a GitHub HTTPS URL
  const githubMatch = normalized.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)$/);
  if (githubMatch) {
    const owner = githubMatch[1];
    const repo = githubMatch[2];
    // https://x-access-token:<TOKEN>@github.com/org/repo.git
    return {
      cloneUrl: `https://x-access-token:${GITHUB_TOKEN}@github.com/${owner}/${repo}`,
      safeUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  return { cloneUrl: normalized, safeUrl: normalized };
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function readTextIfExists(repoDir: string, rel: string, maxChars = 30_000) {
  const p = path.join(repoDir, rel);
  try {
    const st = await fs.stat(p);
    if (!st.isFile()) return null;
    const txt = await fs.readFile(p, "utf8");
    return txt.length > maxChars ? txt.slice(0, maxChars) + "\n/* truncated */\n" : txt;
  } catch {
    return null;
  }
}

async function walkFiles(repoDir: string, rel = "", depth = 0, maxDepth = 6): Promise<string[]> {
  if (depth > maxDepth) return [];
  const dir = path.join(repoDir, rel);
  let out: string[] = [];
  let entries: any[];

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const e of entries) {
    if (["node_modules", ".git", "dist", ".next", "build", "out", ".turbo"].includes(e.name)) continue;
    const childRel = rel ? path.join(rel, e.name) : e.name;

    if (e.isDirectory()) {
      out = out.concat(await walkFiles(repoDir, childRel, depth + 1, maxDepth));
    } else {
      out.push(childRel.replace(/\\/g, "/"));
    }
  }
  return out;
}

async function summarizePackageJson(repoDir: string, rel: string) {
  const raw = await readTextIfExists(repoDir, rel, 200_000);
  if (!raw) return null;

  try {
    const j = JSON.parse(raw);
    return JSON.stringify(
      {
        file_path: rel,
        name: j.name ?? null,
        scripts: j.scripts ?? {},
        deps: j.dependencies ?? {},
        devDeps: j.devDependencies ?? {},
      },
      null,
      2
    );
  } catch {
    return raw.slice(0, 30_000);
  }
}

async function buildEvidencePack(repoDir: string) {
  const files: Array<{ file_path: string; content: string }> = [];

  const allPaths = await walkFiles(repoDir, "", 0, 6);

  const isInteresting = (p: string) =>
    p.endsWith("package.json") ||
    p.endsWith("pnpm-lock.yaml") ||
    p.endsWith("yarn.lock") ||
    p.endsWith("package-lock.json") ||
    p.endsWith("next.config.js") ||
    p.endsWith("next.config.mjs") ||
    p.endsWith("tailwind.config.js") ||
    p.endsWith("tailwind.config.ts") ||
    p.endsWith("Dockerfile") ||
    p.endsWith("docker-compose.yml") ||
    p.endsWith("prisma/schema.prisma") ||
    p.startsWith(".github/workflows/") ||
    p.endsWith("tsconfig.json");

  const selected = allPaths.filter(isInteresting);

  const priority = (p: string) => {
    if (p.endsWith("package.json")) return 1;
    if (p.includes(".github/workflows/")) return 2;
    if (p.includes("prisma/schema.prisma")) return 3;
    if (p.includes("next.config.")) return 4;
    if (p.includes("tailwind.config.")) return 5;
    if (p.endsWith("Dockerfile") || p.endsWith("docker-compose.yml")) return 6;
    if (p.endsWith("tsconfig.json")) return 7;
    if (p.endsWith("pnpm-lock.yaml") || p.endsWith("yarn.lock") || p.endsWith("package-lock.json")) return 8;
    return 9;
  };

  selected.sort((a, b) => priority(a) - priority(b));

  const maxFiles = 15;
  const chosen = selected.slice(0, maxFiles);

  for (const rel of chosen) {
    let content: string | null = null;

    if (rel.endsWith("package.json")) {
      content = await summarizePackageJson(repoDir, rel);
    } else {
      const maxChars =
        rel.endsWith("pnpm-lock.yaml") || rel.endsWith("yarn.lock") || rel.endsWith("package-lock.json")
          ? 8_000
          : 20_000;
      content = await readTextIfExists(repoDir, rel, maxChars);
    }

    if (content) files.push({ file_path: rel, content });
  }

  const foundPaths = files.map((f) => f.file_path);

  console.log("[Worker] Evidence found:", foundPaths);
  console.log("[Worker] Evidence sizes:", files.map((f) => ({ p: f.file_path, n: f.content.length })));

  return { foundPaths, files };
}

async function groqDetectComponents(input: { foundPaths: string[]; files: Array<{ file_path: string; content: string }> }) {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const system = `
You are a repository tech stack detector.

You MUST output a single JSON object with EXACT shape:
{
  "components": [
    {
      "name": "string",
      "type": "language|framework|database|cache|ci_cd|tooling|infra|testing|other",
      "version": "string or null",
      "confidence": number,
      "description": "string — 1-2 sentences, plain English, explaining what this component does in the context of this repo",
      "evidence": [
        { "file_path": "string from found_files", "snippet": "short quote <=200 chars" }
      ]
    }
  ]
}

Rules:
- Every component MUST have evidence with at least 1 item.
- Every component MUST have a description (non-empty string, max 300 characters).
- evidence.file_path MUST be one of found_files.
- evidence.snippet MUST be a direct quote from the provided file content.
- Use ONLY provided evidence; if not supported, omit the component.
`.trim();

  const user = {
    found_files: input.foundPaths,
    file_contents: input.files.map((f) => ({ file_path: f.file_path, content: f.content })),
  };

  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`Groq error ${resp.status}: ${await resp.text()}`);

  const data: any = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No Groq content");

  const parsed = JSON.parse(content);
  if (!parsed.components || !Array.isArray(parsed.components)) throw new Error("Invalid JSON: missing components[]");

  const allowed = new Set(input.foundPaths);
  for (const c of parsed.components) {
    if (!c?.name || !c?.type || typeof c?.confidence !== "number") throw new Error("Invalid component fields");
    if (!Array.isArray(c.evidence) || c.evidence.length === 0) throw new Error(`Component ${c.name} missing evidence`);
    // Validate and normalize description
    if (typeof c.description === "string") {
      c.description = c.description.trim().slice(0, 500) || null;
    } else {
      c.description = null;
    }
    for (const ev of c.evidence) {
      if (!allowed.has(ev.file_path)) throw new Error(`Invalid evidence file_path: ${ev.file_path}`);
      if (typeof ev.snippet !== "string") throw new Error("Evidence snippet must be string");
      if (ev.snippet.length > 500) ev.snippet = ev.snippet.slice(0, 500);
    }
  }

  return parsed.components as Array<{
    name: string;
    type: string;
    version: string | null;
    confidence: number;
    description: string | null;
    evidence: Array<{ file_path: string; snippet: string }>;
  }>;
}

async function getRepo(repoId: number) {
  const r = await pool.query(`SELECT url, default_branch FROM public.repos WHERE id=$1`, [repoId]);
  if (r.rows.length === 0) throw new Error("Repo not found");
  return r.rows[0] as { url: string; default_branch: string };
}

async function clearOld(repoId: number) {
  await pool.query(`DELETE FROM public.detected_components WHERE repo_id=$1`, [repoId]);
}

async function insertAll(repoId: number, comps: any[]) {
  for (const c of comps) {
    const ins = await pool.query(
      `
      INSERT INTO public.detected_components (repo_id, name, type, version, confidence, description)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id
      `,
      [repoId, c.name, c.type, c.version ?? null, c.confidence, c.description ?? null]
    );
    const componentId = Number(ins.rows[0].id);

    for (const ev of c.evidence) {
      await pool.query(
        `
        INSERT INTO public.evidence (component_id, file_path, snippet)
        VALUES ($1,$2,$3)
        `,
        [componentId, ev.file_path, ev.snippet.slice(0, 10_000)]
      );
    }
  }
}

async function processJob(jobId: number, repoId: number) {
  console.log(`[Worker] Processing job ${jobId} for repo ${repoId}`);

  await pool.query(
    `UPDATE public.analysis_jobs SET status=$1, progress=$2, updated_at=NOW(), error_message=NULL WHERE id=$3`,
    ["running", 1, jobId]
  );

  const repo = await getRepo(repoId);

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "repoly-"));
  const repoDir = path.join(tmpDir, "repo");

  try {
    const { cloneUrl, safeUrl } = buildCloneUrl(repo.url);
    console.log(`[Worker] Cloning ${safeUrl} into ${repoDir}`);

    await simpleGit().clone(cloneUrl, repoDir, ["--depth", "1", "--branch", repo.default_branch || "main"]);
    await pool.query(`UPDATE public.analysis_jobs SET progress=$1, updated_at=NOW() WHERE id=$2`, [30, jobId]);

    const evidencePack = await buildEvidencePack(repoDir);
    if (evidencePack.files.length === 0) throw new Error("No evidence files found");

    await pool.query(`UPDATE public.analysis_jobs SET progress=$1, updated_at=NOW() WHERE id=$2`, [50, jobId]);

    const components = await groqDetectComponents(evidencePack);
    console.log("[Worker] Groq components count:", components.length);
    console.log("[Worker] Groq components:", components.map((c) => `${c.type}:${c.name}`));

    await pool.query(`UPDATE public.analysis_jobs SET progress=$1, updated_at=NOW() WHERE id=$2`, [75, jobId]);

    await clearOld(repoId);
    await insertAll(repoId, components);

    await pool.query(
      `UPDATE public.analysis_jobs SET status=$1, progress=$2, updated_at=NOW(), finished_at=NOW() WHERE id=$3`,
      ["succeeded", 100, jobId]
    );

    console.log(`[Worker] Job ${jobId} succeeded`);
  } catch (err: any) {
    console.error(`[Worker] Job ${jobId} failed:`, err?.message ?? err);
    await pool.query(
      `UPDATE public.analysis_jobs SET status=$1, updated_at=NOW(), finished_at=NOW(), error_message=$2 WHERE id=$3`,
      ["failed", String(err?.message ?? err).slice(0, 5000), jobId]
    );
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { }
  }
}

async function pollOnce() {
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

  await processJob(Number(res.rows[0].id), Number(res.rows[0].repo_id));
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