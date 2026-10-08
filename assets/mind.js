// "Fly through Paloan's mind" — scrolling flies a 3D camera through the layers of an AI agent
// processing a request: input tokens → attention → tools → reasoning rings → chain of thought → memory → output.
// When a visitor asks Paloan a question, their own words become tokens that fly into the mind.
// Three.js loads only after the page is idle; rendering pauses when hidden or covered.
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  const LAYERS = [
    { id: 'opening',   name: 'INPUT · tokens' },
    { id: 'manifesto', name: 'ATTENTION' },
    { id: 'services',  name: 'TOOLS' },
    { id: 'approach',  name: 'CHAIN OF THOUGHT' },
    { id: 'projects',  name: 'MEMORY' },
    { id: 'contact',   name: 'OUTPUT' },
  ];
  const GAP = 70, Z = LAYERS.map((_, i) => -i * GAP), CAM_BACK = 36;
  const TOOLS = ['memory', 'search', 'bangla.nlp', 'intent', 'plan', 'draft', 'design', 'automate', 'web.build', 'analytics', 'schedule', 'publish', 'crm', 'vision'];
  const STEPS = {
    opening: ['tokenize("Rapar Rubel")', 'embed(tokens) → 3D', 'agent.ready()'],
    manifesto: ['attention.heads(16)', 'pattern.find("need → system")'],
    services: ['tools.load(14)', 'plan → automate → ship'],
    approach: ['listen → decode → frame', 'create → test → keep winner'],
    projects: ['memory.search(9 projects)', 'recall(context)'],
    contact: ['compose(reply)', 'output → you'],
  };

  const start = async () => {
    let THREE;
    try { THREE = await import(THREE_URL); } catch (e) { return; }
    const small = Math.min(innerWidth, innerHeight) < 700;

    const canvas = document.createElement('canvas');
    canvas.id = 'fx'; canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' }); } catch (e) { canvas.remove(); return; }
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 420);
    scene.fog = new THREE.FogExp2(0x0d1b1e, 0.016);

    // ---------- palette (follows dark / light mode) ----------
    const C = { a: new THREE.Color(), b: new THREE.Color(), t: new THREE.Color(), light: false };
    const mats = []; // materials whose blending/colour follow the theme
    const applyTheme = () => {
      C.light = root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
      C.a.set(C.light ? 0x9a5a00 : 0xf0a830); C.b.set(C.light ? 0x5b46c8 : 0x9c8cff); C.t.set(C.light ? 0x15211f : 0xede6d8);
      scene.fog.color.set(C.light ? 0xf6f1e7 : 0x0d1b1e);
      mats.forEach(m => { m.blending = C.light ? THREE.NormalBlending : THREE.AdditiveBlending; m.needsUpdate = true; if (m.userData.col) m.color && m.color.copy(C[m.userData.col]); if (m.uniforms && m.uniforms.uCol) m.uniforms.uCol.value.copy(C[m.userData.col || 'a']); });
      labels.forEach(l => l.redraw());
    };
    const track = (m, col) => { m.userData.col = col; mats.push(m); return m; };

    // ---------- shared sprites ----------
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const labels = [];
    const label = (text, opts = {}) => { // crisp text sprite drawn on a canvas
      const c = document.createElement('canvas'), g = c.getContext('2d'), size = opts.size || 44;
      const font = `${opts.weight || 600} ${size}px ${opts.family || '"JetBrains Mono", ui-monospace, monospace'}`;
      g.font = font; const w = Math.ceil(g.measureText(text).width) + size; c.width = w; c.height = Math.ceil(size * 1.7);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: true, opacity: opts.opacity ?? 1 });
      const s = new THREE.Sprite(mat), k = (opts.world || 1) / c.height;
      s.scale.set(c.width * k, c.height * k, 1);
      const L = { sprite: s, mat, redraw: () => { g.clearRect(0, 0, c.width, c.height); g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center';
        if (opts.box) { g.fillStyle = C.light ? 'rgba(246,241,231,.85)' : 'rgba(13,27,30,.6)'; g.strokeStyle = '#' + C[opts.col || 'a'].getHexString(); g.lineWidth = 3;
          const r = c.height / 2 - 4; g.beginPath(); g.roundRect(3, 3, c.width - 6, c.height - 6, r); g.fill(); g.stroke(); }
        g.fillStyle = '#' + C[opts.col || 't'].getHexString(); g.fillText(text, c.width / 2, c.height / 2 + 2); tex.needsUpdate = true; } };
      labels.push(L); return L;
    };
    const glow = (col, size) => { const m = track(new THREE.SpriteMaterial({ map: glowTex, color: C[col], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), col);
      const s = new THREE.Sprite(m); s.scale.setScalar(size); return s; };
    const points = (pos, col, size, opacity) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = track(new THREE.PointsMaterial({ color: C[col], size, map: glowTex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }), col);
      return new THREE.Points(g, m); };
    const lines = (pos, col, opacity) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = track(new THREE.LineBasicMaterial({ color: C[col], transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }), col);
      return new THREE.LineSegments(g, m); };
    const rnd = (() => { let s = 21; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
    const layers = LAYERS.map((L, i) => { const g = new THREE.Group(); g.position.z = Z[i]; scene.add(g);
      const t = label(String(i + 1).padStart(2, '0') + ' · ' + L.name, { size: 40, world: 1.5, col: 'a', weight: 500 }); t.sprite.position.set(4, 11.5, 0); g.add(t.sprite); return g; });
    const animators = []; // per-frame updaters

    // ---------- L1 INPUT: name tokens in a vortex of embedding points ----------
    {
      const g = layers[0];
      const toks = ['Rap', 'ar', ' Rub', 'el', ' ·', ' AI', ' expert', ' &', ' AI', ' work', 'flow', ' build', 'er', ' ·', ' Bang', 'la', 'desh'];
      const sp = toks.map((t, i) => { const l = label(t.replace(' ', '␣'), { size: 46, world: 1.45, col: i % 3 ? 't' : 'a', box: true }); g.add(l.sprite); return { s: l.sprite, a: i / toks.length * 6.283, r: 4.5 + (i % 4) * 1.2, y: (i % 5 - 2) * 1.3 }; });
      const n = small ? 1400 : 3200, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const r = 2.5 + Math.pow(rnd(), 0.8) * 7.5, a = rnd() * 6.283, h = gauss() * 2.2; pos.set([Math.cos(a) * r, h, Math.sin(a) * r], i * 3); }
      const cloud = points(pos, 'b', 0.28, 0.5); g.add(cloud);
      animators.push(t => { cloud.rotation.y = t * 0.06; sp.forEach((o, i) => { const a = o.a + t * 0.22; o.s.position.set(Math.cos(a) * o.r, o.y + Math.sin(t * 0.8 + i) * 0.4, Math.sin(a) * o.r); }); });
    }
    // ---------- L2 ATTENTION: ring of heads with pulsing arcs ----------
    {
      const g = layers[1], N = 16, R = 8, P = [];
      for (let i = 0; i < N; i++) { const a = i / N * 6.283; P.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R * 0.62, Math.sin(a * 2) * 1.5)); const d = glow(i % 4 ? 'b' : 'a', 1.6); d.position.copy(P[i]); g.add(d); }
      const pos = [], phase = [];
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { if (rnd() > 0.32) continue; const a = P[i], b = P[j], mid = a.clone().add(b).multiplyScalar(0.5); mid.z += 3 + rnd() * 5;
        const ph = rnd() * 6.283; let prev = a; for (let k = 1; k <= 14; k++) { const t = k / 14, q = new THREE.Vector3().copy(a).multiplyScalar((1 - t) ** 2).addScaledVector(mid, 2 * (1 - t) * t).addScaledVector(b, t * t); pos.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); phase.push(ph, ph); prev = q; } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aPh', new THREE.Float32BufferAttribute(phase, 1));
      const mat = track(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        uniforms: { uT: { value: 0 }, uCol: { value: C.a.clone() } },
        vertexShader: 'attribute float aPh; varying float vA; uniform float uT; void main(){ vA = 0.08 + 0.6 * pow(0.5 + 0.5 * sin(uT * 1.6 + aPh), 6.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol, vA); }' }), 'a');
      const arcs = new THREE.LineSegments(geo, mat); g.add(arcs);
      animators.push(t => { mat.uniforms.uT.value = t; g.rotation.z = t * 0.04; });
    }
    // ---------- L3 TOOLS: core + tools on a sphere, packets flying ----------
    const core = glow('b', 7), toolNodes = [];
    {
      const g = layers[2]; g.add(core); const coreTxt = label('PALOAN', { size: 46, world: 1.2, col: 't', weight: 700 }); g.add(coreTxt.sprite);
      const ga = Math.PI * (3 - Math.sqrt(5)), pos = [];
      TOOLS.forEach((name, i) => { const y = 1 - (i + 0.5) / TOOLS.length * 2, r = Math.sqrt(1 - y * y), th = ga * i;
        const p = new THREE.Vector3(Math.cos(th) * r * 9, y * 7, Math.sin(th) * r * 9);
        const dot = glow('a', 1.4); dot.position.copy(p); const l = label(name, { size: 40, world: 1.05, col: 't' }); l.sprite.position.copy(p).add(new THREE.Vector3(0, 1.1, 0));
        const grp = new THREE.Group(); grp.add(dot, l.sprite); g.add(grp); toolNodes.push({ name, p, dot, heat: 0 }); pos.push(0, 0, 0, p.x, p.y, p.z); });
      g.add(lines(pos, 't', 0.14));
      animators.push(t => { g.rotation.y = t * 0.08; toolNodes.forEach(n => { n.heat = Math.max(0, n.heat - 0.015); n.dot.scale.setScalar(1.4 + n.heat * 3); }); core.scale.setScalar(7 + Math.sin(t * 1.7) * 0.5); });
    }
    // packets travelling core → tool → core
    const packets = [];
    const packet = (to, col, back) => { const s = glow(col, 1.1); layers[2].add(s); packets.push({ s, to, t: 0, back }); };
    // ---------- reasoning rings between TOOLS and CHAIN OF THOUGHT (you fly through them) ----------
    {
      ['Listen', 'Decode', 'Frame', 'Create', 'Test'].forEach((w, i) => {
        const z = Z[2] - 16 - i * 9.5, ring = new THREE.Mesh(new THREE.TorusGeometry(5.2 + i * 0.25, 0.05, 6, 96),
          track(new THREE.MeshBasicMaterial({ color: C.a, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }), i % 2 ? 'b' : 'a'));
        ring.position.z = z; scene.add(ring);
        const l = label(String(i + 1).padStart(2, '0') + ' ' + w, { size: 44, world: 1.1, col: i % 2 ? 'b' : 'a' }); l.sprite.position.set(0, 6.1 + i * 0.25, z); scene.add(l.sprite);
        animators.push(t => { ring.rotation.z = t * (0.2 + i * 0.05) * (i % 2 ? -1 : 1); });
      });
    }
    // ---------- L4 CHAIN OF THOUGHT: rotating helix of reasoning ----------
    {
      const g = layers[3], n = small ? 700 : 1600, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const t = i / n, a = t * 6.283 * 3.2 + (i % 2) * Math.PI; pos.set([Math.cos(a) * 4.5, (t - 0.5) * 16, Math.sin(a) * 4.5], i * 3); }
      const helix = points(pos, 'a', 0.32, 0.8); g.add(helix);
      const words = ['says', 'means', 'fears', 'shares', 'content']; const ls = words.map((w, i) => { const l = label(w, { size: 44, world: 1.2, col: 'b', box: true }); g.add(l.sprite); return l.sprite; });
      animators.push(t => { helix.rotation.y = t * 0.35; ls.forEach((s, i) => { const a = t * 0.35 + i * 1.25; s.position.set(Math.cos(a) * 6.8, -6 + i * 3, Math.sin(a) * 6.8); }); });
    }
    // ---------- L5 MEMORY: lattice of vectors with the 9 projects lit inside ----------
    {
      const g = layers[4], k = small ? 9 : 12, pos = [];
      for (let x = 0; x < k; x++) for (let y = 0; y < k; y++) for (let z = 0; z < k; z++) pos.push((x - k / 2) * 1.6 + gauss() * 0.1, (y - k / 2) * 1.2, (z - k / 2) * 1.6);
      const lat = points(pos, 't', 0.18, 0.5); g.add(lat);
      const projs = ['MimAI', 'Paloan', 'proyojon.shop', 'Vromon', 'Abashon', 'CAP ON HEAD', 'Myook', 'AI video', '3D City'];
      projs.forEach((p, i) => { const a = i / projs.length * 6.283, v = new THREE.Vector3(Math.cos(a) * 6.5, (i % 3 - 1) * 4, Math.sin(a) * 6.5); const d = glow('a', 1.8); d.position.copy(v);
        const l = label(p, { size: 42, world: 1.1, col: 'a', box: true }); l.sprite.position.copy(v).add(new THREE.Vector3(0, 1.3, 0)); g.add(d, l.sprite); });
      animators.push(t => { g.rotation.y = t * 0.05; g.rotation.x = Math.sin(t * 0.2) * 0.08; });
    }
    // ---------- L6 OUTPUT: answer rays streaming toward you ----------
    {
      const g = layers[5], n = small ? 500 : 1200, pos = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r0 = 0.6, r1 = 4 + rnd() * 14, h = gauss() * 0.5; pos.set([Math.cos(a) * r0, Math.sin(a) * r0 * 0.6 + h, 0, Math.cos(a) * r1, Math.sin(a) * r1 * 0.6 + h, 6 + rnd() * 10], i * 6); }
      const rays = lines(Array.from(pos), 'a', 0.16); g.add(rays); const sun = glow('a', 9); g.add(sun);
      animators.push(t => { rays.rotation.z = t * 0.05; sun.scale.setScalar(9 + Math.sin(t * 2) * 0.8); });
    }
    // ---------- data stream: particles rushing past the camera along the whole flight ----------
    {
      const n = small ? 1200 : 3000, pos = new Float32Array(n * 3), span = GAP * LAYERS.length + 80;
      for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r = 10 + rnd() * 28; pos.set([Math.cos(a) * r, Math.sin(a) * r * 0.7, 40 - rnd() * span], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const mat = track(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uCol: { value: C.t.clone() }, uSpan: { value: span }, uPx: { value: 1 } },
        vertexShader: 'uniform float uT, uSpan, uPx; varying float vA; void main(){ vec3 p = position; p.z = 40.0 - mod(40.0 - p.z - uT * 6.0, uSpan); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uPx * 60.0 / -mv.z; vA = smoothstep(160.0, 20.0, -mv.z) * smoothstep(0.5, 6.0, -mv.z); }',
        fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uCol, smoothstep(0.5, 0.0, d) * vA * 0.5); }' }), 't');
      const stream = new THREE.Points(geo, mat); scene.add(stream);
      animators.push(t => { mat.uniforms.uT.value = t; });
      mats.streamPx = mat;
    }

    // ---------- live log (desktop) ----------
    const log = document.createElement('div'); log.className = 'agent-log'; log.setAttribute('aria-hidden', 'true');
    log.innerHTML = '<div class="al-head"><i></i><span>PALOAN · live</span></div><div class="al-lines"></div>'; document.body.appendChild(log);
    const head = log.querySelector('.al-head span'), lineBox = log.querySelector('.al-lines'); let hideT;
    const wake = ms => { log.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(() => log.classList.remove('on'), ms || 3400); };
    const say = (txt, done) => { if (innerWidth < 900) return; wake(4200); const el = document.createElement('div'); el.className = 'al-line'; el.innerHTML = '<span class="al-t"></span><b>…</b>'; lineBox.appendChild(el);
      while (lineBox.children.length > 4) lineBox.firstChild.remove(); const sp = el.firstChild; let i = 0; (function ty() { sp.textContent = '› ' + txt.slice(0, i); if (i++ < txt.length) setTimeout(ty, 14); else setTimeout(() => { el.lastChild.textContent = '✓'; wake(); done && done(); }, 380); })(); };

    // ---------- the visitor's question becomes tokens flying into the mind ----------
    const flying = [];
    const tokenize = q => (q.match(/\s?[^\s]{1,4}/g) || []).slice(0, 14);
    addEventListener('paloan:ask', e => {
      const q = (e.detail && e.detail.q) || '', intent = (e.detail && e.detail.intent) || 'unknown';
      const from = camera.position.clone().add(new THREE.Vector3(7, -4, -10)), toZ = Z[curLayer];
      tokenize(q).forEach((tk, i) => { const l = label(tk.replace(' ', '␣'), { size: 44, world: 1.2, col: 'b', box: true }); l.redraw(); scene.add(l.sprite);
        l.sprite.position.copy(from); flying.push({ l, from: from.clone().add(new THREE.Vector3((i % 4) * 0.8, Math.floor(i / 4) * 0.9, 0)), to: new THREE.Vector3((rnd() - 0.5) * 6, (rnd() - 0.5) * 4, toZ), t: -i * 0.07 }); });
      head.textContent = 'PALOAN · reading your question'; say('tokenize("' + q.slice(0, 26) + (q.length > 26 ? '…' : '') + '")', () => say('intent → ' + intent, () => say('answer → chat ✦')));
      toolNodes.forEach(n => n.heat = Math.max(n.heat, rnd() * 0.6)); const tn = toolNodes[(Math.random() * toolNodes.length) | 0]; packet(tn, 'b');
    });

    // ---------- layout & scroll → camera flight ----------
    let W, H, anchors = [], covers = [];
    const measure = () => {
      W = innerWidth; H = innerHeight; const dpr = Math.min(devicePixelRatio || 1, small ? 1.25 : 1.5);
      renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); camera.aspect = W / H;
      camera.filmOffset = W >= 900 ? -13 : 0; // push the vanishing point to the right so text stays readable
      layers.forEach(g => { g.position.x = W >= 900 ? 6.5 : 0; });
      camera.fov = W / H < 1 ? 72 : 58; camera.updateProjectionMatrix();
      if (mats.streamPx) mats.streamPx.uniforms.uPx.value = dpr * (W / H < 1 ? 1.4 : 1) * (H / 900);
      canvas.style.opacity = W < 900 ? (C.light ? 0.45 : 0.6) : 1;
      const abs = el => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.height]; };
      anchors = LAYERS.map(L => { const el = document.getElementById(L.id); if (!el) return null; const [t, h] = abs(el); return t + Math.min(h, H * 2) / 2; });
      covers = ['portrait', 'reel', 'bts'].map(id => document.getElementById(id)).filter(Boolean).map(el => { const [t, h] = abs(el); return [t, t + h - H]; });
    };
    applyTheme(); measure();
    new MutationObserver(() => { applyTheme(); measure(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { applyTheme(); measure(); }); } catch (e) {}
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 150); });
    setInterval(measure, 4000);
    let mx = 0, my = 0;
    addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

    let camZ = Z[0] + CAM_BACK, curLayer = 0, shownLayer = -1, running = true, wasCovered = false, last = performance.now(), T = 0, packT = 0;
    const smooth = x => x * x * (3 - 2 * x);
    const frame = now => {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
      const y = scrollY;
      if (covers.some(([a, b]) => y > a + 4 && y < b - 4)) { if (!wasCovered) { renderer.clear(); wasCovered = true; } return; }
      wasCovered = false;
      // scroll position → which two layers we are between → camera depth
      const c = y + H / 2; let i = 0; while (i < anchors.length - 1 && anchors[i + 1] != null && c > anchors[i + 1]) i++;
      const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
      let f = b > a ? (c - a) / (b - a) : 0; f = Math.min(1, Math.max(0, f)); const fs = smooth(Math.min(1, Math.max(0, (f - 0.12) / 0.76)));
      const target = Z[i] + CAM_BACK + (Z[Math.min(i + 1, Z.length - 1)] - Z[i]) * fs;
      camZ += (target - camZ) * Math.min(1, dt * 3.2);
      curLayer = Math.round((Z[0] + CAM_BACK - camZ) / GAP); curLayer = Math.max(0, Math.min(LAYERS.length - 1, curLayer));
      if (curLayer !== shownLayer) { shownLayer = curLayer; head.textContent = 'PALOAN · layer ' + String(curLayer + 1).padStart(2, '0') + ' · ' + LAYERS[curLayer].name;
        const st = STEPS[LAYERS[curLayer].id] || []; let k = 0; const nx = () => { if (k < st.length) say(st[k++], nx); }; nx(); }
      camera.position.set(mx * 3, -my * 2, camZ);
      camera.lookAt(mx * 1.2, -my * 0.8, camZ - 40);
      animators.forEach(fn => fn(T));
      // tool packets
      packT -= dt; if (packT <= 0 && curLayer === 2) { packT = 0.35; const n = toolNodes[(Math.random() * toolNodes.length) | 0]; packet(n, Math.random() < 0.5 ? 'a' : 'b'); }
      for (let k = packets.length - 1; k >= 0; k--) { const p = packets[k]; p.t += dt * 1.4; const e = Math.min(1, p.t), back = p.t > 1;
        const tt = back ? Math.max(0, 2 - p.t) : e; p.s.position.copy(p.to.p).multiplyScalar(tt);
        if (p.t >= 1 && !p.hit) { p.hit = true; p.to.heat = 1; }
        if (p.t >= 2) { layers[2].remove(p.s); packets.splice(k, 1); } }
      // visitor tokens flying in
      for (let k = flying.length - 1; k >= 0; k--) { const o = flying[k]; o.t += dt * 0.55; const e = smooth(Math.min(1, Math.max(0, o.t)));
        o.l.sprite.position.lerpVectors(o.from, o.to, e); o.l.mat.opacity = o.t > 1 ? Math.max(0, 1 - (o.t - 1) * 2) : 1;
        if (o.t > 1.5) { scene.remove(o.l.sprite); o.l.mat.map.dispose(); o.l.mat.dispose(); labels.splice(labels.indexOf(o.l), 1); flying.splice(k, 1); } }
      renderer.render(scene, camera);
    };
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
    requestAnimationFrame(t => { canvas.classList.add('on'); last = t; frame(t); });
  };

  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 400));
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
