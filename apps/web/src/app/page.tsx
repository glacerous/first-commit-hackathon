'use client';

import React from 'react';

export default function Home() {
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
          <div className="text-[20px] font-bold tracking-tighter">REPOLY</div>

          <div className="hidden items-center gap-[30px] lg:flex">
            {['Product', 'How it Works', '3D Demo', 'Docs'].map((item) => (
              <a
                key={item}
                href="#"
                className="group flex items-center gap-2 text-[14px] font-medium text-white/90 transition-colors hover:text-white"
              >
                {item}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/arg" className="opacity-60 transition-transform group-hover:translate-y-0.5">
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

        {/* CTA Row */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button className="rounded-full bg-white px-8 py-3 text-[15px] font-semibold text-black transition-all hover:scale-105 active:scale-95">
            Analyze a Repo
          </button>
          <button className="rounded-full border border-white/30 bg-white/5 px-8 py-3 text-[15px] font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/50">
            View 3D Demo
          </button>
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
