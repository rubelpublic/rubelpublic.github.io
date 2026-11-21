// "Kantha" — a living, AI-stitched embroidery. One glowing needle-and-thread runs the length of the page and,
// as you scroll, the camera flies through motifs that stitch themselves in running-stitch light:
// শাপলা (water lily) → river & nouka → AI circuit → thinking spiral → jamdani memory lattice → music rings → heart.
// Threads are plucked like strings when the pointer sweeps across them; a visitor's question to Paloan flies in as tokens.
// Three.js loads only after the page is idle; rendering pauses when hidden or covered.
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  const LAYERS = [
    { id: 'opening',   name: 'INPUT · শাপলা' },
    { id: 'manifesto', name: 'CONTEXT · নদী' },
    { id: 'services',  name: 'TOOLS · circuit' },
    { id: 'approach',  name: 'THINK · spiral' },
    { id: 'projects',  name: 'MEMORY · jamdani' },
    { id: 'music',     name: 'MUSIC · গান' },
    { id: 'contact',   name: 'OUTPUT · you' },
  ];
  const GAP = 70, Z = LAYERS.map((_, i) => -i * GAP), CAM_BACK = 36;
  const TOOLS = ['memory', 'search', 'bangla.nlp', 'intent', 'plan', 'draft', 'design', 'automate', 'web.build', 'analytics', 'schedule', 'publish', 'crm', 'vision'];
  const STEPS = {
    opening: ['needle.thread("Rapar Rubel")', 'stitch(শাপলা) · 24 petals', 'agent.ready()'],
    manifesto: ['read(context) · river of signals', 'find(need → system)'],
    services: ['tools.load(14)', 'route(plan → automate → ship)'],
    approach: ['listen → decode → frame', 'create → test → keep winner'],
    projects: ['memory.weave(9 projects)', 'recall(context)'],
    music: ['play("আরেকটু থাকো")', 'waveform → thread'],
    contact: ['compose(reply)', 'output → you ♥'],
  };

  const start = async () => {
    let THREE;
    try { THREE = await import(THREE_URL); } catch (e) { return; }
    const small = Math.min(innerWidth, innerHeight) < 700;

    const canvas = document.createElement('canvas');
    canvas.id = 'fx'; canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); } catch (e) { canvas.remove(); return; }
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 420);
    scene.fog = new THREE.FogExp2(0x0d1b1e, 0.0105);

    // ---------- palette (follows dark / light mode) ----------
    const C = { a: new THREE.Color(), b: new THREE.Color(), t: new THREE.Color(), r: new THREE.Color(), light: false };
    const mats = [];
    const labels = [];
    const applyTheme = () => {
      C.light = root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
      C.a.set(C.light ? 0x9a5a00 : 0xf0a830); C.b.set(C.light ? 0x5b46c8 : 0x9c8cff); C.t.set(C.light ? 0x15211f : 0xede6d8); C.r.set(C.light ? 0xb3342b : 0xff6b5a);
      scene.fog.color.set(C.light ? 0xf6f1e7 : 0x0d1b1e);
      mats.forEach(m => { m.blending = C.light ? THREE.NormalBlending : THREE.AdditiveBlending; m.needsUpdate = true;
        if (m.userData.col) { if (m.color) m.color.copy(C[m.userData.col]); if (m.uniforms && m.uniforms.uCol) m.uniforms.uCol.value.copy(C[m.userData.col]); }
        if (m.uniforms && m.uniforms.uGlowK) m.uniforms.uGlowK.value = C.light ? 0.35 : 1; });
      labels.forEach(l => l.redraw());
    };
    const track = (m, col) => { m.userData.col = col; mats.push(m); return m; };

    // ---------- sprites & labels ----------
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const label = (text, opts = {}) => {
      const c = document.createElement('canvas'), g = c.getContext('2d'), size = opts.size || 44;
      const font = `${opts.weight || 600} ${size}px ${opts.family || '"JetBrains Mono", "Hind Siliguri", "Noto Sans Bengali", ui-monospace, monospace'}`;
      g.font = font; const w = Math.ceil(g.measureText(text).width) + size; c.width = w; c.height = Math.ceil(size * 1.7);
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: true, opacity: opts.opacity ?? 1 });
      const s = new THREE.Sprite(mat), k = (opts.world || 1) / c.height;
      s.scale.set(c.width * k, c.height * k, 1);
      const L = { sprite: s, mat, base: opts.opacity ?? 1, redraw: () => { g.clearRect(0, 0, c.width, c.height); g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center';
        if (opts.box) { g.fillStyle = C.light ? 'rgba(246,241,231,.85)' : 'rgba(13,27,30,.6)'; g.strokeStyle = '#' + C[opts.col || 'a'].getHexString(); g.lineWidth = 3;
          g.setLineDash([10, 7]); const r = c.height / 2 - 4; g.beginPath(); g.roundRect(3, 3, c.width - 6, c.height - 6, r); g.fill(); g.stroke(); g.setLineDash([]); }
        g.fillStyle = '#' + C[opts.col || 't'].getHexString(); g.fillText(text, c.width / 2, c.height / 2 + 2); tex.needsUpdate = true; } };
      labels.push(L); return L;
    };
    const glow = (col, size) => { const m = track(new THREE.SpriteMaterial({ map: glowTex, color: C[col], transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), col);
      const s = new THREE.Sprite(m); s.scale.setScalar(size); return s; };
    const rnd = (() => { let s = 21; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
    const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

    // ---------- THREAD: screen-space ribbons with an animated kantha running stitch ----------
    const U = { uT: { value: 0 }, uPh: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(-9, -9) }, uPluck: { value: 0 } };
    const VS = `attribute vec3 aPrev, aNext; attribute float aSide, aU, aLen, aDel;
      uniform float uT, uW, uPluck, uHum; uniform vec2 uRes, uMouse;
      varying float vU, vSide, vLen, vDepth, vR;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z;
        vec4 c = projectionMatrix * mv, p = projectionMatrix * modelViewMatrix * vec4(aPrev, 1.0), n = projectionMatrix * modelViewMatrix * vec4(aNext, 1.0);
        float asp = uRes.x / uRes.y;
        vec2 cs = c.xy / max(c.w, 1e-3), ps = p.xy / max(p.w, 1e-3), ns = n.xy / max(n.w, 1e-3);
        vec2 d = (ns - ps) * vec2(asp, 1.0); float dl = length(d); d = dl > 1e-6 ? d / dl : vec2(1.0, 0.0);
        vec2 nr = vec2(-d.y, d.x);
        float md = length((cs - uMouse) * vec2(asp, 1.0));
        float wob = sin(aU * aLen * 2.3 - uT * 19.0) * uPluck * exp(-md * md * 26.0) * 16.0 + sin(aU * aLen * 1.1 - uT * 4.0) * uHum;
        vec2 off = nr * (aSide * uW * 0.5 + wob); off.x /= asp;
        c.xy += off * 2.0 / uRes.y * c.w;
        if (mv.z > -0.3) c = vec4(2.0, 2.0, 2.0, 1.0);
        gl_Position = c; vU = aU; vSide = aSide; vLen = aLen; vR = aDel * 0.45 + aU * 0.55;
      }`;
    const FS = `uniform vec3 uCol; uniform float uPh, uProg, uDash, uFlow, uA, uFade, uSoft, uGlowK;
      varying float vU, vSide, vLen, vDepth, vR;
      void main(){
        float e = 1.0 - abs(vSide); float core = uSoft > 0.5 ? pow(e, 2.2) * uGlowK : smoothstep(0.0, 0.55, e);
        float s = fract(vU * vLen * uDash - uPh * uFlow);
        float stitch = smoothstep(0.0, 0.07, s) * smoothstep(0.7, 0.62, s);
        float rev = smoothstep(uProg + 0.003, uProg - 0.006, vR);
        float tip = exp(-max(0.0, uProg - vR) * vLen * 2.2) * step(vR, uProg) * step(uProg, 0.999);
        float fog = smoothstep(200.0, 34.0, vDepth) * smoothstep(1.0, 8.0, vDepth);
        float a = ((stitch * 0.82 + 0.18) * rev + tip * 1.4) * core * fog * uA * uFade;
        gl_FragColor = vec4(uCol + tip * 0.55, a);
      }`;
    const threadGeo = (paths, delays) => {
      const P = [], PR = [], NX = [], S = [], UU = [], LEN = [], DEL = [], IDX = []; let base = 0;
      paths.forEach((pts, pi) => {
        const n = pts.length; if (n < 2) return; const acc = [0];
        for (let i = 1; i < n; i++) acc.push(acc[i - 1] + pts[i].distanceTo(pts[i - 1]));
        const L = acc[n - 1] || 1, del = delays ? delays[pi] : (paths.length > 1 ? pi / (paths.length - 1) : 0);
        for (let i = 0; i < n; i++) { const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
          for (const sd of [-1, 1]) { P.push(p.x, p.y, p.z); PR.push(a.x, a.y, a.z); NX.push(b.x, b.y, b.z); S.push(sd); UU.push(acc[i] / L); LEN.push(L); DEL.push(del); } }
        for (let i = 0; i < n - 1; i++) { const k = base + i * 2; IDX.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
        base += n * 2;
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aPrev', new THREE.Float32BufferAttribute(PR, 3));
      g.setAttribute('aNext', new THREE.Float32BufferAttribute(NX, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(S, 1));
      g.setAttribute('aU', new THREE.Float32BufferAttribute(UU, 1)); g.setAttribute('aLen', new THREE.Float32BufferAttribute(LEN, 1));
      g.setAttribute('aDel', new THREE.Float32BufferAttribute(DEL, 1)); g.setIndex(IDX);
      return g;
    };
    const threadMat = (col, o = {}) => track(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
      uniforms: { ...U, uCol: { value: C[col].clone() }, uW: { value: o.w ?? 2.2 }, uProg: { value: o.prog ?? 0 }, uDash: { value: o.dash ?? 1.6 }, uFlow: { value: o.flow ?? 1 },
        uA: { value: o.a ?? 1 }, uFade: { value: 1 }, uHum: { value: o.hum ?? 0 }, uSoft: { value: o.soft ? 1 : 0 }, uGlowK: { value: 1 } },
      vertexShader: VS, fragmentShader: FS }), col);
    // a "stitch" = crisp core thread + soft glow halo sharing one geometry
    const stitch = (group, paths, col, o = {}) => {
      const g = threadGeo(paths, o.delays), core = threadMat(col, o), halo = threadMat(col, { ...o, w: (o.w ?? 2.2) * 5, a: (o.a ?? 1) * 0.22, soft: true, dash: 0.0001 });
      const m1 = new THREE.Mesh(g, core), m2 = new THREE.Mesh(g, halo); m1.frustumCulled = m2.frustumCulled = false; m2.renderOrder = -1;
      group.add(m2, m1); group.userData.mats = (group.userData.mats || []).concat(core, halo); return core;
    };
    const ring = (r, n = 120, f, z = 0, cx = 0, cy = 0) => { const a = []; for (let i = 0; i <= n; i++) { const t = i / n * 6.2832, rr = f ? f(t) : r; a.push(V(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, typeof z === 'function' ? z(t) : z)); } return a; };
    const seg = (a, b, n = 12) => { const o = []; for (let i = 0; i <= n; i++) o.push(a.clone().lerp(b, i / n)); return o; };
    const poly = (pts, n = 10) => { const o = []; for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], n).forEach((p, k) => { if (i === 0 || k) o.push(p); }); return o; };

    const layers = LAYERS.map((L, i) => { const g = new THREE.Group(); g.position.z = Z[i]; scene.add(g);
      const t = label(String(i + 1).padStart(2, '0') + ' · ' + L.name, { size: 40, world: 1.5, col: 'a', weight: 500 }); t.sprite.position.set(-2, 11.5, 0); g.add(t.sprite);
      g.userData.prog = 0; g.userData.labels = [t]; return g; });
    const animators = [];
    const addLabel = (g, text, pos, o) => { const l = label(text, o); l.sprite.position.copy(pos); g.add(l.sprite); g.userData.labels.push(l); return l; };

    // ---------- 01 শাপলা — water lily stitched petal by petal ----------
    {
      const g = layers[0], lily = new THREE.Group(); g.add(lily);
      const petal = (ang, L, w, tilt, sc = 1) => { const pts = [], N = 30;
        for (let i = 0; i <= N; i++) { const s = i / N; pts.push([s * L, w * Math.pow(Math.sin(Math.PI * s), 0.8) * (1 - 0.3 * s)]); }
        for (let i = N - 1; i >= 0; i--) { const s = i / N; pts.push([s * L, -w * Math.pow(Math.sin(Math.PI * s), 0.8) * (1 - 0.3 * s)]); }
        const c = Math.cos(ang), sn = Math.sin(ang); return pts.map(([u, v]) => V((u * c - v * sn) * sc, (u * sn + v * c) * sc, u * tilt * sc)); };
      const outer = [], inner = [], heart = [], fill = [], veins = [];
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + 0.2; outer.push(petal(a, 8.6, 2.3, 0.42)); fill.push(petal(a, 8.6, 2.3, 0.42, 0.72));
        veins.push(seg(V(Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0.6), V(Math.cos(a) * 7, Math.sin(a) * 7, 3), 16)); }
      for (let i = 0; i < 8; i++) inner.push(petal(i / 8 * 6.2832 + 0.59, 6.1, 1.9, 0.75));
      for (let i = 0; i < 8; i++) heart.push(petal(i / 8 * 6.2832 + 0.2, 3.6, 1.25, 1.1));
      stitch(lily, outer, 'a', { w: 2.4 }); stitch(lily, fill, 'a', { w: 1.3, a: 0.55, dash: 2.6 }); stitch(lily, veins, 'a', { w: 1.1, a: 0.5, dash: 2.2 });
      stitch(lily, inner, 'b', { w: 2.2 }); stitch(lily, heart, 'r', { w: 2 });
      stitch(lily, [ring(1.1, 48, null, 3.4), ring(0.55, 32, null, 3.6)], 't', { w: 1.8 });
      const stamen = []; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.2832; stamen.push(seg(V(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 3.4), V(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 4.6), 6)); }
      stitch(lily, stamen, 't', { w: 1.2, a: 0.8 });
      const ripples = [10.5, 13.5, 16.5, 19.5].map((r, i) => ring(r, 160).map(p => V(p.x, -8.2 + p.y * 0.06 - i * 0.35, p.y * 0.3 - 2)));
      stitch(g, ripples, 'b', { w: 1.4, a: 0.6, flow: -0.6, dash: 1.2 });
      g.userData.mats = (g.userData.mats || []).concat(lily.userData.mats);
      animators.push(t => { lily.rotation.z = Math.sin(t * 0.25) * 0.06 + t * 0.03; lily.rotation.x = Math.sin(t * 0.4) * 0.06; });
    }
    // ---------- 02 নদী — river of signals with a nouka sailing ----------
    {
      const g = layers[1], river = [];
      for (let k = 0; k < 10; k++) { const pts = []; for (let x = -26; x <= 26; x += 0.5) pts.push(V(x, -6.5 + k * 0.72 + 0.55 * Math.sin(x * 0.28 + k * 0.7), -k * 0.9)); river.push(pts); }
      stitch(g, river, 'b', { w: 1.6, a: 0.75, flow: 1.4, dash: 1.1, delays: river.map((_, i) => i / 9 * 0.6) });
      const boat = new THREE.Group(); g.add(boat); boat.position.set(-1, -1.2, 1.5);
      const hull = []; for (let x = -6; x <= 6; x += 0.25) hull.push(V(x, 0.035 * x * x + 0.25)); for (let x = 6; x >= -6; x -= 0.25) hull.push(V(x, 0.075 * x * x - 1.45));
      hull.push(hull[0].clone());
      const planks = [0.55, 0.15, -0.3, -0.75].map(yy => { const p = []; for (let x = -5.5; x <= 5.5; x += 0.25) { const top = 0.035 * x * x + 0.25, bot = 0.075 * x * x - 1.45; if (yy < top - 0.05 && yy > bot + 0.05) p.push(V(x, yy)); } return p; });
      stitch(boat, [hull], 'a', { w: 2.4 }); stitch(boat, planks, 'a', { w: 1.1, a: 0.55, dash: 2.4 });
      const sail = poly([V(-0.4, 1.0), V(-0.4, 7.8), V(4.4, 6.4), V(5.0, 1.5), V(-0.4, 1.0)], 14);
      const sailRows = []; for (let i = 1; i < 7; i++) { const y = 1 + i * 0.95; sailRows.push(seg(V(0, y), V(4.6 - Math.max(0, y - 6.2) * 0.8, y - i * 0.07), 14)); }
      stitch(boat, [sail], 'r', { w: 2.2 }); stitch(boat, sailRows, 'r', { w: 1.1, a: 0.55, dash: 2.6 }); stitch(boat, [seg(V(-0.4, 0.3), V(-0.4, 8.6), 20)], 't', { w: 1.6 });
      const sun = ring(2.3, 80, null, -6, -10, 6.5), rays = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; rays.push(seg(V(-10 + Math.cos(a) * 3, 6.5 + Math.sin(a) * 3, -6), V(-10 + Math.cos(a) * 4.4, 6.5 + Math.sin(a) * 4.4, -6), 4)); }
      stitch(g, [sun], 'a', { w: 2 }); stitch(g, rays, 'a', { w: 1.2, a: 0.7 });
      g.userData.mats = g.userData.mats.concat(boat.userData.mats);
      animators.push(t => { boat.position.y = -1.2 + Math.sin(t * 1.1) * 0.35; boat.rotation.z = Math.sin(t * 0.9) * 0.05; boat.position.x = -1 + Math.sin(t * 0.15) * 3; });
    }
    // ---------- 03 TOOLS — the AI chip as a stitched circuit; signals run along the traces ----------
    {
      const g0 = layers[2], g = new THREE.Group(); g0.add(g); g.scale.setScalar(0.78); g.userData.labels = g0.userData.labels;
      const sq = h => poly([V(-h, -h), V(h, -h), V(h, h), V(-h, h), V(-h, -h)], 10);
      stitch(g, [sq(3.2), sq(2.4)], 'a', { w: 2.3 }); addLabel(g, 'PALOAN', V(0, 0, 0.2), { size: 46, world: 1.15, col: 't', weight: 700 });
      const dirs = [V(1, 0), V(0, 1), V(-1, 0), V(0, -1)], traces = [], pads = [];
      TOOLS.forEach((name, i) => { const d = dirs[i % 4], pp = V(-d.y, d.x), j = Math.floor(i / 4), o = (j - 1.5) * 1.45, sg = o >= 0 ? 1 : -1;
        const s0 = d.clone().multiplyScalar(3.2).addScaledVector(pp, o), p1 = s0.clone().addScaledVector(d, 1.4 + j * 0.9),
          p2 = p1.clone().addScaledVector(d, 2.2 + (i % 3)).addScaledVector(pp, sg * (2.2 + (i % 3))), p3 = p2.clone().addScaledVector(d, 2.4);
        [s0, p1, p2, p3].forEach(p => p.z = -0.02 * i);
        traces.push(poly([s0, p1, p2, p3], 10)); pads.push(ring(0.42, 24, null, p3.z, p3.x, p3.y));
        addLabel(g, name, p3.clone().addScaledVector(d, 1.5).add(V(0, d.y ? 0 : 0.7, 0)), { size: 40, world: 1.0, col: 't' }); });
      stitch(g, traces, 'b', { w: 1.7, flow: 2.2, dash: 0.9 }); stitch(g, pads, 'a', { w: 1.8 });
      g0.userData.mats = g.userData.mats;
      const core = glow('b', 7); g.add(core);
      animators.push(t => { g.rotation.x = Math.sin(t * 0.3) * 0.12; g.rotation.y = Math.sin(t * 0.21) * 0.18; core.scale.setScalar(7 + Math.sin(t * 1.7) * 0.9); });
    }
    // ---------- 04 THINK — a five-turn spiral: Listen, Decode, Frame, Create, Test ----------
    {
      const g = layers[3], spin = new THREE.Group(); g.add(spin); spin.userData.labels = g.userData.labels;
      const sp = off => { const o = []; for (let t = 0; t <= 5; t += 0.01) { const r = 0.8 + t * 1.9 + off, a = t * 6.2832; o.push(V(Math.cos(a) * r, Math.sin(a) * r * 0.82, -t * 0.7)); } return o; };
      stitch(spin, [sp(0)], 'a', { w: 2.4, dash: 1.2 }); stitch(spin, [sp(0.42)], 'b', { w: 1.3, a: 0.6, dash: 2.4, flow: -1 });
      g.userData.mats = (g.userData.mats || []).concat(spin.userData.mats);
      ['Listen', 'Decode', 'Frame', 'Create', 'Test'].forEach((w, i) => { const r = 0.8 + (i + 1) * 1.9;
        const tt = i + 0.35 + i * 0.13, rr = 0.8 + tt * 1.9, aa = tt * 6.2832;
        const l = addLabel(spin, String(i + 1).padStart(2, '0') + ' ' + w, V(Math.cos(aa) * rr, Math.sin(aa) * rr * 0.82 + 0.9, -tt * 0.7 + 0.5), { size: 42, world: 1.05, col: i % 2 ? 'b' : 'a', box: true }); });
      animators.push(t => { spin.rotation.z = -t * 0.09; });
    }
    // ---------- 05 MEMORY — a jamdani diamond lattice holding the 9 projects ----------
    {
      const g = layers[4], cells = [], crosses = [], centers = [];
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { if (Math.abs(i) + Math.abs(j) > 4) continue; const cx = (i - j) * 1.9, cy = (i + j) * 1.55, h = 1.2;
        cells.push(poly([V(cx, cy - h), V(cx + h * 1.2, cy), V(cx, cy + h), V(cx - h * 1.2, cy), V(cx, cy - h)], 6)); centers.push(V(cx, cy));
        crosses.push(seg(V(cx - 0.35, cy), V(cx + 0.35, cy), 3), seg(V(cx, cy - 0.3), V(cx, cy + 0.3), 3)); }
      const B = 9.6, ends = [V(0, -B * 0.82), V(B * 1.2, 0), V(0, B * 0.82), V(-B * 1.2, 0)], zig = [];
      for (let s = 0; s < 4; s++) { const a = ends[s], b = ends[(s + 1) % 4], n = V(-(b.y - a.y), b.x - a.x).normalize();
        for (let k = 0; k <= 22; k++) zig.push(a.clone().lerp(b, k / 22).addScaledVector(n, k % 2 ? 0.55 : -0.1)); }
      stitch(g, cells, 'b', { w: 1.5, a: 0.8 }); stitch(g, crosses, 'a', { w: 1.4 }); stitch(g, [zig, poly([V(0, -B), V(B * 1.45, 0), V(0, B), V(-B * 1.45, 0), V(0, -B)], 30)], 'a', { w: 1.9 });
      const projs = ['MimAI', 'Paloan', 'proyojon.shop', 'Vromon', 'Abashon', 'CAP ON HEAD', 'Myook', 'AI video', '3D City'];
      const pick = [0, 4, 8, 12, 16, 20, 24, 2, 22]; projs.forEach((p, k) => { const c = centers[pick[k] % centers.length]; addLabel(g, p, c.clone().add(V(0, 0.15, 0.6)), { size: 40, world: 0.95, col: 'a', box: true }); });
      animators.push(t => { g.rotation.y = Math.sin(t * 0.18) * 0.35; g.rotation.x = Math.sin(t * 0.13) * 0.1; });
    }
    // ---------- 06 MUSIC — humming sound rings, like strings around a speaker ----------
    {
      const g = layers[5], rings = [];
      for (let i = 0; i < 7; i++) { const r = 2.2 + i * 1.45, h = 3 + i * 2; rings.push(ring(r, 220, t => r + 0.28 * Math.sin(h * t + i) + 0.12 * Math.sin((h + 5) * t), -i * 0.5)); }
      const ra = stitch(g, rings.filter((_, i) => i % 2 === 0), 'a', { w: 2, hum: 2.2, flow: 1.6 }), rb = stitch(g, rings.filter((_, i) => i % 2), 'b', { w: 1.8, hum: 2.2, flow: -1.6 });
      const bars = []; for (let i = 0; i < 72; i++) { const a = i / 72 * 6.2832, l = 1 + 2.6 * Math.abs(Math.sin(i * 0.61) * Math.cos(i * 0.23)); bars.push(seg(V(Math.cos(a) * 12.4, Math.sin(a) * 12.4, -3.4), V(Math.cos(a) * (12.4 + l), Math.sin(a) * (12.4 + l), -3.4), 5)); }
      stitch(g, bars, 'r', { w: 1.4, a: 0.8, dash: 3 });
      const songs = ['আরেকটু থাকো', 'Signal নাই', 'নিখোঁজ সংবাদ', 'ভেবাচেকা', 'ঘুমের গাড়ি'];
      const ls = songs.map((s, i) => addLabel(g, '♪ ' + s, V(0, 0, 1), { size: 42, world: 1.15, col: i % 2 ? 'b' : 'a', box: true, family: '"Hind Siliguri", "Noto Sans Bengali", "JetBrains Mono", sans-serif' }));
      const core = glow('a', 6); g.add(core);
      animators.push(t => { const beat = Math.pow(0.5 + 0.5 * Math.sin(t * 4.2), 6); ra.uniforms.uHum.value = rb.uniforms.uHum.value = 1.5 + beat * 3.5; core.scale.setScalar(5 + beat * 3);
        ls.forEach((l, i) => { const a = t * 0.18 + i / ls.length * 6.2832; l.sprite.position.set(Math.cos(a) * 9.6, Math.sin(a) * 7.2, 1.5); }); });
    }
    // ---------- 07 OUTPUT — a stitched heart sending threads toward you ----------
    {
      const g = layers[6], beatG = new THREE.Group(); g.add(beatG);
      const heart = s => { const o = []; for (let i = 0; i <= 200; i++) { const t = i / 200 * 6.2832;
        o.push(V(16 * Math.pow(Math.sin(t), 3) * 0.42 * s, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.42 * s + 1, 0)); } return o; };
      stitch(beatG, [heart(1)], 'r', { w: 2.6 }); stitch(beatG, [heart(0.78), heart(0.56)], 'a', { w: 1.4, a: 0.7, dash: 2.4 });
      const h1 = heart(1), rays = []; for (let i = 0; i < 64; i++) { const p = h1[(i * 3) % 200], d = p.clone().sub(V(0, 1)).normalize(); rays.push(seg(p.clone(), p.clone().addScaledVector(d, 3 + rnd() * 4).add(V(0, 0, 3 + rnd() * 6)), 10)); }
      stitch(beatG, rays, 'a', { w: 1.1, a: 0.32, flow: 2.6, dash: 0.8 });
      g.userData.mats = (g.userData.mats || []).concat(beatG.userData.mats);
      const sun = glow('r', 9); sun.position.y = 0.5; g.add(sun);
      animators.push(t => { const b = 1 + 0.06 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.6), 4); beatG.scale.setScalar(b); sun.scale.setScalar(9 * b); });
    }

    // ---------- the guiding thread: one needle sews through every motif along the whole page ----------
    const guide = new THREE.Group(); scene.add(guide);
    const gz0 = 34, gz1 = Z[Z.length - 1] - 14, gPath = [];
    const gAt = z => V(7 * Math.sin(z * 0.045) * (0.25 + Math.min(1, Math.abs(Math.sin(z * Math.PI / GAP)))), 4.2 * Math.sin(z * 0.029 + 1), z);
    for (let z = gz0; z >= gz1; z -= 0.4) gPath.push(gAt(z));
    const guideMat = stitch(guide, [gPath], 'a', { w: 2.2, dash: 0.9, flow: 1.4 }), guideHalo = guide.userData.mats[1];
    const needle = glow('t', 2.6), needleTrail = glow('a', 6); guide.add(needleTrail, needle); needleTrail.material.opacity = 0.55;

    // ---------- loose cotton fibres drifting along the flight ----------
    {
      const fib = [], span = GAP * LAYERS.length + 60, n = small ? 160 : 340;
      for (let i = 0; i < n; i++) { const a = rnd() * 6.2832, r = 9 + rnd() * 26; let p = V(Math.cos(a) * r, Math.sin(a) * r * 0.7, 40 - rnd() * span); const pts = [p.clone()], d = V(gauss(), gauss(), gauss()).normalize();
        for (let k = 0; k < 7; k++) { d.add(V(gauss() * 0.35, gauss() * 0.35, gauss() * 0.35)).normalize(); p = p.clone().addScaledVector(d, 0.3); pts.push(p); } fib.push(pts); }
      const fg = new THREE.Group(); scene.add(fg);
      stitch(fg, fib, 't', { w: 1.1, a: 0.45, dash: 4, prog: 1 }); fg.userData.mats.forEach(m => { m.uniforms.uProg.value = 1; });
      animators.push(t => { fg.rotation.z = t * 0.01; });
    }
    // ---------- dust stream (depth) + warp streaks on fast scroll ----------
    {
      const n = small ? 900 : 2200, pos = new Float32Array(n * 3), span = GAP * LAYERS.length + 80;
      for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r = 10 + rnd() * 28; pos.set([Math.cos(a) * r, Math.sin(a) * r * 0.7, 40 - rnd() * span], i * 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const mat = track(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uT: U.uT, uCol: { value: C.t.clone() }, uSpan: { value: span }, uPx: { value: 1 } },
        vertexShader: 'uniform float uT, uSpan, uPx; varying float vA; void main(){ vec3 p = position; p.z = 40.0 - mod(40.0 - p.z - uT * 4.0, uSpan); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = uPx * 70.0 / -mv.z; vA = smoothstep(160.0, 20.0, -mv.z) * smoothstep(0.5, 6.0, -mv.z); }',
        fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uCol, smoothstep(0.5, 0.0, d) * vA * 0.6); }' }), 't');
      scene.add(new THREE.Points(geo, mat)); mats.streamPx = mat;
    }
    let warpMat;
    {
      const n = small ? 400 : 900, span = GAP * LAYERS.length + 80, pos = new Float32Array(n * 6), end = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r = 9 + rnd() * 26, z = 40 - rnd() * span;
        pos.set([Math.cos(a) * r, Math.sin(a) * r * 0.7, z, Math.cos(a) * r, Math.sin(a) * r * 0.7, z], i * 6); end[i * 2] = 0; end[i * 2 + 1] = 1; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 1));
      warpMat = track(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uW: { value: 0 }, uSpan: { value: span }, uCol: { value: C.a.clone() } },
        vertexShader: 'attribute float aEnd; uniform float uT, uW, uSpan; varying float vA; void main(){ vec3 p = position; p.z = 40.0 - mod(40.0 - p.z - uT * 9.0, uSpan); p.z += aEnd * uW * 14.0; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; vA = uW * smoothstep(140.0, 12.0, -mv.z) * smoothstep(0.5, 5.0, -mv.z) * (1.0 - aEnd * 0.85); }',
        fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol, vA * 0.9); }' }), 'a');
      scene.add(new THREE.LineSegments(geo, warpMat));
    }

    // ---------- live log (desktop) ----------
    const log = document.createElement('div'); log.className = 'agent-log'; log.setAttribute('aria-hidden', 'true');
    log.innerHTML = '<div class="al-head"><i></i><span>PALOAN · live</span></div><div class="al-lines"></div>'; document.body.appendChild(log);
    const head = log.querySelector('.al-head span'), lineBox = log.querySelector('.al-lines'); let hideT;
    const wake = ms => { log.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(() => log.classList.remove('on'), ms || 3400); };
    const say = (txt, done) => { if (innerWidth < 900) return; wake(4200); const el = document.createElement('div'); el.className = 'al-line'; el.innerHTML = '<span class="al-t"></span><b>…</b>'; lineBox.appendChild(el);
      while (lineBox.children.length > 4) lineBox.firstChild.remove(); const sp = el.firstChild; let i = 0; (function ty() { sp.textContent = '› ' + txt.slice(0, i); if (i++ < txt.length) setTimeout(ty, 14); else setTimeout(() => { el.lastChild.textContent = '✓'; wake(); done && done(); }, 380); })(); };

    // ---------- the visitor's question flies in as tokens, and every thread surges ----------
    const flying = []; let energy = 0, curLayer = 0;
    const tokenize = q => (q.match(/\s?[^\s]{1,4}/g) || []).slice(0, 14);
    addEventListener('paloan:ask', e => {
      const q = (e.detail && e.detail.q) || '', intent = (e.detail && e.detail.intent) || 'unknown';
      const from = camera.position.clone().add(V(7, -4, -10)), toZ = Z[curLayer];
      tokenize(q).forEach((tk, i) => { const l = label(tk.replace(' ', '␣'), { size: 44, world: 1.2, col: 'b', box: true }); l.redraw(); scene.add(l.sprite);
        l.sprite.position.copy(from); flying.push({ l, from: from.clone().add(V((i % 4) * 0.8, Math.floor(i / 4) * 0.9, 0)), to: V((rnd() - 0.5) * 6, (rnd() - 0.5) * 4, toZ), t: -i * 0.07 }); });
      head.textContent = 'PALOAN · reading your question'; say('tokenize("' + q.slice(0, 26) + (q.length > 26 ? '…' : '') + '")', () => say('intent → ' + intent, () => say('stitch(answer) → chat ✦')));
      energy = 1; U.uPluck.value = 1.2;
    });

    // ---------- pointer: threads near the cursor get plucked like strings ----------
    let pmx = 0, pmy = 0, pT = performance.now(), mx = 0, my = 0;
    addEventListener('pointermove', e => { const nx = e.clientX / innerWidth * 2 - 1, ny = -(e.clientY / innerHeight) * 2 + 1, now = performance.now();
      const sp = Math.hypot(nx - pmx, ny - pmy) / Math.max(8, now - pT) * 1000; U.uPluck.value = Math.min(1.2, U.uPluck.value + sp * 0.02);
      U.uMouse.value.set(nx, ny); pmx = nx; pmy = ny; pT = now; mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

    // ---------- layout & scroll → camera flight ----------
    let W, H, anchors = [], covers = [], baseFov = 58;
    const measure = () => {
      W = innerWidth; H = innerHeight; const dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
      renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); camera.aspect = W / H; U.uRes.value.set(W, H);
      camera.filmOffset = W >= 900 ? -13 : 0;
      const offX = W >= 900 ? 7.5 : 0;
      layers.forEach(g => { g.position.x = offX; g.scale.setScalar(W >= 900 ? 1.35 : 1.05); });
      if (W >= 900) layers[0].position.x = 6;
      guide.position.x = offX;
      camera.fov = baseFov = W / H < 1 ? 72 : 58; camera.updateProjectionMatrix();
      if (mats.streamPx) mats.streamPx.uniforms.uPx.value = dpr * (W / H < 1 ? 1.4 : 1) * (H / 900);
      canvas.style.opacity = W < 900 ? (C.light ? 0.6 : 0.75) : 1;
      const abs = el => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.height]; };
      anchors = LAYERS.map(L => { const el = document.getElementById(L.id); if (!el) return null; const [t, h] = abs(el); return t + Math.min(h, H * 2) / 2; });
      covers = ['portrait', 'reel', 'bts'].map(id => document.getElementById(id)).filter(Boolean).map(el => { const [t, h] = abs(el); return [t, t + h - H]; });
    };
    applyTheme(); measure();
    new MutationObserver(() => { applyTheme(); measure(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { applyTheme(); measure(); }); } catch (e) {}
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 150); });
    setInterval(measure, 4000);

    let lastY = scrollY, vel = 0, camZ = Z[0] + CAM_BACK, shownLayer = -1, running = true, wasCovered = false, last = performance.now(), T = 0, intro = 0, gFront = gz0;
    const smooth = x => x * x * (3 - 2 * x), clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
    const gLen = gz0 - gz1;
    const frame = now => {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; intro += dt;
      const y = scrollY; const dy = y - lastY; lastY = y;
      vel += ((Math.abs(dy) / Math.max(dt, 0.008)) / 2600 - vel) * Math.min(1, dt * 6); vel = Math.min(1, vel);
      if (covers.some(([a, b]) => y > a + 4 && y < b - 4)) { if (!wasCovered) { renderer.clear(); wasCovered = true; } return; }
      wasCovered = false;
      const c = y + H / 2; let i = 0; while (i < anchors.length - 1 && anchors[i + 1] != null && c > anchors[i + 1]) i++;
      const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
      let f = b > a ? (c - a) / (b - a) : 0; f = clamp(f); const fs = smooth(clamp((f - 0.12) / 0.76));
      const target = Z[i] + CAM_BACK + (Z[Math.min(i + 1, Z.length - 1)] - Z[i]) * fs;
      camZ += (target - camZ) * Math.min(1, dt * 3.2);
      curLayer = clamp(Math.round((Z[0] + CAM_BACK - camZ) / GAP), 0, LAYERS.length - 1);
      if (curLayer !== shownLayer) { shownLayer = curLayer; head.textContent = 'PALOAN · layer ' + String(curLayer + 1).padStart(2, '0') + ' · ' + LAYERS[curLayer].name;
        const st = STEPS[LAYERS[curLayer].id] || []; let k = 0; const nx = () => { if (k < st.length) say(st[k++], nx); }; nx(); }
      camera.position.set(mx * 3, -my * 2, camZ);
      camera.lookAt(mx * 1.2, -my * 0.8, camZ - 40);
      camera.rotateZ(clamp(dy * 0.0009, -0.06, 0.06));
      const fov = baseFov + vel * 14; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * 0.25; camera.updateProjectionMatrix(); }
      energy = Math.max(0, energy - dt * 0.5);
      U.uT.value = T; U.uPh.value += dt * (0.35 + vel * 2.2 + energy * 3);
      U.uPluck.value = Math.max(0, U.uPluck.value - dt * 1.6);
      warpMat.uniforms.uT.value = T; warpMat.uniforms.uW.value = vel;
      // each motif stitches itself in as you approach it (and unstitches when you scroll back)
      layers.forEach((g, k) => { const d = camZ - Z[k];
        const want = clamp((CAM_BACK + GAP * 0.78 - d) / (GAP * 0.78 - 6)) * clamp((intro - 0.3) / 2.6);
        g.userData.prog += (want - g.userData.prog) * Math.min(1, dt * 2.6);
        const fade = smooth(clamp((d + 2) / 12)), pr = g.userData.prog;
        (g.userData.mats || []).forEach(m => { m.uniforms.uProg.value = pr; m.uniforms.uFade.value = fade; });
        const lo = smooth(clamp((pr - 0.55) / 0.4)) * fade; g.userData.labels.forEach(l => { l.mat.opacity = l.base * lo; });
        g.visible = d > -6 && d < CAM_BACK + GAP * 2.4; });
      // the needle runs a little ahead of the camera, sewing the guiding thread
      const front = Math.max(gz1, Math.min(gz0, camZ - 26 - vel * 10)); gFront += (front - gFront) * Math.min(1, dt * 2);
      const gp = clamp((gz0 - gFront) / gLen * clamp(intro / 2.2)); guideMat.uniforms.uProg.value = gp; guideHalo.uniforms.uProg.value = gp;
      const np = gAt(gz0 - gp * gLen); needle.position.copy(np); needleTrail.position.copy(np);
      needle.scale.setScalar(2.2 + Math.sin(T * 9) * 0.5); needleTrail.scale.setScalar(3 + vel * 5 + energy * 3);
      animators.forEach(fn => fn(T));
      for (let k = flying.length - 1; k >= 0; k--) { const o = flying[k]; o.t += dt * 0.55; const e = smooth(clamp(o.t));
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
