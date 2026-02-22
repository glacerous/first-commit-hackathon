'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateAndNormalize = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Pattern matching
    const githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+(?:\.git)?)$/;
    const shortRegex = /^([^/]+)\/([^/]+(?:\.git)?)$/;

    let match = trimmed.match(githubRegex);
    if (!match) {
      match = trimmed.match(shortRegex);
    }

    if (match) {
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, '');
      return `https://github.com/${owner}/${repo}`;
    }
    return null;
  };

  const parseOwnerRepo = (normalizedUrl: string) => {
    // normalizedUrl: https://github.com/owner/repo
    const m = normalizedUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
    if (!m) return null;
    return { owner: m[1], name: m[2] };
  };

  const handleAnalyze = async () => {
    const normalized = validateAndNormalize(repoUrl);
    if (!normalized) {
      setError('Please enter a valid GitHub repository URL (e.g., owner/repo)');
      return;
    }

    const parsed = parseOwnerRepo(normalized);
    if (!parsed) {
      setError('Could not parse owner/repo from URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

      const res = await fetch(`${apiBase}/api/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalized,
          owner: parsed.owner,
          name: parsed.name,
          default_branch: 'main', // optional, backend fallback juga 'main'
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Request failed: ${res.status}`);
      }

      const data: { repoId: number; jobId: number } = await res.json();

      // redirect ke lab pakai id (lebih stabil dari URL)
      window.location.href = `/lab?repoId=${encodeURIComponent(String(data.repoId))}&jobId=${encodeURIComponent(
        String(data.jobId)
      )}`;
    } catch (e: any) {
      setError(e?.message ? `API error: ${e.message}` : 'API error');
    } finally {
      setLoading(false);
    }
  };

  const fillExample = (example: string) => {
    setRepoUrl(example);
    setError('');
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      {/* Font Injection for Prototype */}
      <link
        href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600,400&display=swap"
        rel="stylesheet"
      />

      <style jsx global>{`
        body {
          font-family: 'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background: #000;
        }
        .text-gradient {
          background: linear-gradient(144.5deg, rgba(255,255,255,1) 40%, rgba(255,255,255,0.6) 115%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grid-overlay {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>


      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex w-full items-center justify-between px-6 py-5 lg:px-[120px] lg:py-[20px]">
        <div className="flex items-center gap-[30px]">
          {/* <div className="text-[20px] font-bold tracking-tighter">REPOLY</div> */}
          <Image src="/repoly.svg" alt="REPOLY" width={100} height={100} priority />
          <div className="hidden items-center gap-[30px] lg:flex">
            {[
              { label: 'Product', id: 'product' },
              { label: 'How it Works', id: 'how' },
              { label: '3D Demo', id: 'demo' },
            ].map((item) => (
              <a
                key={item.label}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                className="group flex items-center gap-2 text-[14px] font-medium text-white/90 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

      </nav>

      {/* Hero Content */}
      <section className="relative z-30 flex min-h-[90vh] flex-col items-center justify-center px-6 text-center pt-[140px] pb-[100px]">
        {/* Background Video (Restricted to Hero) */}
        <div className="absolute inset-x-0 top-0 bottom-[10%] z-0 overflow-hidden rounded-b-[60px]">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-60"
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
              type="video/mp4"
            />
          </video>
          {/* Overlay Gradient (Lightened for better text contrast) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60 z-10" />
          {/* Grid Overlay */}
          <div className="grid-overlay absolute inset-0 z-20 pointer-events-none opacity-20" />
        </div>

        {/* Content Container (Ensure it's above the background) */}
        <div className="relative z-30 flex flex-col items-center">
          {/* Badge */}
          <div className="mb-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <div className="h-1 w-1 rounded-full bg-white shadow-[0_0_8px_white]" />
            <span className="text-[13px] font-medium">
              <span className="text-white/60">Hackathon Prototype</span>
              <span className="ml-1 text-white">Live Demo Soon</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-gradient max-w-[613px] text-[36px] font-medium leading-[1.1] tracking-tight lg:text-[56px] lg:leading-[1.28]">
            Understand Any Repository as a Living System
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-[680px] text-[15px] font-normal leading-relaxed text-white/90">
            Repoly analyzes repositories and visualizes them as an interactive 3D schematic — languages become towers,
            databases become silos, CI/CD becomes transmission lines. The mapping engine is open and extensible.
          </p>

          {/* Analyze Bar */}
          <div className="mt-12 w-full max-w-[720px]">
            <div className={`group flex h-14 w-full items-center gap-3 rounded-full border bg-white/5 p-1 pl-5 backdrop-blur transition-all duration-300 ${error ? 'border-red-400/30' : 'border-white/10 focus-within:border-white/25 focus-within:ring-1 focus-within:ring-white/15'}`}>
              <svg className="h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="https://github.com/owner/repo"
                className="w-full bg-transparent text-[15px] font-normal text-white outline-none placeholder:text-white/40"
              />
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="h-full rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing…' : 'Analyze'}
              </button>
            </div>

            {error && <p className="mt-3 text-left text-xs font-medium text-red-300/80 pl-5">{error}</p>}

            {/* Example Chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest mr-1">Try:</span>
              {['vercel/next.js', 'facebook/react', 'threejs/three.js'].map((repo) => (
                <button
                  key={repo}
                  onClick={() => fillExample(repo)}
                  className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  {repo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <div className="relative z-30 bg-black/40 border-t border-white/5">
        {/* Product Section */}
        <section id="product" className="max-w-7xl mx-auto py-24 px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <h2 className="text-3xl font-medium mb-6 text-gradient lg:text-4xl">Architecture Visualization</h2>
              <p className="text-[16px] text-white/60 leading-relaxed mb-8">
                Stop manually drawing diagrams. Repoly automatically extracts the mental model of your codebase and renders it as a navigable 3D world.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Auto-Discovery", desc: "Instant repo scanning" },
                  { title: "Real-time", desc: "Live analysis updates" }
                ].map((f) => (
                  <div key={f.title} className="p-4 rounded-2xl border border-white/5 bg-white/5">
                    <div className="text-white font-medium text-sm mb-1">{f.title}</div>
                    <div className="text-white/40 text-xs">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-video rounded-3xl bg-white/5 border border-white/10 overflow-hidden relative group">
              <img
                src="/preview.png"
                alt="Architecture Visualization Preview"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how" className="max-w-4xl mx-auto py-24 px-6 border-t border-white/5">
          <div className="text-center">
            <h2 className="text-3xl font-medium mb-6 text-gradient lg:text-4xl">Automated Ingestion</h2>
            <p className="text-[16px] text-white/60 leading-relaxed mb-10 max-w-2xl mx-auto">
              Our specialized analysis engine clones your repository, detects components using advanced pattern matching,
              and maps them to a consistent 3D visual language.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {["Language Detection", "Dependency Mapping", "Service Discovery"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70 px-4 py-2 rounded-full border border-white/5 bg-white/5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3D Demo Section */}
        <section id="demo" className="max-w-7xl mx-auto py-32 px-6 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium mb-6 text-gradient lg:text-5xl">Live 3D Schematic</h2>
            <p className="max-w-2xl mx-auto text-[16px] text-white/60 leading-relaxed">
              Interact with your city. Zoom into individual modules, trace dependency lines, and understand the pulse of your development lifecycle.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { label: 'Towers', desc: 'Languages & Services' },
              { label: 'Silos', desc: 'Databases & Caches' },
              { label: 'Blocks', desc: 'CI/CD & Build Steps' },
            ].map((item) => (
              <div key={item.label} className="p-8 rounded-3xl border border-white/5 bg-white/5 text-left hover:bg-white/10 transition-all">
                <div className="text-xl font-medium text-white mb-2">{item.label}</div>
                <div className="text-sm text-white/40">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>


    </main>
  );
}
