'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');

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

  const handleAnalyze = () => {
    const normalized = validateAndNormalize(repoUrl);
    if (normalized) {
      setError('');
      window.location.href = `/lab?repo=${encodeURIComponent(normalized)}`;
    } else {
      setError('Please enter a valid GitHub repository URL (e.g., owner/repo)');
    }
  };

  const fillExample = (example: string) => {
    setRepoUrl(example);
    setError('');
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
          background: linear-gradient(144.5deg, rgba(255,255,255,1) 28%, rgba(255,255,255,0) 115%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grid-overlay {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>

      {/* Background Video */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
            type="video/mp4"
          />
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 z-10" />
        {/* Grid Overlay */}
        <div className="grid-overlay absolute inset-0 z-20 pointer-events-none opacity-40" />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex w-full items-center justify-between px-6 py-5 lg:px-[120px] lg:py-[20px]">
        <div className="flex items-center gap-[30px]">
          {/* <div className="text-[20px] font-bold tracking-tighter">REPOLY</div> */}
          <Image src="/repoly.svg" alt="REPOLY" width={100} height={100} priority />
          <div className="hidden items-center gap-[30px] lg:flex">
            {['Product', 'How it Works', '3D Demo', 'Docs'].map((item) => (
              <a
                key={item}
                href="#"
                className="group flex items-center gap-2 text-[14px] font-medium text-white/90 transition-colors hover:text-white"
              >
                {item}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60 transition-transform group-hover:translate-y-0.5">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <button className="relative overflow-hidden rounded-full border-[0.6px] border-white/30 bg-black/40 px-[29px] py-[11px] text-[14px] font-medium backdrop-blur-md transition-all hover:bg-black/60 hover:border-white/60">
          <div className="absolute -top-[10px] left-1/2 h-[20px] w-full -translate-x-1/2 bg-white/10 blur-xl pointer-events-none" />
          Join Waitlist
        </button>
      </nav>

      {/* Hero Content */}
      <section className="relative z-30 flex min-h-screen flex-col items-center justify-center px-6 text-center pt-[200px] pb-[102px] lg:pt-[280px]">
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
        <p className="mt-6 max-w-[680px] text-[15px] font-normal leading-relaxed text-white/70">
          Repoly turns a GitHub URL into an interactive 3D infrastructure schematic — languages become towers,
          databases become silos, CI/CD becomes transmission lines. Explore architecture, dependencies, and tech stack in seconds.
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
              className="h-full rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
            >
              Analyze
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
      </section>

      {/* Status Chip */}
      <div className="absolute bottom-10 right-10 z-50 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[12px] font-medium tracking-wide text-white/50">
            MODE: <span className="text-white/90 uppercase">Prototype (Mock Data)</span>
          </span>
        </div>
      </div>
    </main>
  );
}
