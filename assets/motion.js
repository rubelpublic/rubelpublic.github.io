// Motion layer for rubelpublic.github.io — light, transform-only, one rAF loop that sleeps when idle.
//  1. Hero reel: project screenshots flip inside the hero line.
//  2. Travelling logo: the header "rr" badge undocks, flies to the Brands band as a thick 3D badge, spins with
//     the scroll, then docks back into the header.
//  3. "Shipped." showcase: pinned horizontal gallery on desktop (swipe carousel on phones) with stamp pop-ins.
//  4. Guide: a tiny Rapar Rubel that changes pose and says a line for each section; click it to ask Paloan.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), smooth = x => x * x * (3 - 2 * x), lerp = (a, b, t) => a + (b - a) * t;
  let W = innerWidth, H = innerHeight;

  // ---------- 1. hero reel ----------
  const reel = $('.h-reel');
  if (reel && !reduce) {
    const imgs = $$('img', reel); let i = 0, vis = true;
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(reel);
    setInterval(() => { if (!vis || document.hidden) return;
      imgs[i].classList.remove('on'); imgs[i].classList.add('off'); const old = imgs[i];
      setTimeout(() => old.classList.remove('off'), 600);
      i = (i + 1) % imgs.length; imgs[i].classList.add('on'); }, 1500);
  }

  // ---------- 2. travelling logo ----------
  const home = $('.hud .home'), band = $('#brands'), fly = $('.rr-fly'), ghosts = $$('.rr-ghost');
  const flyOn = !!(home && band && fly) && !reduce;
  let big = 300, g = [{ x: 0, y: 0, s: 0 }, { x: 0, y: 0, s: 0 }], bandVisible = false, wasUndocked = false, hr = { left: 0, top: 0, width: 34, height: 34 }, bandTop = 0, bandH = 0;
  const lite = matchMedia('(pointer: coarse), (max-width: 760px)').matches; // phones/tablets: fewer layers, no ghost trail
  if (flyOn) new IntersectionObserver(([e]) => { bandVisible = e.isIntersecting; if (!bandVisible) dock(); kick(); }, { rootMargin: '100% 0px' }).observe(band);
  function dock() { if (!wasUndocked) return; wasUndocked = false; fly.style.opacity = 0; ghosts.forEach(x => x.style.opacity = 0); home.style.opacity = ''; }
  function measureBand() { if (!band) return; const r = band.getBoundingClientRect(); bandTop = r.top + scrollY; bandH = r.height; }
  function flyFrame() {
    const bc = bandTop - scrollY + bandH / 2, u = clamp(1 - Math.abs(bc - H * 0.5) / (H * 0.8)), e = smooth(clamp(u * 1.3));
    if (e < 0.012) { dock(); return; }
    if (!wasUndocked) { wasUndocked = true; home.style.opacity = 0; fly.style.opacity = 1; }
    const x = lerp(hr.left + hr.width / 2, W / 2, e), y = lerp(hr.top + hr.height / 2, bc, e), size = lerp(hr.height, big, e);
    const k = size / big, ry = (bc / H) * -420, rx = Math.sin(bc / H * 3) * 14 * e;
    fly.style.transform = `translate3d(${x - big / 2}px,${y - big / 2}px,0) scale(${k}) rotateX(${rx}deg) rotateY(${ry}deg)`;
    // ghost trail: lags behind and only shows while the badge is moving fast
    if (lite) return false;
    let px = x, py = y, ps = k;
    g.forEach((t, j) => { t.x += (px - t.x) * 0.32; t.y += (py - t.y) * 0.32; t.s += (ps - t.s) * 0.32;
      const sp = Math.hypot(px - t.x, py - t.y) + Math.abs(ps - t.s) * 300;
      ghosts[j].style.opacity = clamp(sp / 140) * (j ? 0.12 : 0.22);
      ghosts[j].style.transform = `translate3d(${t.x - big / 2}px,${t.y - big / 2}px,0) scale(${t.s}) rotateY(${ry + (j + 1) * 18}deg)`;
      px = t.x; py = t.y; ps = t.s; });
    return Math.abs(g[1].x - x) + Math.abs(g[1].y - y) > 0.5; // still settling
  }

  // ---------- 3. shipped showcase ----------
  const sh = $('#shipped'), track = sh && $('.sh-track', sh), cards = sh ? $$('.sh-card', sh) : [];
  let shTop = 0, shLen = 0, shPin = false, shVisible = false;
  function measureShipped() {
    if (!sh) return;
    shPin = W >= 900 && !reduce;
    if (!shPin) { sh.style.height = ''; track.style.transform = ''; return; }
    const dist = track.scrollWidth - W; sh.style.height = (dist + H) + 'px';
    shTop = sh.getBoundingClientRect().top + scrollY; shLen = dist;
  }
  if (sh) {
    new IntersectionObserver(([e]) => { shVisible = e.isIntersecting; kick(); }).observe(sh);
    // warm the showcase images shortly before it arrives, so mockups never pop in empty
    const warm = new IntersectionObserver(([e]) => { if (e.isIntersecting) { sh.querySelectorAll('img').forEach(i => { i.loading = 'eager'; }); warm.disconnect(); } }, { rootMargin: '200% 0px' });
    warm.observe(sh);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.45 });
    cards.forEach(c => io.observe(c));
  }
  function shFrame() { if (!shPin) return; const p = clamp((scrollY - shTop) / Math.max(1, shLen)); track.style.transform = `translate3d(${(-p * shLen).toFixed(1)}px,0,0)`; }

  // ---------- 4. guide character ----------
  const guide = $('#guide'), gImg = $('#g-img'), gBub = $('#g-bub');
  const POSE = {
    opening: ['welcome', 'Hi, I’m Rubel 👋 Scroll, I’ll show you around.'], brands: ['tea', 'Brands I’ve built and grown. Cha khaben? ☕'],
    portrait: ['proud', 'That’s me: Rubel Miah.'], manifesto: ['chat', 'Brands that talk the way customers talk.'],
    services: ['gears', 'This is what I build for businesses.'], paloan: ['robot', 'Meet Paloan, my AI agent.'],
    shipped: ['megaphone', 'These are live. Click one!'], projects: ['checklist', 'Every project, in one list.'],
    'hand-lab': ['down', 'Try this one with your hand ✋'], course: ['test', 'My AI course in Bangla. First 3 lessons free!'],
    bts: ['camera', 'Behind the camera.'], credits: ['cv', 'Roles I play.'], music: ['ukulele', 'Yes, I sing too 🎵'],
    thoughts: ['write', 'I write down how I think.'], faq: ['question', 'Quick answers, right here.'], contact: ['call', 'Let’s talk. Call or WhatsApp me.'],
  };
  const STEPS = [['listen', 'Step 1: I listen.'], ['decode', 'Step 2: I decode the real need.'], ['frame', 'Step 3: I frame the idea.'], ['design', 'Step 4: Create.'], ['test', 'Step 5: Test, keep the winner.']];
  const PANELS = { 'p-shop': ['shop', 'Proyojon Shop: China to Bangladesh.'], 'p-ab': ['fashion', 'The AB Wardrobe: kurtis, sold in Banglish.'],
    'p-vromon': ['travel', 'Proyojon Vromon: travel, hotels, tickets.'], 'p-abashon': ['property', 'Proyojon Abashon: property, built on trust.'],
    'p-mimai': ['chip', 'MimAI finds your files in any language.'], 'p-prozukti': ['design', 'Proyojon Prozukti: digital products.'],
    'p-solutions': ['meeting', 'Proyojon Solutions: advice with an AI intake.'], 'p-gaan': ['ukulele', 'Gaan Banai: making songs with AI.'] };
  const secs = guide ? Object.keys(POSE).concat(['approach', 'reel']).map(id => document.getElementById(id)).filter(Boolean) : [];
  const panels = $$('#reel .panel');
  let cur = '', bubT, swapT, active = null, activePanel = null, poseDirty = true;
  const inLine = new Set();
  if (guide) {
    // a 1px line at 45% of the viewport: whichever section crosses it is the active one
    const sio = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? inLine.add(e.target) : inLine.delete(e.target));
      active = [...inLine].sort((a, b) => (a.compareDocumentPosition(b) & 4) ? 1 : -1)[0] || active; poseDirty = true; kick(); }, { rootMargin: '-45% 0px -54.9% 0px' });
    secs.forEach(x => sio.observe(x));
    // a vertical line at the middle of the screen picks the Work panel in view
    const pio = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) activePanel = e.target; }); poseDirty = true; kick(); }, { rootMargin: '0px -49.9% 0px -49.9%' });
    panels.forEach(x => pio.observe(x));
  }
  function poseFor() {
    const best = active;
    if (!best) return POSE.opening;
    if (best.id === 'approach') { const ol = best.querySelector('ol.steps'), r = (ol || best).getBoundingClientRect(), p = clamp((H * 0.72 - r.top) / Math.max(1, r.height + H * 0.3));
      return STEPS[Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))]; }
    if (best.id === 'reel' && panels.length) { const pick = activePanel || panels[0];
      const key = [...pick.classList].find(c => PANELS[c]); return PANELS[key] || POSE.opening; }
    return POSE[best.id] || POSE.opening;
  }
  function setPose([name, line]) {
    if (name + line === cur) return; cur = name + line;
    const src = 'assets/me/' + name + '.webp';
    const go = () => {
      guide.classList.remove('pop'); guide.classList.add('swap');
      clearTimeout(swapT); swapT = setTimeout(() => { gImg.src = src; guide.classList.remove('swap'); requestAnimationFrame(() => requestAnimationFrame(() => guide.classList.add('pop'))); }, reduce ? 0 : 160);
      gBub.textContent = line; guide.classList.add('talk'); clearTimeout(bubT); bubT = setTimeout(() => guide.classList.remove('talk'), 3200);
    };
    const pre = new Image(); pre.onload = pre.onerror = go; pre.src = src;
  }
  if (guide) {
    guide.addEventListener('click', () => { const fab = $('#pa-fab'); fab && fab.click(); });
    const panel = $('#pa-panel');
    if (panel) new MutationObserver(() => guide.classList.toggle('away', !panel.hidden)).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    setTimeout(() => guide.classList.add('ready'), 900);
  }

  // ---------- loop: runs only while something needs it ----------
  let raf = 0, lastPoseCheck = 0;
  function frame(now) {
    raf = 0; let again = false, pose = null;
    if (guide && (poseDirty || now - lastPoseCheck > 150)) { poseDirty = false; lastPoseCheck = now; pose = poseFor(); } // at most one read (Approach step)
    if (flyOn && bandVisible) again = flyFrame() || again;                              // one read, then writes
    if (sh && shVisible) shFrame();                                                     // writes
    if (pose) setPose(pose);                                                            // writes
    if (again) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  addEventListener('scroll', kick, { passive: true });
  function measure() { W = innerWidth; H = innerHeight; big = Math.round(Math.min(H * 0.46, W * 0.5));
    if (home) { const r = home.getBoundingClientRect(); hr = { left: r.left, top: r.top, width: r.width, height: r.height }; }
    if (fly) { fly.style.width = fly.style.height = big + 'px'; fly.style.setProperty('--d', (big * 0.011).toFixed(2) + 'px'); ghosts.forEach(x => { x.style.width = x.style.height = big + 'px'; }); }
    measureBand(); measureShipped(); kick(); }
  setInterval(() => { if (!document.hidden) { measureBand(); if (shPin) measureShipped(); } }, 3000); // layout above can change (lazy content)
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(measure, 150); });
  addEventListener('load', measure);
  measure();
})();
