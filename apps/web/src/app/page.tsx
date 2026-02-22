'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

const DEMO_ANALYSIS = [
  // Languages
  { name: 'Next.js', type: 'language', doc_description: 'Core web framework', version: '15.0.0', pct: 90 },
  { name: 'TypeScript', type: 'language', doc_description: 'Typed JavaScript', version: '5.2.0', pct: 85 },
  { name: 'React', type: 'language', doc_description: 'UI Library', version: '19.0.0', pct: 80 },
  { name: 'Go', type: 'language', doc_description: 'Backend logic', version: '1.22', pct: 45 },
  { name: 'Python', type: 'language', doc_description: 'AI/ML Services', version: '3.12', pct: 30 },

  // Databases & Storage
  { name: 'PostgreSQL', type: 'database', doc_description: 'Main relational DB', version: '16.1' },
  { name: 'Redis', type: 'database', doc_description: 'Performance cache', version: '7.2' },
  { name: 'S3 Cluster', type: 'database', doc_description: 'Distributed storage', version: 'v2' },
  { name: 'Elasticsearch', type: 'database', doc_description: 'Search engine', version: '8.11' },

  // Frameworks & Libs
  { name: 'Tailwind CSS', type: 'framework', doc_description: 'Style system' },
  { name: 'Prisma ORM', type: 'library', doc_description: 'Data layer' },
  { name: 'Lucide Icons', type: 'library', doc_description: 'Icon set' },
  { name: 'Framer Motion', type: 'animation', doc_description: 'Motion engine' },
  { name: 'Zustand', type: 'state_management', doc_description: 'Store' },

  // UI Components
  { name: 'Navigation', type: 'ui_component', doc_description: 'Main Layout' },
  { name: 'Dashboard', type: 'ui_component', doc_description: 'Visual Charts' },
  { name: 'Auth Module', type: 'ui_component', doc_description: 'Login System' },
  { name: 'Settings', type: 'ui_component', doc_description: 'User Config' },

  // Infra & CI/CD
  { name: 'GitHub Actions', type: 'ci_cd', doc_description: 'Pipeline' },
  { name: 'Docker', type: 'infra', doc_description: 'Containerization' },
  { name: 'Kubernetes', type: 'infra', doc_description: 'Orchestration' },
  { name: 'Terraform', type: 'infra', doc_description: 'IaC' },
  { name: 'Vercel Deployment', type: 'ci_cd', doc_description: 'Edge Host' },

  // Tooling & Testing
  { name: 'ESLint', type: 'tooling', doc_description: 'Linter' },
  { name: 'Prettier', type: 'tooling', doc_description: 'Formatter' },
  { name: 'Jest', type: 'testing', doc_description: 'Unit tests' },
  { name: 'Playwright', type: 'testing', doc_description: 'E2E' },
  { name: 'Storybook', type: 'tooling', doc_description: 'Component Lab' },
];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo State
  const [isDemo, setIsDemo] = useState(false);
  const [apiComponents, setApiComponents] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const validateAndNormalize = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const githubRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+(?:\.git)?)$/;
    const shortRegex = /^([^/]+)\/([^/]+(?:\.git)?)$/;
    let match = trimmed.match(githubRegex) || trimmed.match(shortRegex);
    if (match) {
      return `https://github.com/${match[1]}/${match[2].replace(/\.git$/, '')}`;
    }
    return null;
  };

  const handleAnalyze = async () => {
    const normalized = validateAndNormalize(repoUrl);
    if (!normalized) {
      setError('Please enter a valid GitHub repository URL (e.g., owner/repo)');
      return;
    }
    const m = normalized.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
    if (!m) return;
    setError('');
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      const res = await fetch(`${apiBase}/api/repos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, owner: m[1], name: m[2], default_branch: 'main' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      window.location.href = `/lab?repoId=${data.repoId}&jobId=${data.jobId}`;
    } catch (e: any) {
      setError(e?.message || 'API error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setError('');
    setIsDemo(true);
    setApiComponents(DEMO_ANALYSIS);
    setTimeout(() => {
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollToSection = (e: any, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- FULL PRECISION RENDERER PORT FROM LAB ---
  useEffect(() => {
    if (typeof window === 'undefined' || !isDemo || !containerRef.current) return;

    let cleanup = () => { };

    const loadGraphics = async () => {
      // Inject importmap
      if (!document.querySelector('script[type="importmap"]')) {
        const im = document.createElement('script');
        im.type = 'importmap';
        im.textContent = JSON.stringify({ imports: { "three": "https://unpkg.com/three@0.161.0/build/three.module.js" } });
        document.head.appendChild(im);
      }

      const THREE = await eval(`import('https://unpkg.com/three@0.161.0/build/three.module.js')`);
      const { OrbitControls } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js')`);
      const { EffectComposer } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js')`);
      const { RenderPass } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/RenderPass.js')`);
      const { UnrealBloomPass } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/UnrealBloomPass.js')`);
      const { ShaderPass } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/ShaderPass.js')`);
      const { GammaCorrectionShader } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/shaders/GammaCorrectionShader.js')`);
      const { RoundedBoxGeometry } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/geometries/RoundedBoxGeometry.js')`);

      const THEME = {
        bg: 0x070a0f, terrain: 0x0a0c0e, lines: 0x374151, cable: 0x2ef2c8, accent: 0x2ef2c8, outlines: 0xffffff,
        tints: {
          language: 0xe5e7eb, database: 0x86a8ff, framework: 0x2ef2c8, library: 0xd1d5db,
          ui_component: 0xf472b6, state_management: 0x60a5fa, validation: 0x34d399,
          animation: 0xfcd34d, tooling: 0xfacc15, infra: 0xa855f7, testing: 0x10b981, ci_cd: 0x3b82f6, default: 0xd9dde3
        }
      };

      let scene: any, camera: any, renderer: any, composer: any, controls: any;
      const buildingsGroup = new THREE.Group();
      const cablesGroup = new THREE.Group();
      const animatables: any[] = [];
      const districtGroups: any = {};
      const pickables: any[] = [];

      const createAssetMaterial = (type: string) => {
        const color = THEME.tints[type] || THEME.tints.default;
        return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.1, transparent: true, opacity: 1 });
      };

      const addOutlines = (mesh: any, group: any) => {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 }));
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        group.add(line);
      };

      const finalize = (group: any, type: string) => {
        group.traverse((c: any) => { if (c.isMesh) addOutlines(c, group); });
        pickables.push(group);
        return group;
      };

      const createLanguageTower = (api: any) => {
        const h = (api.pct || 50) * 1.8, w = 15;
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new RoundedBoxGeometry(w, h, w, 2, 2).translate(0, h / 2, 0), createAssetMaterial('language')));
        group.add(new THREE.Mesh(new RoundedBoxGeometry(w + 4, 4, w + 4, 2, 2).translate(0, h + 2, 0), createAssetMaterial('language')));
        return finalize(group, 'language');
      };

      const createPowerPlant = (type: string) => {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new RoundedBoxGeometry(30, 15, 30, 2, 2).translate(0, 7.5, 0), createAssetMaterial(type)));
        for (let i = -1; i <= 1; i += 2) {
          group.add(new THREE.Mesh(new THREE.CylinderGeometry(6, 8, 25).translate(i * 8, 20, 0), createAssetMaterial(type)));
        }
        return finalize(group, type);
      };

      const createSilo = (type: string) => {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 45).translate(0, 22.5, 0), createAssetMaterial(type)));
        group.add(new THREE.Mesh(new THREE.SphereGeometry(15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 45, 0), createAssetMaterial(type)));
        return finalize(group, type);
      };

      const createSolarField = () => {
        const group = new THREE.Group();
        for (let i = 0; i < 9; i++) {
          const panel = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), createAssetMaterial('ui_component'));
          panel.rotation.x = -Math.PI / 3;
          panel.position.set((i % 3) * 16 - 16, 5, Math.floor(i / 3) * 20 - 20);
          group.add(panel);
        }
        return finalize(group, 'ui_component');
      };

      const createTransmission = (type: string) => {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(2, 6, 70, 4).translate(0, 35, 0), createAssetMaterial(type)));
        for (let h = 30; h <= 60; h += 20) {
          group.add(new THREE.Mesh(new THREE.BoxGeometry(40, 3, 2).translate(0, h, 0), createAssetMaterial(type)));
        }
        return finalize(group, type);
      };

      const createTurbine = (type: string) => {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(new THREE.CylinderGeometry(2, 5, 80).translate(0, 40, 0), createAssetMaterial(type)));
        const blades = new THREE.Group();
        blades.position.set(0, 80, 8);
        for (let i = 0; i < 3; i++) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(3, 35, 1).translate(0, 17.5, 0), createAssetMaterial(type));
          b.rotation.z = (i * Math.PI * 2) / 3;
          blades.add(b);
        }
        group.add(blades);
        animatables.push(() => { blades.rotation.z += 0.05; });
        return finalize(group, type);
      };

      const getTerrainY = (x: number, z: number) => Math.sin(x * 0.01) * Math.cos(z * 0.01) * 20 - 30;

      const init = () => {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(THEME.bg);
        camera = new THREE.PerspectiveCamera(35, containerRef.current!.clientWidth / containerRef.current!.clientHeight, 1, 5000);
        camera.position.set(500, 400, 500);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current!.appendChild(renderer.domElement);

        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.4, 0.4));
        composer.addPass(new ShaderPass(GammaCorrectionShader));

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;

        scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(200, 500, 200);
        scene.add(dirLight);

        const terrainGeo = new THREE.PlaneGeometry(2000, 2000, 50, 50);
        const pos = terrainGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setZ(i, getTerrainY(pos.getX(i), pos.getY(i)));
        terrainGeo.computeVertexNormals();
        const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshBasicMaterial({ color: 0x374151, wireframe: true, transparent: true, opacity: 0.1 }));
        terrain.rotation.x = -Math.PI / 2;
        terrain.position.y = -80;
        scene.add(terrain);

        scene.add(buildingsGroup);
        scene.add(cablesGroup);

        const grouped: any = {};
        apiComponents.forEach(c => { (grouped[c.type] || (grouped[c.type] = [])).push(c); });
        const types = Object.keys(grouped);
        const gridSpacing = 240;

        types.forEach((type, idx) => {
          const tx = (idx % 3) * gridSpacing - gridSpacing;
          const tz = Math.floor(idx / 3) * gridSpacing - gridSpacing;
          const dGroup = new THREE.Group();
          dGroup.position.set(tx, 0, tz);
          districtGroups[type] = dGroup;

          grouped[type].forEach((item: any, i: number) => {
            let asset;
            if (type === 'language') asset = createLanguageTower(item);
            else if (type === 'database' || type === 'validation' || type === 'cache') asset = createSilo(type);
            else if (type === 'ui_component') asset = createSolarField();
            else if (type === 'ci_cd' || type === 'infra') asset = createTransmission(type);
            else if (type === 'animation' || type === 'tooling' || type === 'testing') asset = createTurbine(type);
            else asset = createPowerPlant(type);

            const ax = (i % 2) * 80 - 40 + tx;
            const az = Math.floor(i / 2) * 80 - 40 + tz;
            asset.position.set(ax, getTerrainY(ax, az), az);
            buildingsGroup.add(asset);
          });
        });

        for (let i = 0; i < types.length - 1; i++) {
          const start = districtGroups[types[i]].position;
          const end = districtGroups[types[i + 1]].position;
          const points = [];
          for (let j = 0; j <= 20; j++) {
            const t = j / 20;
            const px = start.x + (end.x - start.x) * t;
            const pz = start.z + (end.z - start.z) * t;
            points.push(new THREE.Vector3(px, getTerrainY(px, pz) + 2, pz));
          }
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: THEME.cable, transparent: true, opacity: 0.2 }));
          cablesGroup.add(line);

          const packet = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshBasicMaterial({ color: THEME.accent }));
          cablesGroup.add(packet);
          animatables.push(() => {
            const prog = (Date.now() * 0.001) % 2 / 2;
            const i = Math.floor(prog * 20);
            if (points[i]) packet.position.copy(points[i]);
          });
        }
      };

      const animate = () => {
        const frameId = requestAnimationFrame(animate);
        if (controls) controls.update();
        animatables.forEach(f => f());
        if (composer) composer.render();
        cleanup = () => {
          cancelAnimationFrame(frameId);
          if (containerRef.current) containerRef.current.innerHTML = '';
          if (renderer) renderer.dispose();
        };
      };

      init();
      animate();
    };

    loadGraphics();
    return () => cleanup();
  }, [isDemo, apiComponents]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      <link href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600,400&display=swap" rel="stylesheet" />

      <style jsx global>{`
        body { font-family: 'General Sans', sans-serif; background: #000; }
        .text-gradient { background: linear-gradient(144.5deg, #fff 40%, rgba(255,255,255,0.6) 115%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .grid-overlay { background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 32px 32px; }
      `}</style>

      {/* Hero Section */}
      <section className="relative z-30 flex min-h-[90vh] flex-col items-center justify-center px-6 text-center pt-[140px] pb-[100px]">
        <div className="absolute inset-x-0 top-0 bottom-[10%] z-0 overflow-hidden rounded-b-[60px]">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-60">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60 z-10" />
        </div>

        <div className="relative z-30 flex flex-col items-center">
          <div className="mb-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <div className="h-1 w-1 rounded-full bg-white shadow-[0_0_8px_white]" />
            <span className="text-[13px] font-medium text-white">Hackathon Prototype <span className="text-white/60">Live Demo Soon</span></span>
          </div>

          <h1 className="text-gradient max-w-[700px] text-[36px] font-medium leading-[1.1] lg:text-[64px]">Understand Any Repository as a Living System</h1>
          <p className="mt-6 max-w-[680px] text-[16px] text-white/80">
            Repoly visualizes codebases as interactive 3D cities — languages become towers, databases become silos, and CI/CD becomes transmission lines.
          </p>

          <div className="mt-12 w-full max-w-[720px]">
            <div className={`group flex h-14 w-full items-center gap-3 rounded-full border bg-white/5 p-1 pl-5 backdrop-blur transition-all ${error ? 'border-red-400/30' : 'border-white/10 focus-within:border-white/30'}`}>
              <svg className="h-5 w-5 opacity-50" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              <input type="text" value={repoUrl} onChange={(e) => { setRepoUrl(e.target.value); setError(''); }} onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} placeholder="https://github.com/owner/repo" className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/30" />
              <button onClick={handleAnalyze} disabled={loading} className="h-12 mr-1 rounded-full bg-white px-8 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-all">{loading ? 'Analyzing...' : 'Analyze'}</button>
            </div>
            {error && <p className="mt-3 text-left text-xs text-red-400 pl-5">{error}</p>}
            <div className="mt-8 flex justify-center">
              <button onClick={handleDemo} className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-10 py-4 text-sm font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/10 hover:text-white">
                Try it out
                <svg className="h-4 w-4 opacity-40 transition-transform group-hover:translate-y-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
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
              {isDemo ? "Viewing the guaranteed system demo. No API connection required." : "Interact with your city. Zoom into individual modules, trace dependency lines, and understand the pulse of your development lifecycle."}
            </p>
          </div>

          <div className="relative aspect-video w-full rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
            {isDemo ? (
              <div ref={containerRef} className="absolute inset-0 h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-20">
                <button
                  onClick={handleDemo}
                  className="rounded-full bg-white px-10 py-4 text-sm font-semibold text-black hover:scale-105 transition-all"
                >
                  Launch 3D Explorer
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
