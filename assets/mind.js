// "Liquid Workflow" — one living, liquid-glass object that melts from form to form as you scroll,
// telling Rapar Rubel's workflow: a raw idea → LISTEN (voices orbit) → DECODE (crystal chip) → THINK (neural lattice)
// → BUILD (a Cha Khaben? tea cup, steam rising) → MUSIC (a spinning record) → YOU (a heart).
// Raymarched signed-distance fields in a single fragment shader (no libraries). The liquid reaches toward the pointer,
// wobbles like jelly on fast scroll, and surges when a visitor asks Paloan a question. Pauses when hidden or covered.
(() => {
  const root = document.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const STAGES = [
    { id: 'opening',   k: 'RAW IDEA', s: 'every project starts as a feeling' },
    { id: 'manifesto', k: 'LISTEN',   s: 'what customers say, ask and fear' },
    { id: 'services',  k: 'DECODE',   s: 'AI turns noise into a clear need' },
    { id: 'approach',  k: 'THINK',    s: 'frame → create → test' },
    { id: 'projects',  k: 'BUILD',    s: 'real brands, like Cha Khaben? ☕' },
    { id: 'music',     k: 'MUSIC',    s: 'the side of me that sings' },
    { id: 'contact',   k: 'YOU',      s: 'output → a business that grows' },
  ];
  const STEPS = [
    ['idea.capture("Rapar Rubel")', 'agent.ready()'],
    ['listen(customers) · Bangla + Banglish', 'collect(says, asks, fears)'],
    ['decode(noise → need)', 'tools.load(14)'],
    ['frame → create → test', 'keep(winner)'],
    ['build(brand) · ☕ Cha Khaben?', 'ship()'],
    ['play("আরেকটু থাকো")', 'beat → shape'],
    ['compose(reply)', 'output → you ♥'],
  ];

  const VS = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
  const FS = (steps) => `precision highp float;
uniform vec2 uC, uMP; uniform float uR, uT, uS, uVel, uE, uBeat, uLight; uniform mat3 uRot; uniform vec3 uA, uB, uInk;
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float sdCyl(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
float dot2(vec2 v){ return dot(v, v); }
float sdHeart(vec2 p){ p.x = abs(p.x); if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - 0.35355;
  return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y); }
mat2 r2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float wob(vec3 p){ return sin(p.x * 1.7 + uT * 1.3) * sin(p.y * 1.9 - uT * 1.1) * sin(p.z * 1.5 + uT * 0.9)
  + 0.5 * sin(p.x * 3.3 - uT * 0.7) * sin(p.y * 2.9 + uT * 1.4) * sin(p.z * 3.7 - uT); }
float shape(int i, vec3 p){
  if (i == 0) { return length(p) - 1.0; }
  if (i == 1) { float d = length(p) - 0.5;
    for (int k = 0; k < 6; k++) { float a = float(k) * 1.0472 + uT * 0.7;
      vec3 c = vec3(cos(a) * 1.05, sin(float(k) * 2.1 + uT * 1.3) * 0.38, sin(a) * 1.05);
      d = smin(d, length(p - c) - 0.25, 0.34); }
    return d; }
  if (i == 2) { vec3 q = p; q.xy *= r2(0.7854); q.yz *= r2(0.6155); return sdBox(q, vec3(0.58), 0.12); }
  if (i == 3) { float sph = length(p) - 1.05; float g = abs(dot(sin(p * 4.2), cos(p.zxy * 4.2))) / 4.6 - 0.045;
    return smin(max(sph, g), length(p) - 0.32, 0.2); }
  if (i == 4) { vec3 q = p + vec3(0.12, 0.1, 0.0);
    float k = 1.0 + 0.32 * clamp(q.y + 0.45, 0.0, 1.0); vec3 qb = vec3(q.x / k, q.y, q.z / k);
    float body = (sdCyl(qb, 0.5, 0.45) - 0.05) * 0.9;
    float hollow = sdCyl(qb - vec3(0.0, 0.2, 0.0), 0.43, 0.4) * 0.9;
    float cup = max(body, -hollow);
    vec3 h = q - vec3(0.66, 0.02, 0.0); float handle = sdTorus(vec3(h.x - 0.05, h.z, h.y), vec2(0.27, 0.075));
    cup = smin(cup, handle, 0.06);
    cup = min(cup, sdCyl(q - vec3(0.0, 0.16, 0.0), 0.56, 0.02));
    cup = smin(cup, sdCyl(q - vec3(0.0, -0.56, 0.0), 0.95, 0.03) - 0.02, 0.08);
    for (int k = 0; k < 3; k++) { float y = fract(uT * 0.35 + float(k) * 0.333);
      vec3 c = vec3(sin(y * 6.0 + float(k) * 2.1) * 0.22 + (float(k) - 1.0) * 0.18, 0.75 + y * 1.0, cos(y * 5.0 + float(k)) * 0.12);
      cup = smin(cup, length(q - c) - (0.05 + 0.12 * (1.0 - y)), 0.08); }
    return cup; }
  if (i == 5) { vec3 q = p; q.yz *= r2(1.32); q.xz *= r2(uT * 1.6);
    float disc = sdCyl(q, 1.0, 0.035 + uBeat * 0.02) - 0.02 + 0.006 * sin(length(q.xz) * 70.0);
    float lab = sdCyl(q, 0.32, 0.06 + uBeat * 0.05) - 0.02;
    float ring = sdTorus(q, vec2(1.06 + uBeat * 0.08, 0.035));
    return min(min(disc, lab), ring); }
  vec3 q = p * (1.0 - uBeat * 0.06); vec2 hp = vec2(q.x, q.y + 0.62) * 0.78;
  float dh = sdHeart(hp) / 0.78; vec2 w = vec2(dh, abs(q.z) - 0.16);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.14;
}
float map(vec3 p){
  vec3 m = normalize(vec3(uMP, 0.9)) * 1.05; float pull = exp(-length(uMP) * 0.55) * 0.2;
  float bulge = pull * exp(-dot(p - m, p - m) * 3.5);
  p = uRot * p; p.y /= 1.0 + uVel * 0.38; p.xz *= 1.0 + uVel * 0.16;
  float s = clamp(uS, 0.0, 6.0); int i = int(min(floor(s), 5.0)); float w = s >= 6.0 ? 1.0 : smoothstep(0.0, 1.0, fract(s));
  float d = mix(shape(i, p), shape(i + 1, p), w);
  d += (0.03 + 0.2 * sin(3.14159 * w) + uE * 0.16 + uVel * 0.06) * wob(p * 2.1);
  return d - bulge;
}
vec3 nrm(vec3 p){ vec2 e = vec2(0.0025, -0.0025);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
void main(){
  vec2 uv = (gl_FragCoord.xy - uC) / uR;
  float r = length(uv);
  vec3 ro = vec3(0.0, 0.0, 3.2), rd = normalize(vec3(uv, -2.9));
  float halo = exp(-max(r - 0.85, 0.0) * 2.2) * (0.07 + uE * 0.12) * (1.0 - uLight * 0.7);
  vec3 hc = mix(uA, uB, 0.5 + 0.5 * sin(uT * 0.4 + uv.y * 1.5));
  float b = dot(ro, rd), c = dot(ro, ro) - 3.1, h = b * b - c;
  if (h < 0.0) { gl_FragColor = vec4(hc * halo, halo); return; }
  float t = -b - sqrt(h), tmax = -b + sqrt(h), glow = 0.0; bool hit = false; vec3 p;
  for (int i = 0; i < ${steps}; i++) { p = ro + rd * t; float d = map(p); glow += exp(-d * 9.0) * 0.018;
    if (d < 0.002) { hit = true; break; } t += d * 0.72; if (t > tmax) break; }
  if (!hit) { float a = halo + glow * (0.5 - uLight * 0.3); gl_FragColor = vec4(hc * a, a); return; }
  vec3 n = nrm(p), rf = reflect(rd, n);
  float fr = pow(1.0 - max(dot(n, -rd), 0.0), 2.6);
  vec3 l1 = normalize(vec3(-0.6, 0.75, 0.55)), l2 = normalize(vec3(0.85, -0.25, 0.45));
  vec3 irid = 0.5 + 0.5 * cos(6.2831 * (fr * 0.75 + n.y * 0.22 + uT * 0.04 + vec3(0.0, 0.33, 0.67)));
  vec3 env = mix(uInk * 0.6, mix(uB, uA, 0.6) * 0.55, smoothstep(-0.4, 1.0, rf.y));
  vec3 col = uInk * (0.18 + 0.32 * max(dot(n, l1), 0.0)) + env * 0.55
    + uA * pow(max(dot(rf, l1), 0.0), 28.0) * 1.5 + uB * pow(max(dot(rf, l2), 0.0), 14.0) * 0.9
    + irid * fr * 0.75 + uA * fr * 0.2;
  col *= 1.0 + uE * 0.35;
  gl_FragColor = vec4(col, 1.0);
}`;

  const start = () => {
    const small = Math.min(innerWidth, innerHeight) < 700;
    const canvas = document.createElement('canvas'); canvas.id = 'fx'; canvas.setAttribute('aria-hidden', 'true'); document.body.prepend(canvas);
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    if (!gl) { canvas.remove(); return; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS(small ? 56 : 80));
    if (!vs || !fs) { canvas.remove(); return; }
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uC', 'uMP', 'uR', 'uT', 'uS', 'uVel', 'uE', 'uBeat', 'uLight', 'uRot', 'uA', 'uB', 'uInk'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

    // ---------- theme ----------
    const hex = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
    let light = false;
    const applyTheme = () => {
      light = root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
      gl.uniform3fv(U.uA, hex(light ? 0xc27a10 : 0xf0a830)); gl.uniform3fv(U.uB, hex(light ? 0x6a55e0 : 0x9c8cff));
      gl.uniform3fv(U.uInk, hex(light ? 0x1d3a3e : 0x16363a)); gl.uniform1f(U.uLight, light ? 1 : 0);
    };

    // ---------- caption + live log ----------
    const cap = document.createElement('div'); cap.setAttribute('aria-hidden', 'true');
    cap.style.cssText = 'position:fixed;z-index:-1;pointer-events:none;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);text-align:center;transition:opacity .5s ease,transform .5s ease;white-space:nowrap';
    document.body.appendChild(cap);
    const log = document.createElement('div'); log.className = 'agent-log'; log.setAttribute('aria-hidden', 'true');
    log.innerHTML = '<div class="al-head"><i></i><span>PALOAN · live</span></div><div class="al-lines"></div>'; document.body.appendChild(log);
    const head = log.querySelector('.al-head span'), lineBox = log.querySelector('.al-lines'); let hideT;
    const wake = ms => { log.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(() => log.classList.remove('on'), ms || 3400); };
    const say = (txt, done) => { if (innerWidth < 900) return; wake(4200); const el = document.createElement('div'); el.className = 'al-line'; el.innerHTML = '<span class="al-t"></span><b>…</b>'; lineBox.appendChild(el);
      while (lineBox.children.length > 4) lineBox.firstChild.remove(); const sp = el.firstChild; let i = 0; (function ty() { sp.textContent = '› ' + txt.slice(0, i); if (i++ < txt.length) setTimeout(ty, 14); else setTimeout(() => { el.lastChild.textContent = '✓'; wake(); done && done(); }, 380); })(); };

    // ---------- input ----------
    let energy = 0, mpx = 9, mpy = 9, tmx = 9, tmy = 9, rotX = 0, rotY = 0;
    addEventListener('pointermove', e => { tmx = e.clientX; tmy = e.clientY; }, { passive: true });
    addEventListener('paloan:ask', e => { energy = 1; const q = (e.detail && e.detail.q) || '';
      head.textContent = 'PALOAN · reading your question'; say('listen("' + q.slice(0, 24) + (q.length > 24 ? '…' : '') + '")', () => say('shape(answer) → chat ✦')); });

    // ---------- layout ----------
    let W, H, scale, cx, cy, R, anchors = [], covers = [];
    const measure = () => {
      W = innerWidth; H = innerHeight; scale = Math.min(devicePixelRatio || 1, 1.5) * (W >= 900 ? 0.62 : 0.55);
      canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale); gl.viewport(0, 0, canvas.width, canvas.height);
      const desk = W >= 900; cx = desk ? W * 0.76 : W * 0.5; cy = desk ? H * 0.5 : H * 0.56; R = desk ? Math.min(W * 0.15, H * 0.27) : Math.min(W * 0.33, H * 0.22);
      canvas.style.opacity = desk ? 1 : (light ? 0.42 : 0.5);
      cap.style.left = (cx - 160) + 'px'; cap.style.width = '320px'; cap.style.top = (cy + R * 1.55) + 'px'; cap.style.display = desk ? '' : 'none';
      const abs = el => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.height]; };
      anchors = STAGES.map(L => { const el = document.getElementById(L.id); if (!el) return null; const [t, h] = abs(el); return t + Math.min(h, H * 2) / 2; });
      covers = ['portrait', 'reel', 'bts'].map(id => document.getElementById(id)).filter(Boolean).map(el => { const [t, h] = abs(el); return [t, t + h - H]; });
    };
    applyTheme(); measure();
    new MutationObserver(() => { applyTheme(); measure(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { applyTheme(); measure(); }); } catch (e) {}
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 150); });
    setInterval(measure, 4000);

    // ---------- loop ----------
    let lastY = scrollY, vel = 0, S = 0, shown = -1, running = true, wasCovered = false, last = performance.now(), T = 0, intro = 0;
    const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), smooth = x => x * x * (3 - 2 * x);
    const frame = now => {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; intro += dt;
      const y = scrollY, dy = y - lastY; lastY = y;
      vel += ((Math.abs(dy) / Math.max(dt, 0.008)) / 2400 - vel) * Math.min(1, dt * 5); vel = clamp(vel);
      if (covers.some(([a, b]) => y > a + 4 && y < b - 4)) { if (!wasCovered) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); cap.style.opacity = 0; wasCovered = true; } return; }
      wasCovered = false;
      // scroll → continuous stage value (morph scrubs with the page)
      const c = y + H / 2; let i = 0; while (i < anchors.length - 1 && anchors[i + 1] != null && c > anchors[i + 1]) i++;
      const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)];
      const f = b > a ? clamp((c - a) / (b - a)) : 0, target = i + smooth(clamp((f - 0.2) / 0.6));
      S += (target - S) * Math.min(1, dt * 4);
      const st = clamp(Math.round(S), 0, STAGES.length - 1);
      if (st !== shown) { shown = st; head.textContent = 'PALOAN · ' + String(st + 1).padStart(2, '0') + ' · ' + STAGES[st].k;
        cap.innerHTML = '<span style="color:var(--marigold)">' + String(st + 1).padStart(2, '0') + ' / 07 · ' + STAGES[st].k + '</span><br><span style="letter-spacing:.06em;text-transform:none">' + STAGES[st].s + '</span>';
        const lines = STEPS[st]; let k = 0; const nx = () => { if (k < lines.length) say(lines[k++], nx); }; nx(); }
      cap.style.opacity = clamp(1 - Math.abs(S - st) * 2.6) * 0.9; cap.style.transform = 'translateY(' + (Math.abs(S - st) * 14) + 'px)';
      // pointer in object space (eased)
      const ox = W >= 900 ? W * 0.07 * clamp(1 - S) : 0, cxN = cx + ox;
      mpx += ((tmx - cxN) / R - mpx) * Math.min(1, dt * 5); mpy += (-(tmy - cy) / R - mpy) * Math.min(1, dt * 5);
      energy = Math.max(0, energy - dt * 0.55);
      const beat = Math.pow(0.5 + 0.5 * Math.sin(T * 4.4), 6);
      // rotation: idle spin + scroll-scrubbed turn + pointer tilt
      rotY += ((T * 0.28 + S * 1.35 + clamp(mpx, -2, 2) * 0.25) - rotY) * Math.min(1, dt * 3);
      rotX += ((Math.sin(T * 0.35) * 0.22 - clamp(mpy, -2, 2) * 0.18 + (st === 4 ? -0.6 : st === 5 ? -0.35 : 0)) - rotX) * Math.min(1, dt * 3);
      const cY = Math.cos(rotY), sY = Math.sin(rotY), cX = Math.cos(rotX), sX = Math.sin(rotX);
      gl.uniformMatrix3fv(U.uRot, false, [cY, sX * sY, -cX * sY, 0, cX, sX, sY, -sX * cY, cX * cY]);
      const bob = Math.sin(T * 0.9) * R * 0.04, popIn = smooth(clamp(intro / 1.6));
      gl.uniform2f(U.uC, cxN * scale, (H - cy + bob) * scale); gl.uniform1f(U.uR, R * scale * (0.6 + 0.4 * popIn) * (1 - 0.15 * clamp(1 - S)));
      gl.uniform2f(U.uMP, clamp(mpx, -4, 4), clamp(mpy, -4, 4));
      gl.uniform1f(U.uT, T); gl.uniform1f(U.uS, S); gl.uniform1f(U.uVel, vel); gl.uniform1f(U.uE, energy + (1 - popIn) * 0.8); gl.uniform1f(U.uBeat, st === 5 || st === 6 ? beat : 0);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
    requestAnimationFrame(t => { canvas.classList.add('on'); last = t; frame(t); });
  };

  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 400));
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
