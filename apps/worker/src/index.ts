import pg from "pg";
import * as dotenv from "dotenv";
import { simpleGit } from "simple-git";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

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

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";
const POLL_MS = Number(process.env.POLL_MS || 5000);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

function buildCloneUrl(repoUrl: string): { cloneUrl: string; safeUrl: string } {
  const normalized = repoUrl.endsWith(".git") ? repoUrl : `${repoUrl}.git`;
  if (!GITHUB_TOKEN) return { cloneUrl: normalized, safeUrl: normalized };
  const githubMatch = normalized.match(/^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)$/);
  if (githubMatch) {
    const owner = githubMatch[1];
    const repo = githubMatch[2];
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

// FIX 1: Parse package.json fully and extract ALL deps as a flat known-names list
interface PackageSummary {
  file_path: string;
  name: string | null;
  scripts: Record<string, string>;
  deps: Record<string, string>;
  devDeps: Record<string, string>;
  allDependencyNames: string[]; // NEW: explicit flat list so Groq can't miss any
}

async function summarizePackageJson(repoDir: string, rel: string): Promise<{ summary: string; parsed: PackageSummary | null }> {
  const raw = await readTextIfExists(repoDir, rel, 500_000); // raised limit
  if (!raw) return { summary: "", parsed: null };

  try {
    const j = JSON.parse(raw);
    const deps: Record<string, string> = j.dependencies ?? {};
    const devDeps: Record<string, string> = j.devDependencies ?? {};
    const peerDeps: Record<string, string> = j.peerDependencies ?? {};

    const allDependencyNames = [
      ...Object.keys(deps),
      ...Object.keys(devDeps),
      ...Object.keys(peerDeps),
    ];

    const parsed: PackageSummary = {
      file_path: rel,
      name: j.name ?? null,
      scripts: j.scripts ?? {},
      deps,
      devDeps,
      allDependencyNames,
    };

    const summary = JSON.stringify(parsed, null, 2);
    return { summary, parsed };
  } catch {
    return { summary: raw.slice(0, 30_000), parsed: null };
  }
}

// FIX 2: Collect all package.json dep names across the whole repo
async function collectAllDependencyNames(repoDir: string, allPaths: string[]): Promise<string[]> {
  const pkgJsonPaths = allPaths.filter(p => p.endsWith("package.json"));
  const allNames = new Set<string>();

  for (const rel of pkgJsonPaths) {
    const raw = await readTextIfExists(repoDir, rel, 500_000);
    if (!raw) continue;
    try {
      const j = JSON.parse(raw);
      for (const key of [
        ...Object.keys(j.dependencies ?? {}),
        ...Object.keys(j.devDependencies ?? {}),
        ...Object.keys(j.peerDependencies ?? {}),
      ]) {
        allNames.add(key);
      }
    } catch { /* skip malformed */ }
  }

  return Array.from(allNames);
}

async function buildEvidencePack(repoDir: string) {
  const files: Array<{ file_path: string; content: string }> = [];

  const allPaths = await walkFiles(repoDir, "", 0, 6);

  const isInteresting = (p: string) => {
    const low = p.toLowerCase();
    return (
      low.endsWith("package.json") ||
      low.endsWith("pnpm-lock.yaml") ||
      low.endsWith("yarn.lock") ||
      low.endsWith("package-lock.json") ||
      low.endsWith("go.mod") ||
      low.endsWith("go.sum") ||
      low.endsWith("requirements.txt") ||
      low.endsWith("pyproject.toml") ||
      low.endsWith("setup.py") ||
      low.endsWith("composer.json") ||
      low.endsWith("composer.lock") ||
      low.endsWith("cargo.toml") ||
      low.endsWith("gemfile") ||
      low.endsWith("pom.xml") ||
      low.endsWith("build.gradle") ||
      low.endsWith("readme.md") ||
      low === "readme" ||
      low.endsWith("next.config.js") ||
      low.endsWith("next.config.mjs") ||
      low.endsWith("next.config.ts") ||
      low.endsWith("tailwind.config.js") ||
      low.endsWith("tailwind.config.ts") ||
      low.endsWith("dockerfile") ||
      low.endsWith("docker-compose.yml") ||
      low.endsWith("docker-compose.yaml") ||
      low.includes("prisma/schema.prisma") ||
      low.startsWith(".github/workflows/") ||
      low.endsWith("tsconfig.json") ||
      low.endsWith("manage.py") ||
      low.endsWith(".eslintrc") ||
      low.endsWith(".eslintrc.js") ||
      low.endsWith(".eslintrc.json") ||
      low.endsWith("eslint.config.js") ||
      low.endsWith("eslint.config.mjs") ||
      low.endsWith("vite.config.ts") ||
      low.endsWith("vite.config.js")
    );
  };

  const selected = allPaths.filter(isInteresting);

  const priority = (p: string) => {
    const low = p.toLowerCase();
    if (low.endsWith("package.json")) return 1;
    if (low.endsWith("go.mod") || low.endsWith("requirements.txt") || low.endsWith("pyproject.toml") || low.endsWith("composer.json") || low.endsWith("cargo.toml") || low.endsWith("gemfile")) return 2;
    if (low.endsWith("readme.md") || low === "readme") return 3;
    if (low.includes("prisma/schema.prisma")) return 4;
    if (low.includes("next.config.")) return 5;
    if (low.includes("tailwind.config.")) return 6;
    if (low.startsWith(".github/workflows/")) return 7;
    if (low.endsWith("dockerfile") || low.endsWith("docker-compose.yml") || low.endsWith("docker-compose.yaml")) return 8;
    if (low.endsWith("tsconfig.json") || low.endsWith("vite.config.ts") || low.endsWith("vite.config.js")) return 9;
    if (low.endsWith("pnpm-lock.yaml") || low.endsWith("yarn.lock") || low.endsWith("package-lock.json") || low.endsWith("go.sum") || low.endsWith("composer.lock")) return 10;
    return 11;
  };

  selected.sort((a, b) => priority(a) - priority(b));

  const maxFiles = 20; // raised from 15
  const chosen = selected.slice(0, maxFiles);

  for (const rel of chosen) {
    let content: string | null = null;
    if (rel.endsWith("package.json")) {
      const { summary } = await summarizePackageJson(repoDir, rel);
      content = summary || null;
    } else {
      const maxChars = (rel.endsWith("pnpm-lock.yaml") || rel.endsWith("yarn.lock") || rel.endsWith("package-lock.json"))
        ? 8_000
        : 20_000;
      content = await readTextIfExists(repoDir, rel, maxChars);
    }
    if (content) files.push({ file_path: rel, content });
  }

  // FIX 3: collect the full flat dep name list separately for prompt injection
  const allDependencyNames = await collectAllDependencyNames(repoDir, allPaths);

  const foundPaths = files.map((f) => f.file_path);
  console.log("[Worker] Evidence found:", foundPaths);
  console.log("[Worker] Total unique dep names found:", allDependencyNames.length);

  return { foundPaths, files, allDependencyNames };
}

async function groqDetectComponents(input: {
  foundPaths: string[];
  files: Array<{ file_path: string; content: string }>;
  allDependencyNames: string[]; // FIX 4: pass explicit dep names
}) {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  // FIX 5: Much more aggressive system prompt
  const system = `
You are a thorough repository technology stack auditor. Your job is to detect EVERY meaningful library, framework, tool, and language used in the repository.

## CRITICAL RULE: You MUST create one component entry for EVERY package name in the "all_dependency_names" list provided by the user.
Do NOT skip any package. If you don't know what a package does, describe it generically.

You MUST identify all categories:
- **Languages**: TypeScript, JavaScript, Python, Go, Rust, etc.
- **Frameworks**: Next.js, React, Vue, Nuxt, Express, FastAPI, Gin, etc.
- **UI Libraries**: Radix UI (each @radix-ui/* is its own component), Shadcn, Lucide React, etc.
- **State Management**: TanStack Query, SWR, Redux, Zustand, Jotai, etc.
- **Animation**: Framer Motion, Motion, etc.
- **Forms & Validation**: React Hook Form, Zod, Yup, etc.
- **Data/Tables**: TanStack Table, Recharts, etc.
- **Styling**: Tailwind CSS, class-variance-authority, clsx, tailwind-merge, etc.
- **Utilities**: date-fns, axios, etc.
- **Carousel/UI components**: Embla Carousel, Swiper, etc.
- **Auth**: NextAuth, better-auth, etc.
- **Database/ORM**: Prisma, @prisma/client, etc.
- **File Upload**: UploadThing, etc.
- **Build/Dev Tools**: ESLint, TypeScript, Vite, etc.
- **CI/CD & Infra**: GitHub Actions, Docker, etc.

## Output Format
Output a single JSON object with EXACT shape:
{
  "components": [
    {
      "name": "Human-readable name (e.g. 'Framer Motion', 'Radix UI Accordion')",
      "type": "language|framework|library|ui_component|state_management|validation|animation|database|cache|ci_cd|tooling|infra|testing|other",
      "version": "string or null",
      "confidence": 0.0-1.0,
      "evidence": [
        { "file_path": "path from found_files", "snippet": "short proof" }
      ]
    }
  ]
}

## Rules
- Create an entry for EVERY item in all_dependency_names. No exceptions.
- For @radix-ui/* packages, group them as one entry named "Radix UI" unless there are many; or split by component.
- confidence should be 1.0 for anything explicitly listed in package.json.
- evidence.file_path MUST be one of found_files.
`.trim();

  const user = {
    found_files: input.foundPaths,
    // FIX 6: Explicitly pass the dep names so the model CANNOT miss them
    all_dependency_names: input.allDependencyNames,
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
    // FIX 7: Raise max_tokens so a large dep list isn't cut off
    max_tokens: 400,
  };
  console.log("[Groq DEBUG] model=", GROQ_MODEL);
  console.log("[Groq DEBUG] max_tokens=", body.max_tokens);

  if (body.max_tokens !== 400) {
    throw new Error(`[Groq DEBUG] max_tokens is not 400, got ${body.max_tokens}`);
  }
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
  const finalComponents = [];

  for (const c of parsed.components) {
    try {
      if (!c?.name || !c?.type || typeof c?.confidence !== "number") {
        console.warn("[Worker] Skipping component with missing basic fields:", c?.name);
        continue;
      }

      if (!Array.isArray(c.evidence) || c.evidence.length === 0) {
        // Find any package.json in found files
        const pkgFile = input.foundPaths.find(p => p.endsWith("package.json")) ?? input.foundPaths[0] ?? "package.json";
        c.evidence = [{ file_path: pkgFile, snippet: "Detected via project dependencies" }];
      }

      const validEvidence = [];
      for (const ev of c.evidence) {
        if (!ev.file_path || ev.file_path === "metadata") {
          const pkgFile = input.foundPaths.find(p => p.endsWith("package.json")) ?? "package.json";
          validEvidence.push({ file_path: pkgFile, snippet: ev.snippet || "Detected via metadata" });
          continue;
        }
        if (allowed.has(ev.file_path)) {
          validEvidence.push({
            file_path: ev.file_path,
            snippet: (typeof ev.snippet === "string" ? ev.snippet : "Detected").slice(0, 500)
          });
        }
      }

      if (validEvidence.length === 0) {
        const pkgFile = input.foundPaths.find(p => p.endsWith("package.json")) ?? "package.json";
        validEvidence.push({ file_path: pkgFile, snippet: "Detected via project metadata" });
      }

      c.evidence = validEvidence;
      finalComponents.push(c);
    } catch (err) {
      console.error("[Worker] Error validating component:", c?.name, err);
    }
  }

  return finalComponents as Array<{
    name: string;
    type: string;
    version: string | null;
    confidence: number;
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
      INSERT INTO public.detected_components (repo_id, name, type, version, confidence)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `,
      [repoId, c.name, c.type, c.version ?? null, c.confidence]
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