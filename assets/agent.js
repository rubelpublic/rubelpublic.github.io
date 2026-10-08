// "Paloan at work": a live 3D view of the AI agent's mind running behind the portfolio.
// Each scene gives the agent a task; tools light up as signals travel from the core and back,
// and a live log types every step. Asking Paloan in the chat makes the whole network react.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const TOOLS = ['memory', 'search', 'bangla.nlp', 'intent', 'plan', 'draft', 'design', 'automate', 'web.build', 'analytics', 'schedule', 'publish', 'crm', 'vision'];
  const TASKS = {
    opening:   [['memory', 'memory.load("rapar-rubel")'], ['bangla.nlp', 'lang.detect → bn · banglish · en'], ['plan', 'agent.ready() — scroll to brief me']],
    manifesto: [['search', 'story.read(7 industries)'], ['intent', 'pattern.find("need → system")'], ['memory', 'memory.write("same instinct")']],
    services:  [['plan', 'offer.plan(strategy)'], ['automate', 'agents.spawn(workflow)'], ['web.build', 'product.ship()'], ['design', 'brand.system()']],
    approach:  [['search', 'comments.read(audience)'], ['intent', 'fear.decode()'], ['bangla.nlp', 'caption.draft(banglish)'], ['analytics', 'ab.test → keep the winner']],
    projects:  [['memory', 'projects.index(9)'], ['vision', 'thumbnails.render()'], ['crm', 'clients.link()']],
    course:    [['plan', 'curriculum.build(10 classes)'], ['draft', 'lesson.write(bangla)'], ['schedule', 'cohort.schedule()']],
    bts:       [['vision', 'faces.recognise(6)'], ['memory', 'remember("knowledge can change")']],
    faq:       [['search', 'faq.lookup(11)'], ['draft', 'answer.compose()']],
    contact:   [['crm', 'inbox.open()'], ['schedule', 'slot.find(GMT+6)'], ['publish', 'reply.ready → ask Paloan ↘']],
  };
  const INTENT_TOOL = { content: 'bangla.nlp', ai: 'automate', course: 'plan', project: 'search', service: 'plan', price: 'analytics', cv: 'publish',
    contact: 'crm', facebook: 'web.build', where: 'search', who: 'memory', paloan: 'intent', same: 'memory', hi: 'intent', thank: 'publish' };

  const start = () => {
    const cv = document.createElement('canvas');
    cv.id = 'fx'; cv.setAttribute('aria-hidden', 'true');
    const ctx = cv.getContext('2d');
    document.body.prepend(cv);

    // live agent log (desktop)
    const log = document.createElement('div');
    log.className = 'agent-log'; log.setAttribute('aria-hidden', 'true');
    log.innerHTML = '<div class="al-head"><i></i>PALOAN · live</div><div class="al-lines"></div>';
    document.body.appendChild(log);
    const lines = log.querySelector('.al-lines');

    // ---------- graph in 3D ----------
    const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const nodes = [{ id: 'core', kind: 'core', x: 0, y: 0, z: 0, heat: 0 }];
    const ga = Math.PI * (3 - Math.sqrt(5));
    TOOLS.forEach((t, i) => { const y = 1 - (i + 0.5) / TOOLS.length * 2, r = Math.sqrt(1 - y * y), th = ga * i * 1.0;
      nodes.push({ id: t, kind: 'tool', x: Math.cos(th) * r, y: y * 0.85, z: Math.sin(th) * r, heat: 0 }); });
    for (let i = 0; i < 46; i++) { const th = rnd() * 6.283, ph = Math.acos(2 * rnd() - 1), rr = 0.45 + rnd() * 0.75;
      nodes.push({ id: 'n' + i, kind: 'neuron', x: Math.sin(ph) * Math.cos(th) * rr, y: Math.cos(ph) * rr * 0.85, z: Math.sin(ph) * Math.sin(th) * rr, heat: 0 }); }
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const edges = [], key = new Set();
    const link = (a, b) => { const k = a < b ? a + '|' + b : b + '|' + a; if (a !== b && !key.has(k)) { key.add(k); edges.push([byId[a], byId[b]]); } };
    const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
    TOOLS.forEach(t => link('core', t));
    nodes.filter(n => n.kind !== 'core').forEach(n => nodes.filter(m => m !== n && m.kind !== 'core').sort((a, b) => d2(n, a) - d2(n, b)).slice(0, n.kind === 'tool' ? 2 : 2).forEach(m => link(n.id, m.id)));
    const edgeOf = (a, b) => edges.find(e => (e[0].id === a && e[1].id === b) || (e[0].id === b && e[1].id === a));

    // ---------- sprites (glow drawn once, reused) ----------
    const sprite = (r, stops) => { const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d'); const gr = g.createRadialGradient(r, r, 0, r, r, r);
      stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c; };
    let S = {};
    const theme = () => {
      const light = root.dataset.theme ? root.dataset.theme === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
      const A = light ? '149,87,0' : '240,168,48', B = light ? '95,75,200' : '156,140,255', T = light ? '21,33,31' : '237,230,216';
      S = { light, A, B, T,
        glowA: sprite(24, [[0, `rgba(${A},.95)`], [0.25, `rgba(${A},.45)`], [1, `rgba(${A},0)`]]),
        glowB: sprite(24, [[0, `rgba(${B},.95)`], [0.25, `rgba(${B},.45)`], [1, `rgba(${B},0)`]]),
        core: sprite(90, [[0, `rgba(255,255,255,${light ? .0 : .9})`], [0.12, `rgba(${B},.85)`], [0.4, `rgba(${B},.25)`], [1, `rgba(${B},0)`]]) };
    };
    theme();
    new MutationObserver(theme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', theme); } catch (e) {}

    // ---------- layout ----------
    let W, H, dpr, cx, cy, R, alpha, desk;
    const anchors = [], covers = [];
    const measure = () => {
      W = innerWidth; H = innerHeight; desk = W >= 900; dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (desk) { cx = W * 0.77; cy = H * 0.55; R = Math.min(W * 0.2, H * 0.36); alpha = 1; }
      else { cx = W * 0.5; cy = H * 0.7; R = Math.min(W * 0.38, H * 0.24); alpha = 0.55; }
      anchors.length = 0; covers.length = 0;
      const abs = el => { const r = el.getBoundingClientRect(); return [r.top + scrollY, r.height]; };
      Object.keys(TASKS).forEach(id => { const el = document.getElementById(id); if (el) { const [t, h] = abs(el); anchors.push({ id, top: t, bottom: t + h }); } });
      ['portrait', 'reel'].forEach(id => { const el = document.getElementById(id); if (el) { const [t, h] = abs(el); covers.push([t, t + h - H]); } });
    };
    measure();
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 150); });
    setInterval(measure, 4000);

    // ---------- agent behaviour ----------
    const pulses = []; // {a,b,t,dur,col,cb}
    const fire = (a, b, dur, col, cb) => { const na = typeof a === 'string' ? byId[a] : a, nb = typeof b === 'string' ? byId[b] : b; pulses.push({ a: na, b: nb, t: 0, dur, col, cb }); };
    let hideT;
    const wake = (ms) => { log.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(() => log.classList.remove('on'), ms || 3200); };
    const addLine = (txt, cls) => {
      if (!desk) return null;
      wake(4500);
      const el = document.createElement('div'); el.className = 'al-line ' + (cls || ''); el.innerHTML = '<span class="al-t"></span><b>…</b>';
      lines.appendChild(el); while (lines.children.length > 5) lines.firstChild.remove();
      const span = el.firstChild; let i = 0; const type = () => { span.textContent = '› ' + txt.slice(0, i); if (i++ < txt.length) setTimeout(type, 14); }; type();
      return el;
    };
    let queue = [], busy = false, taskId = '';
    const runQueue = () => {
      if (busy || !queue.length) return;
      busy = true; const [tool, text, col] = queue.shift(); const n = byId[tool] || byId.memory; const line = addLine(text);
      byId.core.heat = 1;
      fire('core', n, 520, col || 'A', () => { n.heat = 1;
        for (let k = 0; k < 3; k++) { const nb = edges.filter(e => e[0] === n || e[1] === n).map(e => e[0] === n ? e[1] : e[0]); const m = nb[(Math.random() * nb.length) | 0]; if (m) fire(n, m, 380 + k * 120, 'B'); }
        setTimeout(() => fire(n, 'core', 480, 'B', () => { if (line) { line.querySelector('b').textContent = '✓'; wake(); } busy = false; setTimeout(runQueue, 160); }), 260); });
    };
    const runTask = id => { if (!TASKS[id] || id === taskId) return; taskId = id; queue = TASKS[id].map(([t, s]) => [t, s]); runQueue(); };

    // the chat tells the agent what it is doing
    addEventListener('paloan:ask', e => {
      const intent = (e.detail && e.detail.intent) || 'unknown';
      log.classList.add('hot'); setTimeout(() => log.classList.remove('hot'), 2600);
      queue = [['intent', 'classify(question) → ' + intent, 'B'], ['memory', 'recall(portfolio notes)'], [INTENT_TOOL[intent] || 'search', 'tool.call(' + (INTENT_TOOL[intent] || 'search') + ')'], ['publish', 'answer → chat ✦', 'B']];
      busy = false; runQueue();
    });

    // ---------- pointer tilt ----------
    let tx = 0, ty = 0, ttx = 0, tty = 0;
    addEventListener('pointermove', e => { ttx = (e.clientX / W - 0.5) * 0.6; tty = (e.clientY / H - 0.5) * 0.4; }, { passive: true });

    // ---------- render ----------
    let rot = 0, last = performance.now(), running = true, idleT = 0, lastSection = '';
    const P = new Map();
    const project = n => { const c = Math.cos(rot + tx), s = Math.sin(rot + tx), ct = Math.cos(0.32 + ty), st = Math.sin(0.32 + ty);
      let x = n.x * c - n.z * s, z = n.x * s + n.z * c, y = n.y * ct - z * st; z = n.y * st + z * ct;
      const f = 3 / (3 + z); return { x: cx + x * R * f, y: cy + y * R * f, f, z }; };
    const frame = now => {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const y = scrollY;
      // which scene is on screen → give the agent that task
      const mid = y + H * 0.5; const sec = anchors.find(a => mid >= a.top && mid < a.bottom);
      if (sec && sec.id !== lastSection) { lastSection = sec.id; runTask(sec.id); }
      if (covers.some(([a, b]) => y > a + 4 && y < b - 4)) { ctx.clearRect(0, 0, W, H); return; }
      rot += dt * 0.16; tx += (ttx - tx) * 0.05; ty += (tty - ty) * 0.05;
      // ambient thinking: tiny signals between neurons
      idleT -= dt; if (idleT <= 0) { idleT = 0.12 + Math.random() * 0.2; const e = edges[(Math.random() * edges.length) | 0]; fire(e[0], e[1], 700 + Math.random() * 600, 'dim'); }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = S.light ? 'source-over' : 'lighter';
      nodes.forEach(n => { P.set(n, project(n)); n.heat = Math.max(0, n.heat - dt * 0.9); });
      // edges: one batched stroke for the base web, brighter strokes for active ones
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${S.T},${(S.light ? 0.16 : 0.14) * alpha})`; ctx.beginPath();
      edges.forEach(([a, b]) => { const pa = P.get(a), pb = P.get(b); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); }); ctx.stroke();
      // pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += (dt * 1000) / p.dur;
        const pa = P.get(p.a), pb = P.get(p.b), t = Math.min(1, p.t), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const x = pa.x + (pb.x - pa.x) * e, yy = pa.y + (pb.y - pa.y) * e;
        if (p.col !== 'dim') { ctx.strokeStyle = `rgba(${p.col === 'A' ? S.A : S.B},${0.55 * alpha})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(x, yy); ctx.stroke(); }
        const g = p.col === 'A' ? S.glowA : S.glowB, sz = p.col === 'dim' ? 10 : 26;
        ctx.globalAlpha = (p.col === 'dim' ? 0.35 : 1) * alpha; ctx.drawImage(g, x - sz / 2, yy - sz / 2, sz, sz); ctx.globalAlpha = 1;
        if (p.t >= 1) { pulses.splice(i, 1); if (p.cb) p.cb(); }
      }
      // nodes (far → near)
      const order = nodes.slice().sort((a, b) => P.get(b).z - P.get(a).z);
      ctx.textAlign = 'center'; ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
      order.forEach(n => {
        const p = P.get(n), depth = 0.45 + 0.55 * (1 - (p.z + 1.2) / 2.4);
        if (n.kind === 'neuron') { ctx.fillStyle = `rgba(${S.T},${0.35 * depth * alpha})`; ctx.fillRect(p.x - 1, p.y - 1, 2.2 * p.f, 2.2 * p.f); return; }
        if (n.kind === 'core') { const s = (110 + Math.sin(performance.now() / 600) * 8 + n.heat * 30) * (desk ? 1 : 0.7);
          ctx.globalAlpha = alpha * (S.light ? 0.75 : 1); ctx.drawImage(S.core, p.x - s / 2, p.y - s / 2, s, s); ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(${S.light ? '255,255,255' : '255,255,255'},${0.95 * alpha})`; ctx.font = '700 10px "JetBrains Mono", ui-monospace, monospace';
          ctx.fillText('PALOAN', p.x, p.y + 3.5); ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace'; return; }
        const hot = n.heat, rad = (3 + hot * 3) * p.f;
        if (hot > 0.02) { const s = 44 * hot * p.f + 14; ctx.globalAlpha = hot * alpha; ctx.drawImage(S.glowA, p.x - s / 2, p.y - s / 2, s, s); ctx.globalAlpha = 1;
          ctx.strokeStyle = `rgba(${S.A},${hot * 0.8 * alpha})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, rad + (1 - hot) * 18, 0, 6.283); ctx.stroke(); }
        ctx.fillStyle = hot > 0.02 ? `rgba(${S.A},${alpha})` : `rgba(${S.T},${0.7 * depth * alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.283); ctx.fill();
        if (desk || hot > 0.3) { ctx.fillStyle = hot > 0.02 ? `rgba(${S.A},${(0.6 + hot * 0.4) * alpha})` : `rgba(${S.T},${0.5 * depth * alpha})`; ctx.fillText(n.id, p.x, p.y - rad - 6); }
      });
      ctx.globalCompositeOperation = 'source-over';
    };
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });
    requestAnimationFrame(t => { cv.classList.add('on'); frame(t); });
  };

  if (reduced) return; // calm, static experience for reduced-motion users
  const go = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300));
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
