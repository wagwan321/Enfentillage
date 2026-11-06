/* ==========================================================================
   Christmas theme (active only when theme.js set html.theme-xmas)
   Snowfall, string lights, Christmas announcements and a countdown.
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  if (window.ENF_THEME !== 'christmas') return;
  const { icon } = window.ENF;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

  /* ---------- days until Christmas (Beirut time is close enough to the visitor's clock) ---------- */
  const now = new Date();
  let xmas = new Date(now.getFullYear(), 11, 25);
  if (now > new Date(now.getFullYear(), 11, 25, 23, 59)) xmas = new Date(now.getFullYear() + 1, 11, 25);
  const days = Math.ceil((xmas - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  const countdown = days <= 0 ? 'Merry Christmas!' : days === 1 ? '1 day until Christmas!' : `${days} days until Christmas`;

  /* ---------- announcements ---------- */
  const track = document.querySelector('.ticker__track');
  if (track) {
    const items = `
      <span class="ticker__item"><span class="ticker__dot" style="--c:#ffd54a"></span><b>${countdown}</b> — the Christmas gift shop is open</span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#7ddc84"></span><b>Free delivery</b> on orders above 50 $</span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#fff"></span>Save <b>12%</b> with Tillo’s code <b>TILLO12</b></span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#ffd54a"></span>Gift wrapping on request — tick <b>“wrap my gifts”</b> at checkout</span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#7ddc84"></span>Visit our store in <b>Mazraat Yachouh</b>, Chattat Center</span>`;
    track.innerHTML = items + items;
  }

  /* ---------- string lights under the header ---------- */
  const header = document.getElementById('header');
  if (header) {
    const lights = document.createElement('div');
    lights.className = 'xmas-lights';
    lights.setAttribute('aria-hidden', 'true');
    const n = Math.ceil(innerWidth / 46);
    lights.innerHTML = Array.from({ length: n }, (_, i) => `<i style="--i:${i % 5};--d:${(i * 0.37) % 2}s"></i>`).join('');
    header.appendChild(lights);
  }

  /* ---------- countdown chip on the homepage hero ---------- */
  const perks = document.getElementById('perks');
  if (perks) {
    perks.insertAdjacentHTML('beforebegin', `<div class="xmas-count reveal" data-from="up">
      <span class="xmas-count__tree" aria-hidden="true">🎄</span><b>${countdown}</b><span>Find gifts for every age in our Christmas shop.</span>
      <a class="btn btn--red btn--sm" href="index.html#gift-finder">Gift Finder</a></div>`);
    window.ENF.observeReveals();
  }

  document.title = document.title.replace('Enfantillage', 'Christmas at Enfantillage');

  /* ---------- snowfall ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'xmas-snow';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let flakes = [], W = 0, H = 0, raf = 0, last = 0;
  const DPR = Math.min(devicePixelRatio || 1, 2);

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(160, W / 9));
    flakes = Array.from({ length: count }, () => flake(true));
  }
  function flake(anywhere) {
    const r = Math.random() * 2.6 + 0.9;
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -10, r,
             vy: 0.35 + r * 0.32, sway: Math.random() * Math.PI * 2, swaySpeed: 0.005 + Math.random() * 0.012,
             a: 0.55 + Math.random() * 0.4 };
  }
  function draw(t) {
    const dt = Math.min(48, t - (last || t)) / 16.7; last = t;
    ctx.clearRect(0, 0, W, H);
    // a soft blue-grey glow keeps white flakes visible over the light, pastel sections
    ctx.shadowColor = 'rgba(60, 100, 140, .45)';
    ctx.shadowBlur = 3;
    for (const f of flakes) {
      f.sway += f.swaySpeed * dt;
      f.y += f.vy * dt;
      f.x += Math.sin(f.sway) * 0.45 * dt;
      if (f.y > H + 6) Object.assign(f, flake(false));
      ctx.globalAlpha = f.a;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  function start() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(draw); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, W, H); }

  let snowOn = store.get('enf_snow') !== 'off' && !reduce;
  resize();
  addEventListener('resize', () => { resize(); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : snowOn && start()));
  if (snowOn) start();

  /* on/off switch, bottom-right above the back-to-top balloon */
  const btn = document.createElement('button');
  btn.className = 'xmas-snow-toggle';
  btn.type = 'button';
  const label = () => { btn.innerHTML = `<span aria-hidden="true">❄</span> ${snowOn ? 'Snow on' : 'Snow off'}`; btn.setAttribute('aria-pressed', snowOn); btn.setAttribute('aria-label', snowOn ? 'Turn snow off' : 'Turn snow on'); };
  label();
  btn.addEventListener('click', () => {
    snowOn = !snowOn; store.set('enf_snow', snowOn ? 'on' : 'off'); label();
    snowOn ? start() : stop();
  });
  document.body.appendChild(btn);
});
