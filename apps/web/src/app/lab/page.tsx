'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LabContent() {
    const containerRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const repoId = searchParams.get('repoId');
    const jobId = searchParams.get('jobId');

    // --- REAL API DATA ---
    const [apiComponents, setApiComponents] = useState<any[]>([]);
    const [jobStatus, setJobStatus] = useState<string>('pending');
    const [jobProgress, setJobProgress] = useState<number>(0);
    const [repoName, setRepoName] = useState<string>('');
    const [selectedComponent, setSelectedComponent] = useState<any>(null);
    const onBuildingClickRef = useRef<((data: any) => void) | null>(null);

    // Keep refs so Three.js closure can read latest state without re-running useEffect
    const apiComponentsRef = useRef<any[]>([]);
    const jobStatusRef = useRef<string>('pending');

    // Polling and Fetching
    useEffect(() => {
        if (!repoId) return;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        let pollTimer: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/repos/${repoId}`);
                if (!res.ok) throw new Error('Failed to fetch repo');
                const data = await res.json();

                setRepoName(data.repo.name);

                const latestJob = data.analysisJobs?.find((j: any) => String(j.id) === String(jobId)) || data.analysisJobs?.[0];
                if (latestJob) {
                    setJobStatus(latestJob.status);
                    setJobProgress(latestJob.progress || 0);
                    jobStatusRef.current = latestJob.status;
                }

                if (data.components) {
                    setApiComponents(data.components);
                    apiComponentsRef.current = data.components;
                }

                // Continue polling if not finished
                if (jobStatusRef.current === 'pending' || jobStatusRef.current === 'running') {
                    pollTimer = setTimeout(fetchData, 3000);
                }
            } catch (err) {
                console.warn('[Lab] Data fetch failed:', err);
                pollTimer = setTimeout(fetchData, 5000);
            }
        };

        fetchData();
        return () => clearTimeout(pollTimer);
    }, [repoId, jobId]);

    // Bridge: set the callback so Three.js onClick can update React state
    useEffect(() => {
        onBuildingClickRef.current = (data: any) => {
            setSelectedComponent(data);
        };
    }, []);

    const closeModal = useCallback(() => setSelectedComponent(null), []);

    useEffect(() => {
        if (typeof window === 'undefined' || !containerRef.current) return;

        let cleanup = () => { };

        const loadGraphics = async () => {
            // Helper to load scripts since dynamic import(url) is failing in Turbopack
            const loadScript = (src: string, isModule = false) => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    if (isModule) script.type = 'module';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            };

            // Inject importmap so browser can resolve bare 'three' specifiers in CDN-loaded examples
            const im = document.createElement('script');
            im.type = 'importmap';
            im.textContent = JSON.stringify({
                imports: {
                    "three": "https://unpkg.com/three@0.161.0/build/three.module.js"
                }
            });
            document.head.appendChild(im);

            // Since we need Three.js and modules, we'll use a hack to get THREE globally
            // or just import them as modules but through a script tag that doesn't get processed by Turbopack
            // Actually, let's use the native browser dynamic import via eval to bypass Turbopack
            const THREE = await eval(`import('https://unpkg.com/three@0.161.0/build/three.module.js')`);
            const { OrbitControls } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/controls/OrbitControls.js')`);
            const { EffectComposer } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js')`);
            const { RenderPass } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/RenderPass.js')`);
            const { UnrealBloomPass } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/UnrealBloomPass.js')`);
            const { ShaderPass } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/postprocessing/ShaderPass.js')`);
            const { GammaCorrectionShader } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/shaders/GammaCorrectionShader.js')`);
            const { RoundedBoxGeometry } = await eval(`import('https://unpkg.com/three@0.161.0/examples/jsm/geometries/RoundedBoxGeometry.js')`);

            const THEME = {
                bg: 0x070a0f,
                terrain: 0x0a0c0e,
                grid: 0x374151,
                line1: 0x2ef2c8,
                line2: 0x86a8ff,
                asset: 0xd9dde3,
                cable: 0x2ef2c8,
                accent: 0x2ef2c8,
                outlines: 0xffffff,
                tints: {
                    language: 0xe5e7eb,
                    database: 0x86a8ff,
                    framework: 0x2ef2c8,
                    library: 0xd1d5db,
                    ui_component: 0xf472b6,
                    state_management: 0x60a5fa,
                    validation: 0x34d399,
                    animation: 0xfcd34d,
                    tooling: 0xfacc15,
                    infra: 0xa855f7,
                    testing: 0x10b981,
                    ci_cd: 0x3b82f6,
                    cache: 0xf97316,
                    other: 0xd9dde3,
                    default: 0xd9dde3
                }
            };

            // --- ENGINE VARS ---
            let scene, camera, renderer, composer, controls, raycaster, mouse;
            let hoveredGroup = null;
            let cablesGroup, buildingsGroup;

            const pickables: any[] = [];
            const animatables: any[] = [];
            const districtGroups: any = {};

            const init = () => {
                scene = new THREE.Scene();
                scene.background = new THREE.Color(THEME.bg);

                camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 5000);
                camera.position.set(600, 400, 600);
                camera.lookAt(0, 0, 0);

                renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", alpha: false });
                renderer.setClearColor(THEME.bg, 1);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = false;
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.0;
                renderer.outputColorSpace = THREE.SRGBColorSpace;
                containerRef.current.appendChild(renderer.domElement);

                composer = new EffectComposer(renderer);
                composer.addPass(new RenderPass(scene, camera));

                const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.45, 0.35);
                composer.addPass(bloomPass);
                composer.addPass(new ShaderPass(GammaCorrectionShader));

                controls = new OrbitControls(camera, renderer.domElement);
                controls.enableRotate = true;
                controls.enableDamping = true;
                controls.minPolarAngle = Math.PI / 4;
                controls.maxPolarAngle = Math.PI / 2.5;
                controls.rotateSpeed = 0.5;

                scene.add(new THREE.AmbientLight(0xffffff, 0.15));
                scene.add(new THREE.HemisphereLight(0xffffff, 0x000000, 0.25));

                const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
                keyLight.position.set(400, 800, 300);
                scene.add(keyLight);

                createProceduralTerrain();
                cablesGroup = new THREE.Group();
                scene.add(cablesGroup);

                buildingsGroup = new THREE.Group();
                scene.add(buildingsGroup);

                raycaster = new THREE.Raycaster();
                mouse = new THREE.Vector2();

                syncInfrastructure();
                fitCameraToSceneBounds();

                let isMouseDown = false;
                let mouseDownPos = { x: 0, y: 0 };

                window.addEventListener('resize', onWindowResize);
                window.addEventListener('pointermove', onPointerMove);
                window.addEventListener('mousedown', (e) => {
                    isMouseDown = true;
                    mouseDownPos = { x: e.clientX, y: e.clientY };
                });
                window.addEventListener('mouseup', (e) => {
                    if (isMouseDown) {
                        const dx = Math.abs(e.clientX - mouseDownPos.x);
                        const dy = Math.abs(e.clientY - mouseDownPos.y);
                        if (dx < 4 && dy < 4) {
                            onClick();
                        }
                    }
                    isMouseDown = false;
                });
            };

            const pseudoNoise = (x, z) => {
                let y = Math.sin(x * 0.012) * Math.cos(z * 0.015) * 45;
                y += Math.sin(x * 0.025 + z * 0.01) * 20;
                y += Math.cos(x * 0.06) * Math.sin(z * 0.05) * 8;
                return y;
            };

            const createProceduralTerrain = () => {
                const size = 2000, segments = 80;
                const geo = new THREE.PlaneGeometry(size, size, segments, segments);
                const pos = geo.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const x = pos.getX(i);
                    const z = pos.getZ(i);
                    pos.setY(i, pseudoNoise(x, z));
                }
                geo.computeVertexNormals();
                const mat = new THREE.MeshBasicMaterial({ color: THEME.terrain, transparent: true, opacity: 0.95 });
                const terrain = new THREE.Mesh(geo, mat);
                terrain.rotation.x = -Math.PI / 2;
                terrain.position.y = -50;
                scene.add(terrain);

                const wireMat = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.18
                });
                // const whiteGrid = new THREE.Mesh(geo, wireMat);
                // whiteGrid.rotation.x = -Math.PI / 2;
                // whiteGrid.position.y = -49.8;
                // scene.add(whiteGrid);
            };

            const getTerrainY = (x, z) => pseudoNoise(x, z) - 50;

            const createAssetMaterial = (param: any = 'default') => {
                const color = typeof param === 'string'
                    ? (THEME.tints[param] || THEME.tints.default)
                    : (param.color || THEME.tints.default);
                return new THREE.MeshStandardMaterial({ color: color, roughness: 0.9, metalness: 0.0, transparent: true, opacity: 1.0 });
            };

            const addTechnicalOutlines = (mesh, group) => {
                const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: THEME.outlines, transparent: true, opacity: 0.08 }));
                line.position.copy(mesh.position);
                line.rotation.copy(mesh.rotation);
                line.scale.copy(mesh.scale);
                group.add(line);
            };

            const finalizeAsset = (group, name, category, info, distId, apiData?: any) => {
                group.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (child.userData.outlined !== false) addTechnicalOutlines(child, group);
                    }
                });
                // Attach real API data if available, fallback to mock info
                group.userData = { name, category, info, distId, ...(apiData || {}) };
                pickables.push(group);
                return group;
            };

            const createLanguageTower = (name, pct, distId, apiData?: any) => {
                const group = new THREE.Group();
                const h = pct * 2.2, w = 18;
                const bodyGeo = new RoundedBoxGeometry(w, h, w, 2, 2);
                const body = new THREE.Mesh(bodyGeo.translate(0, h / 2, 0), createAssetMaterial('language'));
                group.add(body);
                const capGeo = new RoundedBoxGeometry(w + 4, 4, w + 4, 2, 2);
                const cap = new THREE.Mesh(capGeo.translate(0, h + 2, 0), createAssetMaterial('language'));
                group.add(cap);
                return finalizeAsset(group, name, "Language", `${pct}% Complexity`, distId, apiData);
            };

            const createPowerPlant = (name, distId, apiData?: any) => {
                const group = new THREE.Group();
                const base = new THREE.Mesh(new RoundedBoxGeometry(36, 18, 36, 2, 2).translate(0, 9, 0), createAssetMaterial());
                group.add(base);
                for (let i = -1; i <= 1; i += 2) {
                    const stack = new THREE.Mesh(new THREE.CylinderGeometry(7, 10, 32, 24).translate(i * 10, 25, 0), createAssetMaterial());
                    group.add(stack);
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(8.5, 1, 8, 32), createAssetMaterial());
                    ring.rotation.x = Math.PI / 2;
                    ring.position.set(i * 10, 24, 0);
                    group.add(ring);
                }
                return finalizeAsset(group, name, "Engine", "Processor Core", distId, apiData);
            };

            const createSilo = (name, distId, apiData?: any) => {
                const group = new THREE.Group();
                const body = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 55, 32).translate(0, 27.5, 0), createAssetMaterial('database'));
                group.add(body);
                [15, 40].forEach(y => {
                    const ring = new THREE.Mesh(new THREE.TorusGeometry(20.5, 1.2, 8, 32), createAssetMaterial('database'));
                    ring.rotation.x = Math.PI / 2;
                    ring.position.y = y;
                    group.add(ring);
                });
                const cap = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 55, 0), createAssetMaterial('database'));
                group.add(cap);
                return finalizeAsset(group, name, "Storage", "Data Bulk", distId, apiData);
            };

            const createSolarField = (name, distId, apiData?: any) => {
                const group = new THREE.Group();
                for (let i = 0; i < 9; i++) {
                    const panelGroup = new THREE.Group();
                    const pw = 16, ph = 20;
                    const panel = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), createAssetMaterial());
                    panel.rotation.x = -Math.PI / 2;
                    panelGroup.add(panel);
                    const frame = new THREE.Mesh(new THREE.BoxGeometry(pw + 1.5, 1, ph + 1.5).translate(0, -0.5, 0), createAssetMaterial({ color: 0xcccccc }));
                    frame.userData.outlined = false;
                    panelGroup.add(frame);
                    panelGroup.rotation.x = -Math.PI / 8;
                    panelGroup.position.set((i % 3) * 22 - 22, 6, Math.floor(i / 3) * 26 - 26);
                    group.add(panelGroup);
                }
                return finalizeAsset(group, name, "Frontend", "UI Cell", distId, apiData);
            };

            const createTransmissionTower = (name, distId, apiData?: any) => {
                const group = new THREE.Group();
                const pole = new THREE.Mesh(new THREE.CylinderGeometry(2, 9, 85, 4).translate(0, 42.5, 0), createAssetMaterial('infra'));
                group.add(pole);
                for (let h = 35; h <= 75; h += 20) {
                    const arm = new THREE.Mesh(new THREE.BoxGeometry(48, 4, 3).translate(0, h, 0), createAssetMaterial('infra'));
                    group.add(arm);
                }
                return finalizeAsset(group, name, "DevOps", "Feed Pipeline", distId, apiData);
            };

            const createTurbine = (name, distId, apiData?: any) => {
                const group = new THREE.Group();
                const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 7, 100, 24).translate(0, 50, 0), createAssetMaterial());
                group.add(tower);
                const nacelle = new THREE.Mesh(new RoundedBoxGeometry(10, 10, 16, 2, 2).translate(0, 100, 4), createAssetMaterial());
                group.add(nacelle);
                const blades = new THREE.Group();
                blades.position.set(0, 100, 12);
                group.add(blades);
                for (let i = 0; i < 3; i++) {
                    const blade = new THREE.Mesh(new THREE.BoxGeometry(4, 45, 1).translate(0, 22.5, 0), createAssetMaterial());
                    blade.rotation.z = (i * Math.PI * 2) / 3;
                    blades.add(blade);
                }
                animatables.push(() => { blades.rotation.z += 0.04; });
                return finalizeAsset(group, name, "Tooling", "Gateway", distId, apiData);
            };

            const syncInfrastructure = () => {
                const comps = apiComponentsRef.current;

                // Group by type
                const groups: any = {};
                comps.forEach(c => {
                    const t = c.type || 'other';
                    if (!groups[t]) groups[t] = [];
                    groups[t].push(c);
                });

                const types = Object.keys(groups);
                if (types.length === 0) {
                    // Periodic check for new components if still scanning
                    if (jobStatusRef.current === 'pending' || jobStatusRef.current === 'running') {
                        setTimeout(syncInfrastructure, 4000);
                    }
                    return;
                }

                buildingsGroup.clear();
                pickables.length = 0;
                districtGroups.length = 0; // Reset district mapping
                Object.keys(districtGroups).forEach(k => delete districtGroups[k]);

                const gridSpacing = 280;
                const typeToFact: any = {
                    language: createLanguageTower,
                    framework: createPowerPlant,
                    database: createSilo,
                    library: createPowerPlant,
                    ui_component: createSolarField,
                    state_management: createPowerPlant,
                    validation: createSilo,
                    animation: createTurbine,
                    cache: createSilo,
                    ci_cd: createTransmissionTower,
                    infra: createTransmissionTower,
                    tooling: createTurbine,
                    testing: createTurbine,
                    other: createTurbine
                };

                types.forEach((type, idx) => {
                    const ox = (idx % 3) * gridSpacing - gridSpacing;
                    const oz = Math.floor(idx / 3) * gridSpacing - gridSpacing / 2;

                    const distGroup = new THREE.Group();
                    distGroup.position.set(ox, 0, oz);
                    districtGroups[type] = distGroup;
                    buildingsGroup.add(distGroup);

                    groups[type].forEach((item, i) => {
                        const factory = typeToFact[type] || createTurbine;
                        const asset = factory(item.name, 70, type, {
                            description: item.description,
                            version: item.version,
                            confidence: item.confidence
                        });

                        const ax = (i % 2) * 90 - 45 + ox;
                        const az = Math.floor(i / 2) * 90 - 45 + oz;
                        const ay = getTerrainY(ax, az);
                        asset.position.set(ax, ay, az);
                        buildingsGroup.add(asset);
                    });
                });

                createInfrastructureCables();

                // Periodic check for new components if still scanning
                if (jobStatusRef.current === 'pending' || jobStatusRef.current === 'running') {
                    setTimeout(syncInfrastructure, 5000);
                }
            };

            const createInfrastructureCables = () => {
                const types = Object.keys(districtGroups);
                if (types.length < 2) return;

                cablesGroup.clear();

                // Simple chain connection for now
                for (let i = 0; i < types.length - 1; i++) {
                    const from = types[i];
                    const to = types[i + 1];

                    const startGroup = districtGroups[from];
                    const endGroup = districtGroups[to];
                    if (!startGroup || !endGroup) continue;

                    const startPos = startGroup.position.clone();
                    const endPos = endGroup.position.clone();
                    const points: any[] = [];
                    const segments = 24;
                    for (let j = 0; j <= segments; j++) {
                        const t = j / segments;
                        const x = startPos.x + (endPos.x - startPos.x) * t;
                        const z = startPos.z + (endPos.z - startPos.z) * t;
                        const y = getTerrainY(x, z) + 1.2;
                        points.push(new THREE.Vector3(x, y, z));
                    }

                    const bundleGroup = new THREE.Group();
                    bundleGroup.userData = { from, to };

                    const geo = new THREE.BufferGeometry().setFromPoints(points);
                    const mat = new THREE.LineBasicMaterial({ color: THEME.cable, transparent: true, opacity: 0.1 });
                    const line = new THREE.Line(geo, mat);
                    bundleGroup.add(line);

                    const packet = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0 }));
                    bundleGroup.add(packet);

                    const speed = 0.8 + Math.random() * 0.4;
                    animatables.push(() => {
                        const t = (Date.now() * 0.001 * speed) % 3;
                        const progress = t / 3;
                        const idx = Math.floor(progress * segments);
                        if (idx < points.length) {
                            packet.position.copy(points[idx]);
                            packet.position.y += 2;
                            packet.material.opacity = progress < 0.1 ? progress * 10 : (progress > 0.9 ? (1 - progress) * 10 : 0.6);
                            packet.scale.setScalar(0.8 + Math.sin(Date.now() * 0.01) * 0.2);
                        }
                    });

                    cablesGroup.add(bundleGroup);
                }
            };

            const fitCameraToSceneBounds = () => {
                camera.position.set(650, 650, 650);
                camera.lookAt(0, 0, 0);
                if (controls) controls.target.set(0, 0, 0);
            };

            const onPointerMove = (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                const tt = document.getElementById('tooltip');
                if (tt) {
                    tt.style.left = (event.clientX + 20) + 'px';
                    tt.style.top = (event.clientY + 20) + 'px';
                }
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(pickables, true);
                if (hits.length > 0) {
                    let g = hits[0].object; while (g.parent && !g.userData.name) g = g.parent;
                    if (hoveredGroup !== g) {
                        if (hoveredGroup) highlight(hoveredGroup, false);
                        hoveredGroup = g; highlight(hoveredGroup, true);
                    }
                    if (tt) {
                        tt.style.display = 'block';
                        tt.innerHTML = `${g.userData.name} • ${g.userData.category}`;
                    }
                    document.body.style.cursor = 'pointer';
                } else {
                    if (hoveredGroup) { highlight(hoveredGroup, false); hoveredGroup = null; }
                    if (tt) tt.style.display = 'none';
                    document.body.style.cursor = 'default';
                }
            };

            const highlight = (g, active) => {
                const distId = g.userData.distId;
                g.traverse(c => {
                    if (c.isMesh && c.material.emissive) {
                        c.material.emissive.setHex(active ? 0x00d2ff : 0x000000);
                        c.material.emissiveIntensity = active ? 0.35 : 0;
                    }
                });
                g.scale.setScalar(active ? 1.04 : 1.0);
                cablesGroup.children.forEach(bundle => {
                    const con = bundle.userData.from === distId || bundle.userData.to === distId;
                    bundle.children.forEach(line => {
                        if (line instanceof THREE.Line) {
                            line.material.color.setHex(active && con ? THEME.accent : THEME.cable);
                            line.material.opacity = active ? (con ? 0.8 : 0.05) : 0.3;
                        }
                    });
                });
            };

            const onClick = () => {
                raycaster.setFromCamera(mouse, camera);
                const hits = raycaster.intersectObjects(pickables, true);
                if (hits.length > 0) {
                    let g = hits[0].object; while (g.parent && !g.userData.name) g = g.parent;
                    focus(g);
                    // Signal to React with the component data
                    if (onBuildingClickRef.current) {
                        onBuildingClickRef.current(g.userData);
                    }
                } else {
                    focus(null);
                    if (onBuildingClickRef.current) {
                        onBuildingClickRef.current(null);
                    }
                }
            };

            const focus = (g) => {
                pickables.forEach(pg => {
                    const isF = !g || pg === g;
                    pg.traverse(c => { if (c.isMesh) c.material.opacity = isF ? 1.0 : 0.2; });
                });
            };

            const onWindowResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                composer.setSize(window.innerWidth, window.innerHeight);
            };

            const animate = () => {
                const frameId = requestAnimationFrame(animate);
                controls.update();
                const time = Date.now() * 0.001;
                camera.position.x += Math.sin(time * 0.2) * 0.1;
                camera.position.z += Math.cos(time * 0.15) * 0.1;
                animatables.forEach(f => f());
                composer.render();
                cleanup = () => {
                    cancelAnimationFrame(frameId);
                    window.removeEventListener('resize', onWindowResize);
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('click', onClick);
                    if (containerRef.current) containerRef.current.innerHTML = '';
                    renderer.dispose();
                    scene.clear();
                };
            };

            init();
            animate();

            // UI Initialization
            const intervalClock = setInterval(() => {
                const clockEl = document.getElementById('clock');
                if (clockEl) clockEl.innerText = new Date().toLocaleTimeString([], { hour12: false });
            }, 1000);

            const loadContainer = document.getElementById('load-bars');
            if (loadContainer) {
                for (let i = 0; i < 20; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'bar';
                    loadContainer.appendChild(bar);
                }
            }
            const intervalBars = setInterval(() => {
                if (loadContainer) {
                    const bars = loadContainer.children;
                    const activeCount = Math.floor(Math.random() * 15) + 5;
                    for (let i = 0; i < bars.length; i++) {
                        bars[i].classList.toggle('active', i < activeCount);
                    }
                }
            }, 500);

            const prevCleanup = cleanup;
            cleanup = () => {
                prevCleanup();
                clearInterval(intervalClock);
                clearInterval(intervalBars);
            };
        };

        loadGraphics();
        return () => cleanup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#070a0f] font-sans text-[#e5e7eb]">
            <style jsx>{`
        :root {
          --accent: #2ef2c8;
          --secondary: #86a8ff;
          --bg-ui: rgba(10, 12, 14, 0.55);
          --border-ui: rgba(255, 255, 255, 0.08);
          --text-main: #e5e7eb;
          --text-muted: #9ca3af;
        }

        /* --- TACTICAL UI OVERLAY --- */
        #ui-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 32px;
          box-sizing: border-box;
        }

        .hud-card {
          background: rgba(10, 12, 14, 0.55);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          pointer-events: auto;
        }

        /* Top Left: Scope */
        .scope-block {
          align-self: flex-start;
          min-width: 220px;
        }
        .scope-item {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          color: #9ca3af;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 4px;
        }
        .scope-item span:last-child { color: #2ef2c8; }

        /* Right Stats */
        .stats-card {
          position: absolute;
          top: 32px;
          right: 32px;
          width: 240px;
        }
        .stats-header { font-size: 10px; color: #9ca3af; margin-bottom: 12px; }
        .stats-main { display: flex; align-items: center; justify-content: space-between; }
        .stats-number { font-size: 32px; font-weight: 800; }
        .stats-sub { font-size: 11px; color: #2ef2c8; }
        .stats-ring { width: 40px; height: 40px; }

        /* Bottom Strip */
        .bottom-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .analytics-block { flex: 1; display: flex; align-items: center; gap: 32px; }
        .metric-group { display: flex; flex-direction: column; gap: 4px; }
        .metric-label { font-size: 9px; color: #9ca3af; }
        .metric-bars { display: flex; gap: 2px; height: 12px; align-items: flex-end; }
        :global(.bar) { width: 3px; background: #2ef2c8; opacity: 0.3; height: 100%; transition: opacity 0.2s; }
        :global(.bar.active) { opacity: 0.8; }

        .status-pill {
          padding: 4px 12px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 20px;
          font-size: 10px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; animation: blink 1s infinite; }

        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        #tooltip {
          position: absolute;
          background: rgba(10, 10, 10, 0.95);
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          pointer-events: none;
          display: none;
          z-index: 2000;
          border: 1px solid rgba(255, 255, 255, 0.08) ;
          backdrop-filter: blur(4px);
        }

        .global-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
          background-size: 40px 40px, 120px 120px, 120px 120px;
          pointer-events: none;
          z-index: 500;
        }
        /* Inspector Panel (Right Sidebar) */
        #inspector-panel {
          position: fixed;
          top: 32px;
          right: 32px;
          bottom: 120px;
          width: 320px;
          background: rgba(10, 12, 16, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(46, 242, 200, 0.2);
          border-radius: 24px;
          padding: 28px;
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2000;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .modal-close {
          align-self: flex-end;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 14px;
          transition: all 0.15s;
          margin-bottom: -10px;
        }
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 16px;
          transition: all 0.15s;
        }
        .modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .modal-type-badge {
          display: inline-block;
          padding: 2px 10px;
          background: rgba(46, 242, 200, 0.12);
          border: 1px solid rgba(46, 242, 200, 0.3);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #2ef2c8;
          margin-bottom: 12px;
        }
        .modal-name {
          font-size: 22px;
          font-weight: 700;
          color: #e5e7eb;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }
        .modal-version {
          font-size: 12px;
          color: #9ca3af;
          margin-bottom: 16px;
        }
        .modal-desc {
          font-size: 14px;
          line-height: 1.7;
          color: #d1d5db;
          border-top: 1px solid rgba(255,255,255,0.06);
          padding-top: 16px;
        }
        .modal-confidence {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-conf-bar-bg {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
        }
        .modal-conf-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2ef2c8, #86a8ff);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .modal-conf-label {
          font-size: 10px;
          color: #9ca3af;
          min-width: 36px;
          text-align: right;
        }
      `}</style>

            <div className="global-grid"></div>
            <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />

            <div id="ui-overlay">
                <div className="hud-card scope-block">
                    <div className="scope-item"><span>REGION</span> <span>PX-992</span></div>
                    <div className="scope-item"><span>TIME</span> <span id="clock">--:--:--</span></div>
                    <div className="scope-item"><span>CONNECTIONS</span> <span className={jobStatus === 'failed' ? 'text-red-500' : 'text-emerald-400'}>{jobStatus.toUpperCase()}</span></div>
                    <div className="scope-item"><span>SURFACE</span> <span className="uppercase">{repoName || 'SCANNING...'}</span></div>
                </div>

                <div className="hud-card stats-card">
                    <div className="stats-header">ANALYSIS PROGRESS</div>
                    <div className="stats-main">
                        <div>
                            <div className="stats-number">{Math.round(jobProgress)}%</div>
                            <div className="stats-sub">{jobStatus.toUpperCase()}</div>
                        </div>
                        <svg className="stats-ring" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2ef2c833" strokeWidth="2" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2ef2c8" strokeWidth="2" strokeDasharray={`${jobProgress}, 100`} />
                        </svg>
                    </div>
                </div>

                <div className="hud-card bottom-strip">
                    <div className="analytics-block">
                        <div className="metric-group">
                            <div className="metric-label">SYSTEM_LOAD</div>
                            <div className="metric-bars" id="load-bars"></div>
                        </div>
                        <div className="metric-group">
                            <div className="metric-label">COMPONENTS</div>
                            <div className="stats-sub">{apiComponents.length} DETECTED</div>
                        </div>
                        <div className="metric-group">
                            <div className="metric-label">THREAT LEVEL</div>
                            <div style={{ fontSize: '11px', color: '#ef4444' }}>0 NONE</div>
                        </div>
                    </div>
                    <div className="status-pill" style={{ borderColor: jobStatus === 'failed' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(46, 242, 200, 0.3)', color: jobStatus === 'failed' ? '#fca5a5' : '#2ef2c8', background: jobStatus === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(46, 242, 200, 0.1)' }}>
                        <div className="status-dot" style={{ backgroundColor: jobStatus === 'failed' ? '#ef4444' : '#2ef2c8' }}></div>
                        {jobStatus === 'done' || jobStatus === 'succeeded' ? 'ANALYSIS COMPLETE' : `ANALYZING ${repoName || 'REPOSITORY'}...`}
                    </div>
                </div>
            </div>

            <div id="tooltip"></div>

            {/* Inspector Panel */}
            {selectedComponent && (
                <div id="inspector-panel">
                    <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
                    <div className="mt-2">
                        <div className="modal-type-badge">{selectedComponent.category || selectedComponent.type || 'Component'}</div>
                        <div className="modal-name">{selectedComponent.name}</div>
                        {selectedComponent.version && (
                            <div className="modal-version">v{selectedComponent.version}</div>
                        )}
                        <div className="modal-desc">
                            {selectedComponent.description || <em style={{ color: '#6b7280' }}>No description available.</em>}
                        </div>
                        {typeof selectedComponent.confidence === 'number' && (
                            <div className="modal-confidence">
                                <span className="modal-conf-label" style={{ fontSize: '9px', color: '#9ca3af', minWidth: 'unset' }}>CONFIDENCE</span>
                                <div className="modal-conf-bar-bg">
                                    <div
                                        className="modal-conf-bar-fill"
                                        style={{ width: `${Math.round(selectedComponent.confidence * 100)}%` }}
                                    />
                                </div>
                                <span className="modal-conf-label">{Math.round(selectedComponent.confidence * 100)}%</span>
                            </div>
                        )}
                        <div className="mt-8 border-t border-white/5 pt-6">
                            <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Properties</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40">Status</span>
                                    <span className="text-emerald-400 font-medium">Valid</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-white/40">Tier</span>
                                    <span className="text-white/80">Core Component</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LabPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-[#070a0f] text-[#2ef2c8]">
                <div className="text-sm font-bold tracking-widest">INITIALIZING INTERFACE...</div>
            </div>
        }>
            <LabContent />
        </Suspense>
    );
}
