/* ==========================================================================
   Christmas theme (only when theme.js set html.theme-xmas)
   Draped lights, baubles, trees with a star, Santa's sleigh and reindeer,
   a snowy night scene, a snowman, presents and stronger snowfall.
   All artwork is inline SVG so it stays light and animates with CSS.
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  if (window.ENF_THEME !== 'christmas') return;
  const { tillo } = window.ENF;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } } };
  const BULBS = ['#ff3b4e', '#ffd54a', '#3ddc6a', '#4aa8ff', '#ff6ac1'];

  /* ======================= artwork ======================= */
  const TREE = (cls = '') => `
    <svg class="xtree ${cls}" viewBox="0 0 120 170" aria-hidden="true">
      <ellipse cx="60" cy="163" rx="46" ry="6" fill="#0b2a4a" opacity=".18"/>
      <rect x="52" y="140" width="16" height="22" rx="3" fill="#7a4a24"/>
      <path d="M60 78 L112 142 Q60 155 8 142 Z" fill="#14632d"/>
      <path d="M8 142 Q60 155 112 142 L108 137 Q60 149 12 137 Z" fill="#fff" opacity=".92"/>
      <path d="M60 46 L102 98 Q60 109 18 98 Z" fill="#1a7a37"/>
      <path d="M18 98 Q60 109 102 98 L98 93 Q60 103 22 93 Z" fill="#fff" opacity=".92"/>
      <path d="M60 22 L92 62 Q60 71 28 62 Z" fill="#1f8a3e"/>
      <path d="M28 62 Q60 71 92 62 L89 58 Q60 66 31 58 Z" fill="#fff" opacity=".92"/>
      <path d="M34 80 Q62 93 90 77" stroke="#f2b705" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M22 117 Q60 134 100 112" stroke="#f2b705" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${[[44, 55], [61, 59], [77, 54], [34, 88], [51, 93], [70, 92], [88, 86], [22, 128], [41, 134], [61, 137], [81, 134], [99, 127]]
        .map(([x, y], i) => `<circle class="xb" cx="${x}" cy="${y}" r="3.4" fill="${BULBS[i % 5]}" style="--d:${(i * 0.29) % 1.6}s;--c:${BULBS[i % 5]}"/>`).join('')}
      <circle cx="47" cy="110" r="5.5" fill="#c8102e"/><circle cx="45" cy="108" r="1.6" fill="#fff" opacity=".7"/>
      <circle cx="78" cy="70" r="4.6" fill="#f2b705"/><circle cx="76" cy="68" r="1.3" fill="#fff" opacity=".7"/>
      <circle cx="85" cy="117" r="5" fill="#4aa8ff"/><circle cx="83" cy="115" r="1.4" fill="#fff" opacity=".7"/>
      <g class="xtree__star"><path d="M60 1 L65 13 L78 13 L67.5 21 L71.5 34 L60 26 L48.5 34 L52.5 21 L42 13 L55 13 Z" fill="#ffd54a" stroke="#f2a900" stroke-width="1.5" stroke-linejoin="round"/></g>
    </svg>`;

  const DEER = (x, rudolph) => `
    <g class="xs-deer" transform="translate(${x} 20)">
      <g class="xs-legs xs-legs--b"><path d="M10 40 L3 52 M15 41 L11 55" stroke="#6b4423" stroke-width="3.2" stroke-linecap="round"/></g>
      <g class="xs-legs xs-legs--f"><path d="M33 40 L41 52 M29 41 L32 55" stroke="#6b4423" stroke-width="3.2" stroke-linecap="round"/></g>
      <ellipse cx="22" cy="34" rx="20" ry="9.5" fill="#9a6337"/>
      <ellipse cx="22" cy="38.5" rx="13" ry="4" fill="#c99a6b"/>
      <circle cx="3" cy="31" r="3.4" fill="#efe0cc"/>
      <path d="M36 30 Q44 22 46 12" stroke="#9a6337" stroke-width="8.5" stroke-linecap="round" fill="none"/>
      <path d="M46 6 L41 -5 M41 -5 L36 -3 M41 -5 L43 -10 M51 5 L54 -5 M54 -5 L58 -6 M54 -5 L52 -10" stroke="#6b4423" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="50" cy="10" rx="8.5" ry="5.8" fill="#9a6337"/>
      <path d="M44 8 L39 5" stroke="#9a6337" stroke-width="3" stroke-linecap="round"/>
      <circle cx="51" cy="8" r="1.3" fill="#1b1b1b"/>
      <circle class="${rudolph ? 'xs-nose' : ''}" cx="58.5" cy="10.5" r="${rudolph ? 3.8 : 2.4}" fill="${rudolph ? '#ff2b3a' : '#3b2416'}"/>
      <path d="M33 27 Q38 31 41 25" stroke="#c8102e" stroke-width="2.4" fill="none"/>
      <circle cx="37" cy="29.5" r="2" fill="#f2b705"/>
    </g>`;

  const SLEIGH = (cls = '') => `
    <svg class="xsleigh ${cls}" viewBox="-6 -14 330 100" aria-hidden="true">
      <path d="M104 37 Q160 52 296 31" stroke="#7a3b1f" stroke-width="1.6" fill="none"/>
      ${DEER(132, false)}${DEER(186, false)}${DEER(240, true)}
      <g class="xs-sleigh">
        <path d="M18 36 Q12 8 34 6 Q52 6 47 36 Z" fill="#8b5a2b"/>
        <path d="M24 12 Q34 4 44 12" stroke="#6b4423" stroke-width="2" fill="none"/>
        <rect x="26" y="2" width="9" height="9" rx="1.5" fill="#3ddc6a"/><rect x="36" y="0" width="8" height="10" rx="1.5" fill="#4aa8ff"/>
        <circle cx="63" cy="40" r="16" fill="#c8102e"/>
        <rect x="47" y="42" width="32" height="5" fill="#1b1b1b"/><rect x="60" y="41" width="6" height="7" fill="#f2b705"/>
        <circle cx="65" cy="20" r="9" fill="#f5c9a5"/>
        <path d="M56 22 Q65 39 74 22 Q65 28 56 22 Z" fill="#fff"/>
        <path d="M56 16 Q63 2 77 7 L72 14 Z" fill="#c8102e"/><circle cx="78" cy="7" r="3.2" fill="#fff"/>
        <rect x="55" y="13.5" width="20" height="5" rx="2.5" fill="#fff"/>
        <circle cx="68" cy="19" r="1.2" fill="#1b1b1b"/>
        <g class="xs-arm"><path d="M75 35 L90 22" stroke="#c8102e" stroke-width="6.5" stroke-linecap="round"/><circle cx="91" cy="21" r="3.8" fill="#fff"/></g>
        <path d="M6 44 H96 Q109 44 107 29 L113 27 Q118 51 98 61 H22 Q6 61 6 44 Z" fill="#b30f27"/>
        <path d="M9 51 H100" stroke="#f2b705" stroke-width="3"/>
        <path d="M30 61 V73 M84 61 V73" stroke="#f2b705" stroke-width="3"/>
        <path d="M12 73 H100 Q115 73 113 62" stroke="#f2b705" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`;

  const SNOWMAN = (cls = '') => `
    <svg class="xsnowman ${cls}" viewBox="0 0 80 112" aria-hidden="true">
      <ellipse cx="40" cy="106" rx="28" ry="5" fill="#0b2a4a" opacity=".15"/>
      <g class="xsm-arm xsm-arm--l"><path d="M24 52 L6 42 M11 45 L7 49" stroke="#6b4423" stroke-width="2.6" stroke-linecap="round"/></g>
      <g class="xsm-arm xsm-arm--r"><path d="M56 52 L74 43 M69 45 L73 50" stroke="#6b4423" stroke-width="2.6" stroke-linecap="round"/></g>
      <circle cx="40" cy="83" r="22" fill="#fff" stroke="#d7e6f3" stroke-width="2"/>
      <circle cx="40" cy="51" r="16" fill="#fff" stroke="#d7e6f3" stroke-width="2"/>
      <circle cx="40" cy="27" r="12" fill="#fff" stroke="#d7e6f3" stroke-width="2"/>
      <circle cx="36" cy="24" r="1.7" fill="#1b1b1b"/><circle cx="44" cy="24" r="1.7" fill="#1b1b1b"/>
      <path d="M40 28 L53 30 L40 31.5 Z" fill="#f28c28"/>
      <path d="M35 33 Q40 36 45 33" stroke="#1b1b1b" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M27 38 Q40 44 53 38 L53 42 Q40 48 27 42 Z" fill="#c8102e"/><path d="M46 41 L50 56 L43 55 Z" fill="#c8102e"/>
      <circle cx="40" cy="48" r="1.9" fill="#333"/><circle cx="40" cy="55" r="1.9" fill="#333"/><circle cx="40" cy="78" r="2" fill="#333"/>
      <rect x="30" y="4" width="20" height="12" rx="2" fill="#1b1b1b"/><rect x="30" y="11" width="20" height="3" fill="#c8102e"/>
      <rect x="25" y="14.5" width="30" height="4" rx="2" fill="#1b1b1b"/>
    </svg>`;

  const GIFT = (box, ribbon, cls = '') => `
    <svg class="xgift ${cls}" viewBox="0 0 50 50" aria-hidden="true">
      <rect x="4" y="18" width="42" height="30" rx="3" fill="${box}"/>
      <rect x="2" y="12" width="46" height="9" rx="2" fill="${box}" style="filter:brightness(.88)"/>
      <rect x="21" y="12" width="8" height="36" fill="${ribbon}"/>
      <path d="M25 12 Q13 -1 11 7 Q11 14 25 12 Q37 -1 39 7 Q39 14 25 12 Z" fill="${ribbon}"/>
    </svg>`;

  const BAUBLE = (color, cls = '') => `
    <svg class="xbauble ${cls}" viewBox="0 0 30 46" aria-hidden="true">
      <path d="M15 0 V11" stroke="#c9a227" stroke-width="1.4"/>
      <rect x="10.5" y="10" width="9" height="6" rx="1.5" fill="#c9a227"/>
      <circle cx="15" cy="29" r="13" fill="${color}"/>
      <path d="M3 27 Q15 33 27 27" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55"/>
      <ellipse cx="10" cy="23" rx="3" ry="4.5" fill="#fff" opacity=".55" transform="rotate(-25 10 23)"/>
    </svg>`;

  const MINI_TREE = `<svg class="squiggle xmini-tree" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L16 8 H14 L18 13 H15 L19 19 H5 L9 13 H6 L10 8 H8 Z" fill="#1f8a3e"/><rect x="10.5" y="19" width="3" height="3" fill="#7a4a24"/><circle cx="12" cy="2.5" r="1.8" fill="#f2b705"/><circle cx="10" cy="11" r="1.1" fill="#ff3b4e"/><circle cx="14" cy="15" r="1.1" fill="#4aa8ff"/><circle cx="11" cy="16.5" r="1.1" fill="#ffd54a"/></svg>`;

  /* ======================= countdown ======================= */
  const now = new Date();
  let xmas = new Date(now.getFullYear(), 11, 25);
  if (now > new Date(now.getFullYear(), 11, 25, 23, 59)) xmas = new Date(now.getFullYear() + 1, 11, 25);
  const days = Math.ceil((xmas - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  const countdown = days <= 0 ? 'Merry Christmas!' : days === 1 ? '1 day until Christmas!' : `${days} days until Christmas`;

  /* ======================= announcements ======================= */
  const track = $('.ticker__track');
  if (track) {
    const items = `
      <span class="ticker__item"><span class="ticker__dot" style="--c:#ffd54a"></span><b>${countdown}</b> — the Christmas gift shop is open</span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#7ddc84"></span><b>Free delivery</b> on orders above 50 $</span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#fff"></span>Save <b>12%</b> with Tillo’s code <b>TILLO12</b></span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#ffd54a"></span>Gift wrapping on request — tick <b>“wrap my gifts”</b> at checkout</span>
      <span class="ticker__item"><span class="ticker__dot" style="--c:#7ddc84"></span>Visit our store in <b>Mazraat Yachouh</b>, Chattat Center</span>`;
    track.innerHTML = items + items;
  }
  document.title = document.title.replace('Enfantillage', 'Christmas at Enfantillage');

  /* ======================= header: draped lights, baubles, little tree ======================= */
  const header = $('#header');
  function drapeLights() {
    const old = header.querySelector('.xmas-drape'); if (old) old.remove();
    const W = innerWidth, swag = W < 760 ? 90 : 130, dip = W < 760 ? 12 : 16, n = Math.ceil(W / swag);
    let path = '', bulbs = '', k = 0;
    for (let i = 0; i < n; i++) {
      const x0 = i * swag, x1 = x0 + swag, cx = x0 + swag / 2;
      path += `M${x0} 2 Q${cx} ${dip * 2} ${x1} 2 `;
      for (const t of [0.2, 0.5, 0.8]) {
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * 2 + 2 * (1 - t) * t * (dip * 2) + t * t * 2;
        const c = BULBS[k % 5];
        bulbs += `<g class="xd-bulb" style="--c:${c};--d:${((k * 0.37) % 2).toFixed(2)}s" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect x="-2.4" y="-1" width="4.8" height="4" rx="1" fill="#3e4f45"/><ellipse cx="0" cy="8" rx="4.4" ry="6.4" fill="${c}"/><ellipse cx="-1.3" cy="6" rx="1.2" ry="2" fill="#fff" opacity=".6"/></g>`;
        k++;
      }
    }
    header.insertAdjacentHTML('beforeend', `<svg class="xmas-drape" width="${W}" height="${dip + 22}" viewBox="0 0 ${W} ${dip + 22}" aria-hidden="true"><path d="${path}" stroke="#2d4a3b" stroke-width="2" fill="none" opacity=".75"/>${bulbs}</svg>`);
  }
  if (header) {
    drapeLights();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drapeLights, 200); });
    header.insertAdjacentHTML('beforeend', `<div class="xmas-baubles" aria-hidden="true">
      ${[['#c8102e', 12], ['#f2b705', 30], ['#1f8a3e', 52], ['#4aa8ff', 74], ['#d6336c', 90]].map(([c, x], i) =>
        `<span style="left:${x}%;--len:${18 + (i % 3) * 10}px;--d:${i * 0.4}s">${BAUBLE(c)}</span>`).join('')}</div>`);
    const logo = header.querySelector('.logo');
    if (logo) logo.insertAdjacentHTML('afterend', `<span class="header-tree" aria-hidden="true">${TREE()}</span>`);
  }

  /* ======================= page decorations (after page scripts render) ======================= */
  setTimeout(() => {
    // section titles get a little tree instead of the squiggle
    document.querySelectorAll('.section__title .squiggle').forEach(s => { s.outerHTML = MINI_TREE; });

    // age tiles: balloons become Christmas baubles
    const baubleColors = ['#c8102e', '#f2b705', '#1f8a3e', '#4aa8ff', '#d6336c', '#ffffff'];
    document.querySelectorAll('.age-tile__balloon').forEach((b, i) => { b.innerHTML = BAUBLE(baubleColors[i % 6], 'xbauble--tile'); });

    // homepage: the Christmas night scene right after the hero
    const hero = $('.hero');
    if (hero && !$('.xscene')) {
      const stars = Array.from({ length: 46 }, () =>
        `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 62).toFixed(1)}%;--s:${(1 + Math.random() * 2.2).toFixed(1)}px;--d:${(Math.random() * 3).toFixed(2)}s"></i>`).join('');
      hero.insertAdjacentHTML('afterend', `
        <section class="xscene" aria-label="Christmas at Enfantillage">
          <div class="xscene__sky" aria-hidden="true">${stars}<span class="xscene__moon"></span><span class="xscene__shoot"></span></div>
          <div class="xscene__fly" aria-hidden="true">${SLEIGH()}</div>
          <div class="wrap xscene__content">
            <span class="xscene__kicker">🎄 ${countdown}</span>
            <h2>Christmas at <em>Enfantillage</em></h2>
            <p>Trees are up, the lights are on and Santa’s sleigh is loading. Find the perfect gift for every child on your list.</p>
            <div class="xscene__cta">
              <a class="btn btn--red" href="index.html#gift-finder">Find a Christmas gift</a>
              <a class="btn btn--white" href="shop.html?max=25">Stocking fillers</a>
            </div>
          </div>
          <div class="xscene__ground" aria-hidden="true">
            <svg class="xscene__hills" viewBox="0 0 1440 160" preserveAspectRatio="none"><path d="M0 70 Q200 10 420 60 T840 50 T1260 40 T1440 60 V160 H0 Z" fill="#dbe9f6"/><path d="M0 105 Q240 60 520 98 T1020 92 T1440 84 V160 H0 Z" fill="#fff"/></svg>
            ${TREE('xscene__tree xscene__tree--1')}${TREE('xscene__tree xscene__tree--2')}${TREE('xscene__tree xscene__tree--3')}
            ${TREE('xscene__tree xscene__tree--4')}${TREE('xscene__tree xscene__tree--5')}
            ${SNOWMAN('xscene__snowman')}
            <span class="xscene__gifts">${GIFT('#c8102e', '#f2b705', 'g1')}${GIFT('#1f8a3e', '#fff', 'g2')}${GIFT('#4aa8ff', '#ff6ac1', 'g3')}</span>
            <span class="xscene__tillo">${tillo('tillo--sit', 150)}</span>
          </div>
        </section>`);
    }

    // countdown chip on the homepage
    const perks = $('#perks');
    if (perks && !$('.xmas-count')) {
      perks.insertAdjacentHTML('beforebegin', `<div class="xmas-count reveal" data-from="up">
        <span class="xmas-count__tree" aria-hidden="true">${MINI_TREE.replace('squiggle ', '')}</span><b>${countdown}</b><span>Find gifts for every age in our Christmas shop.</span>
        <a class="btn btn--red btn--sm" href="index.html#gift-finder">Gift Finder</a></div>`);
    }

    // footer: snowy hills with trees and a snowman
    const footer = $('.footer');
    if (footer && !footer.querySelector('.xfooter')) {
      footer.insertAdjacentHTML('afterbegin', `<div class="xfooter" aria-hidden="true">
        ${TREE('xfooter__tree t1')}${TREE('xfooter__tree t2')}${SNOWMAN('xfooter__snowman')}${TREE('xfooter__tree t3')}
        <span class="xfooter__gifts">${GIFT('#f2b705', '#c8102e')}${GIFT('#d6336c', '#fff')}</span></div>`);
    }
    window.ENF.observeReveals();
  }, 30);

  /* ======================= Santa flies across the page now and then ======================= */
  if (!reduce) {
    const fly = document.createElement('div');
    fly.className = 'xflyby';
    fly.setAttribute('aria-hidden', 'true');
    fly.innerHTML = SLEIGH() + '<span class="xflyby__trail"></span>';
    document.body.appendChild(fly);
    const launch = () => {
      if (document.hidden) return;
      fly.style.setProperty('--y', (90 + Math.random() * Math.max(80, innerHeight * 0.35)).toFixed(0) + 'px');
      fly.classList.remove('is-flying'); void fly.offsetWidth; fly.classList.add('is-flying');
    };
    setTimeout(launch, 4000);
    setInterval(launch, 30000);
  }

  /* ======================= snowfall ======================= */
  const canvas = document.createElement('canvas');
  canvas.className = 'xmas-snow';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let flakes = [], W = 0, H = 0, raf = 0, last = 0, wind = 0, windT = 0;
  const DPR = Math.min(devicePixelRatio || 1, 2);

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(260, W / 5.2));
    flakes = Array.from({ length: count }, () => flake(true));
  }
  function flake(anywhere) {
    const star = Math.random() < 0.18;
    const r = star ? 4 + Math.random() * 4 : 1 + Math.random() * 3.2;
    return { x: Math.random() * W, y: anywhere ? Math.random() * H : -12, r, star,
             vy: 0.45 + (star ? 0.6 : r * 0.38), sway: Math.random() * 6.28, swaySpeed: 0.006 + Math.random() * 0.014,
             rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.03, a: 0.6 + Math.random() * 0.4 };
  }
  function drawStar(f) {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -f.r);
      ctx.moveTo(0, -f.r * 0.55); ctx.lineTo(f.r * 0.28, -f.r * 0.8);
      ctx.moveTo(0, -f.r * 0.55); ctx.lineTo(-f.r * 0.28, -f.r * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }
  function draw(t) {
    const dt = Math.min(48, t - (last || t)) / 16.7; last = t;
    windT += 0.004 * dt;
    wind = Math.sin(windT) * 0.6 + Math.sin(windT * 2.7) * 0.25;   // gentle gusts
    ctx.clearRect(0, 0, W, H);
    ctx.shadowColor = 'rgba(60, 100, 140, .45)';
    ctx.shadowBlur = 3;
    ctx.fillStyle = '#fff';
    for (const f of flakes) {
      f.sway += f.swaySpeed * dt; f.rot += f.spin * dt;
      f.y += f.vy * dt;
      f.x += (Math.sin(f.sway) * 0.5 + wind * (0.6 + f.r * 0.12)) * dt;
      if (f.y > H + 12) Object.assign(f, flake(false));
      if (f.x > W + 12) f.x = -10; else if (f.x < -12) f.x = W + 10;
      ctx.globalAlpha = f.a;
      if (f.star) drawStar(f);
      else { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); }
    }
    raf = requestAnimationFrame(draw);
  }
  function start() { if (!raf && !document.hidden) { last = 0; raf = requestAnimationFrame(draw); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, W, H); }

  let snowOn = store.get('enf_snow') !== 'off' && !reduce;
  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : snowOn && start()));
  if (snowOn) start();

  const btn = document.createElement('button');
  btn.className = 'xmas-snow-toggle';
  btn.type = 'button';
  const label = () => { btn.innerHTML = `<span aria-hidden="true">❄</span> ${snowOn ? 'Snow on' : 'Snow off'}`; btn.setAttribute('aria-pressed', snowOn); btn.setAttribute('aria-label', snowOn ? 'Turn snow off' : 'Turn snow on'); };
  label();
  btn.addEventListener('click', () => { snowOn = !snowOn; store.set('enf_snow', snowOn ? 'on' : 'off'); label(); snowOn ? start() : stop(); });
  document.body.appendChild(btn);
});
