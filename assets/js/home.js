/* ==========================================================================
   Enfantillage — homepage sections
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { P, byId, COLORS, colorVars, CATEGORIES, AGES, BRANDS, CHARACTERS, brandMatch, brandLogo, imgOf, icon, balloon, starSvg, esc, money, card, shopUrl, observeReveals, initRail, burst, toast, NEW_IDS } = window.ENF;
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = id => esc(imgOf(id));

  /* ---------------- HERO CAROUSEL ---------------- */
  const topDeals = P.filter(p => p.o).sort((a, b) => (1 - b.p / b.o) - (1 - a.p / a.o)).slice(0, 3);
  const SLIDES = [
    {
      bg: 'linear-gradient(135deg,#eef1fc 0%,#dce3fa 100%)', accent: '#1d6fd1',
      kicker: `${icon('gift', 'icon', 2.4)} Gift season is coming`,
      title: 'Wishlists <em>start</em> here!',
      desc: 'Super Mario, LEGO, Barbie and hundreds more — wrap up the toys they’ve been dreaming about.',
      cta: ['Find the perfect gift', 'index.html#gift-finder', 'btn--navy'],
      imgs: [30954, 31379, 54021],
    },
    {
      bg: 'linear-gradient(135deg,#fff9e6 0%,#ffecb8 100%)', accent: '#d4157c',
      kicker: `${icon('sparkle', 'icon', 2.4)} Just landed`,
      title: 'Little hands, <em>big</em> imaginations',
      desc: 'New wooden dollhouses, play kitchens and Galt first-learning sets — made for make-believe.',
      cta: ['Shop new arrivals', shopUrl({ sort: 'new' }), 'btn--pink'],
      imgs: [55166, 55164, 55205],
    },
    {
      bg: 'linear-gradient(135deg,#ecf9ee 0%,#cdeed4 100%)', accent: '#23893a',
      kicker: `${icon('bike', 'icon', 2.4)} Ride-ons & bikes`,
      title: 'Ready, set, <em>ride!</em>',
      desc: 'Cozy Coupes for little drivers and Huffy bikes for big adventures.',
      cta: ['Shop ride-ons', shopUrl({ cat: 'rideon' }), 'btn--green'],
      imgs: [52531, 52203, 52554],
    },
    {
      bg: 'linear-gradient(135deg,#fff1f1 0%,#ffd9dc 100%)', accent: '#d81e27',
      kicker: `${icon('tag', 'icon', 2.4)} Offer Zone`,
      title: 'Save <em>12%</em> today',
      desc: 'Use code TILLO12 at checkout — plus real markdowns on top toys right now.',
      cta: ['Shop the offers', shopUrl({ sale: 1 }), 'btn--red'],
      imgs: topDeals.map(p => p.id),
      burst: true,
    },
  ];
  const DUR = 6500;
  const slider = $('#slider');
  slider.style.setProperty('--dur', DUR + 'ms');
  slider.innerHTML = SLIDES.map((s, i) => `
    <div class="slide${i === 0 ? ' is-active' : ''}" style="--bg:${s.bg};--accent:${s.accent}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${SLIDES.length}">
      <div class="slide__deco">
        <i style="width:220px;height:220px;left:-60px;bottom:-80px"></i>
        <i style="width:90px;height:90px;left:42%;top:-30px"></i>
        <span style="position:absolute;left:46%;bottom:18%;opacity:.9" class="floaty-a">${starSvg('#ffc83d', 26)}</span>
        <span style="position:absolute;left:8%;top:14%;opacity:.8">${starSvg(s.accent, 16)}</span>
      </div>
      <div class="slide__text">
        <span class="slide__kicker">${s.kicker.replace('class="icon"', 'class="icon" style="width:18px;height:18px"')}</span>
        <h2 class="slide__title">${s.title}</h2>
        <p class="slide__desc">${s.desc}</p>
        <a class="btn ${s.cta[2]}" href="${s.cta[1]}">${s.cta[0]} ${icon('arrow', 'icon', 2.6)}</a>
      </div>
      <div class="slide__art">
        ${s.burst ? `<div class="price-burst"><span>CODE<b>-12%</b>TILLO12</span></div>` : ''}
        ${s.imgs.map((id, k) => `<div class="blob blob--${'abc'[k]}" data-quick="${id}" style="cursor:pointer"><span><img src="${img(id)}" alt="${esc(byId.get(id)?.n || '')}"></span></div>`).join('')}
      </div>
    </div>`).join('') + `
    <div class="slider__nav">${SLIDES.map((_, i) => `<button class="dot-btn${i === 0 ? ' is-active' : ''}" data-go="${i}" aria-label="Go to slide ${i + 1}"></button>`).join('')}</div>
    <div class="slider__arrows">
      <button class="arrow-btn" data-step="-1" aria-label="Previous slide">${icon('left', 'icon', 2.8)}</button>
      <button class="arrow-btn" data-step="1" aria-label="Next slide">${icon('right', 'icon', 2.8)}</button>
    </div>`;

  let cur = 0, timer;
  const slides = [...slider.querySelectorAll('.slide')];
  const dots = [...slider.querySelectorAll('.dot-btn')];
  function go(n) {
    cur = (n + SLIDES.length) % SLIDES.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === cur));
    dots.forEach((d, i) => { d.classList.remove('is-active'); if (i === cur) { void d.offsetWidth; d.classList.add('is-active'); } });
    schedule();
  }
  function schedule() { clearTimeout(timer); if (!reduce && !slider.classList.contains('is-paused')) timer = setTimeout(() => go(cur + 1), DUR); }
  slider.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) go(+g.dataset.go);
    const st = e.target.closest('[data-step]'); if (st) go(cur + +st.dataset.step);
  });
  slider.addEventListener('mouseenter', () => { slider.classList.add('is-paused'); clearTimeout(timer); });
  slider.addEventListener('mouseleave', () => { slider.classList.remove('is-paused'); go(cur); });
  // swipe
  let sx = null;
  slider.addEventListener('pointerdown', e => { sx = e.clientX; });
  slider.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
  slider.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });
  document.addEventListener('visibilitychange', () => document.hidden ? clearTimeout(timer) : schedule());
  schedule();

  $('#heroSide').innerHTML = `
    <a class="promo-tile reveal" data-from="right" style="--bg:linear-gradient(135deg,#e7f9fb,#c6eef3);--accent:#0b8a93" href="${shopUrl({ cat: 'baby' })}">
      <h3>Baby World</h3><p>Rockers, jumpers, pillows & first toys</p>
      <span class="link-arrow">Explore ${icon('arrow', 'icon', 2.6).replace('class="icon"', 'class="icon" style="width:16px;height:16px"')}</span>
      <div class="promo-tile__img"><img src="${img(20700)}" alt=""></div>
    </a>
    <a class="promo-tile reveal" data-from="right" style="--d:.12s;--bg:linear-gradient(135deg,#fff4e8,#ffdcc4);--accent:#d81e27" href="${shopUrl({ brand: 'NINTENDO' })}">
      <h3>Game On!</h3><p>Super Mario & Sonic plush, figures & playsets</p>
      <span class="link-arrow">Let’s-a go ${icon('arrow', 'icon', 2.6).replace('class="icon"', 'class="icon" style="width:16px;height:16px"')}</span>
      <div class="promo-tile__img"><img src="${img(30977)}" alt=""></div>
    </a>`;

  const brandCount = new Set(P.map(p => p.b).filter(Boolean)).size;
  const PERKS = [
    ['truck', 'green', 'Free delivery', 'On orders above 50 $'],
    ['tag', 'red', '12% off today', 'Code TILLO12 at checkout'],
    ['blocks', 'blue', `${Math.floor(P.length / 100) * 100}+ toys`, `From ${Math.floor(brandCount / 10) * 10}+ brands`],
    ['pin', 'pink', 'Visit our store', 'Mazraat Yachouh, Chattat Center'],
  ];
  $('#perks').innerHTML = PERKS.map(([ic, c, t, s], i) => `
    <div class="perk reveal" data-from="up" style="${colorVars(c)};--d:${i * 0.08}s"><span class="perk__icon">${icon(ic, 'icon', 2.4)}</span><span><b>${t}</b><small>${s}</small></span></div>`).join('');

  /* ---------------- CATEGORIES ---------------- */
  const catWrap = $('#catRail').parentElement;
  catWrap.insertAdjacentHTML('afterbegin', '<button class="arrow-btn arrow-btn--prev" aria-label="Previous"></button>');
  catWrap.insertAdjacentHTML('beforeend', '<button class="arrow-btn arrow-btn--next" aria-label="Next"></button>');
  $('#catRail').innerHTML = CATEGORIES.map((c, i) => `
    <a class="cat-bubble reveal" data-from="right" style="${colorVars(c.color)};--d:${i * 0.06}s" href="${shopUrl({ cat: c.key })}">
      <span class="cat-bubble__img"><img src="${esc(imgOf(c.img, p => p.c.includes(c.key)))}" alt="" loading="lazy"></span>
      <span>${c.name}</span>
    </a>`).join('');

  /* ---------------- AGES ---------------- */
  const balloonColors = { pink: '#ffd1e8', blue: '#c9eeff', green: '#d4f5d8', red: '#ffd0d2', teal: '#c8f4f7', navy: '#cfd4ff' };
  $('#ageGrid').innerHTML = AGES.map((a, i) => `
    <a class="age-tile reveal" data-from="${i % 2 ? 'right' : 'left'}" style="${colorVars(a.color)};--d:${i * 0.07}s" href="${shopUrl({ age: a.key })}">
      <span class="age-tile__balloon">${balloon(balloonColors[a.color], 50)}</span>
      <span class="age-tile__num">${a.num}</span>
      <span class="age-tile__unit">${a.unit}</span>
      <span class="age-tile__label">${a.label}</span>
    </a>`).join('');

  /* ---------------- PRODUCT RAILS ---------------- */
  const LISTS = {
    new: () => [...P].sort((a, b) => b.id - a.id).filter(p => p.s).slice(0, 16),
    best: () => P.filter(p => p.s).slice(0, 16),          // catalog order = popularity
    sale: () => P.filter(p => p.o && p.s).sort((a, b) => (b.o - b.p) / b.o - (a.o - a.p) / a.o).slice(0, 16),
    under25: () => P.filter(p => p.p <= 25 && p.s).slice(0, 16),
  };
  const pickRail = $('#pickRail');
  function renderPicks(key, animate) {
    pickRail.innerHTML = LISTS[key]().map((p, i) => card(p, animate ? { delay: Math.min(i, 6) * 0.06, hot: key === 'best' } : { reveal: 'right', delay: Math.min(i, 6) * 0.08, hot: key === 'best' })).join('');
    if (animate) pickRail.querySelectorAll('.card').forEach(c => { c.style.animation = 'cardIn .5s var(--ease-bounce) both'; c.style.animationDelay = c.style.getPropertyValue('--d'); });
    pickRail.scrollLeft = 0;
    observeReveals(pickRail);
    pickRail._update && pickRail._update();
  }
  renderPicks('new', false);
  document.querySelectorAll('.rail-wrap').forEach(w => {
    w.querySelectorAll('.arrow-btn--prev').forEach(b => b.innerHTML = icon('left', 'icon', 2.8));
    w.querySelectorAll('.arrow-btn--next').forEach(b => b.innerHTML = icon('right', 'icon', 2.8));
    initRail(w);
  });

  const tabs = $('#pickTabs');
  const pill = tabs.querySelector('.tabs__pill');
  function movePill(btn) { pill.style.width = btn.offsetWidth + 'px'; pill.style.transform = `translateX(${btn.offsetLeft}px)`; }
  tabs.addEventListener('click', e => {
    const b = e.target.closest('.tab'); if (!b || b.classList.contains('is-active')) return;
    tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('is-active', t === b));
    movePill(b);
    renderPicks(b.dataset.tab, true);
  });
  requestAnimationFrame(() => movePill(tabs.querySelector('.tab.is-active')));
  addEventListener('resize', () => movePill(tabs.querySelector('.tab.is-active')));
  document.fonts && document.fonts.ready.then(() => movePill(tabs.querySelector('.tab.is-active')));

  const babyPicks = P.filter(p => p.c.includes('baby') && p.s).slice(0, 14);
  $('#babyRail').innerHTML = babyPicks.map((p, i) => card(p, { reveal: 'left', delay: Math.min(i, 6) * 0.08 })).join('');

  /* ---------------- BRANDS MARQUEE ---------------- */
  const withCounts = BRANDS.filter(b => b.n >= 3);
  $('#brandSub').textContent = `${BRANDS.length} brands kids ask for — all under one roof`;
  const chip = b => `<a class="brand-chip${b.logo ? ' has-logo' : ''}" style="${colorVars(b.color)}" href="${shopUrl({ brand: b.key })}" aria-label="${esc(b.name)} — ${b.n} toys">
      ${b.logo ? brandLogo(b, 'brand-chip__logo') : `<span class="brand-chip__name">${esc(b.name)}</span>`}<small>${b.n} ${b.n === 1 ? 'toy' : 'toys'}</small></a>`;
  // logos first, then dealt alternately into the two rows so each belt gets a good mix
  const ordered = [...withCounts.filter(b => b.logo), ...withCounts.filter(b => !b.logo)];
  const row1 = ordered.filter((_, i) => i % 2 === 0), row2 = ordered.filter((_, i) => i % 2 === 1);
  // duplicate content so the loop is seamless (animation moves -50%)
  $('#brandRow1').innerHTML = [...row1, ...row1].map(chip).join('');
  $('#brandRow2').innerHTML = [...row2, ...row2].map(chip).join('');
  // keep the glide speed steady (about 3.2s per tile) however many brands there are
  $('#brandRow1').style.setProperty('--speed', row1.length * 3.2 + 's');
  $('#brandRow2').style.setProperty('--speed', row2.length * 3.4 + 's');

  /* ---------------- CHARACTERS ---------------- */
  $('#charGrid').innerHTML = CHARACTERS.map((c, i) => {
    const n = P.filter(p => p.h.includes(c.key)).length;
    return `<a class="char reveal" data-from="${i % 2 ? 'right' : 'left'}" style="${colorVars(c.color)};--d:${(i % 7) * 0.06}s" href="${shopUrl({ char: c.key })}">
      <span class="char__ring"><span class="char__img"><img src="${esc(imgOf(c.img, p => p.h.includes(c.key)))}" alt="" loading="lazy"></span></span>
      <span class="char__name">${esc(c.name)}</span>
      <span class="char__count">${n} ${n === 1 ? 'toy' : 'toys'}</span>
    </a>`;
  }).join('');

  /* ---------------- GIFT FINDER ---------------- */
  const BUDGETS = [
    { key: 'b1', label: 'Under 15 $', min: 0, max: 15 },
    { key: 'b2', label: '15 – 35 $', min: 15, max: 35 },
    { key: 'b3', label: '35 – 75 $', min: 35, max: 75 },
    { key: 'b4', label: '75 $ +', min: 75, max: 1e9 },
  ];
  const INTERESTS = [
    { key: 'building', label: 'Building' }, { key: 'dolls', label: 'Dolls' }, { key: 'outdoor', label: 'Outdoor' },
    { key: 'creative', label: 'Arts & crafts' }, { key: 'stem', label: 'Science & STEM' }, { key: 'vehicles', label: 'Cars & RC' },
    { key: 'plush', label: 'Cuddly plush' }, { key: 'games', label: 'Games' }, { key: 'figures', label: 'Characters' },
  ];
  const finder = $('#finder');
  const sel = { age: '5-8', budget: null, interest: null };
  finder.innerHTML = `
    <span class="finder__balloon para" data-speed="-.08" style="left:3%;bottom:-18px">${balloon('#e8222b', 54)}</span>
    <span class="finder__balloon para" data-speed=".06" style="left:9%;bottom:6px">${balloon('#3db54a', 38)}</span>
    <span class="finder__balloon para" data-speed="-.05" style="left:15%;bottom:-30px;opacity:.6">${balloon('#00a6e4', 44)}</span>
    <div class="finder__grid">
      <div>
        <h2>The <em>Gift</em> Finder</h2>
        <p>Three taps to the perfect present. Pick an age, a budget and what they love.</p>
        <div class="finder__step"><label><span>1</span>How old are they?</label><div class="chips" data-group="age">${AGES.map(a => `<button class="chip${a.key === sel.age ? ' is-on' : ''}" data-v="${a.key}">${a.num} yrs</button>`).join('')}</div></div>
        <div class="finder__step"><label><span>2</span>What’s your budget?</label><div class="chips" data-group="budget"><button class="chip is-on" data-v="">Any</button>${BUDGETS.map(b => `<button class="chip" data-v="${b.key}">${b.label}</button>`).join('')}</div></div>
        <div class="finder__step"><label><span>3</span>What do they love?</label><div class="chips" data-group="interest"><button class="chip is-on" data-v="">Surprise me</button>${INTERESTS.map(x => `<button class="chip" data-v="${x.key}">${x.label}</button>`).join('')}</div></div>
      </div>
      <div class="finder__results" id="finderResults" aria-live="polite"></div>
    </div>`;
  function finderMatches() {
    const b = BUDGETS.find(x => x.key === sel.budget);
    return P.filter(p => p.s && (!sel.age || p.a.includes(sel.age)) && (!b || (p.p >= b.min && p.p < b.max)) && (!sel.interest || p.c.includes(sel.interest)));
  }
  function renderFinder() {
    const all = finderMatches();
    const out = $('#finderResults');
    const params = { age: sel.age };
    const b = BUDGETS.find(x => x.key === sel.budget);
    if (b) { params.min = b.min; if (b.max < 1e9) params.max = b.max; }
    if (sel.interest) params.cat = sel.interest;
    if (!all.length) {
      out.innerHTML = `<div class="finder__empty">${balloon('#ffc83d', 60)}<h3 style="font-size:24px;margin:10px 0 4px">Hmm, no exact match!</h3><p>Try a different budget or interest — there’s plenty more to discover.</p></div>`;
      return;
    }
    // shuffle a little so "surprise me" feels alive, but keep it stable per selection
    const seed = JSON.stringify(sel).length;
    const picks = all.slice().sort((x, y) => ((x.id * 7 + seed) % 13) - ((y.id * 7 + seed) % 13)).slice(0, 6);
    out.innerHTML = `<div class="finder__count"><span>${all.length} gift idea${all.length > 1 ? 's' : ''} found!</span><a href="${shopUrl(params)}">See them all →</a></div>` +
      picks.map((p, i) => card(p, { delay: i * 0.06 })).join('');
  }
  finder.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    const g = c.parentElement.dataset.group;
    c.parentElement.querySelectorAll('.chip').forEach(x => x.classList.toggle('is-on', x === c));
    sel[g] = c.dataset.v || null;
    renderFinder();
  });
  renderFinder();

  /* ---------------- SPLIT BANNERS ---------------- */
  $('#splits').innerHTML = `
    <a class="split reveal" data-from="left" style="--bg:linear-gradient(135deg,#00a6e4,#12b5c1)" href="${shopUrl({ cat: 'outdoor' })}">
      <h3>Splash, slide & play outside</h3><p>Pools, slides, playhouses and backyard adventures.</p>
      <span class="btn btn--white">Shop outdoor ${icon('arrow', 'icon', 2.6)}</span>
      <div class="split__imgs"><div class="blob"><span><img src="${img(17148)}" alt=""></span></div><div class="blob"><span><img src="${img(16473)}" alt=""></span></div></div>
    </a>
    <a class="split reveal" data-from="right" style="--bg:linear-gradient(135deg,#3db54a,#8bc53f)" href="${shopUrl({ cat: 'creative' })}">
      <h3>Create, paint & get messy</h3><p>Play-Doh, water magic, craft kits and more.</p>
      <span class="btn btn--white">Shop arts & crafts ${icon('arrow', 'icon', 2.6)}</span>
      <div class="split__imgs"><div class="blob"><span><img src="${img(54119)}" alt=""></span></div><div class="blob"><span><img src="${img(54925)}" alt=""></span></div></div>
    </a>`;

  /* ---------------- BUDGETS ---------------- */
  const COINS = [
    ['Under', '10 $', { max: 10 }, 'green'], ['Under', '25 $', { max: 25 }, 'blue'], ['Under', '50 $', { max: 50 }, 'pink'],
    ['Under', '100 $', { max: 100 }, 'teal'], ['Big gifts', '100 $+', { min: 100 }, 'red'],
  ];
  $('#budgets').innerHTML = COINS.map(([s, b, q, c], i) => `<a class="coin reveal" data-from="pop" style="${colorVars(c)};--d:${i * 0.08}s" href="${shopUrl(q)}"><small>${s}</small><b>${b}</b></a>`).join('');

  /* ---------------- CLUB ---------------- */
  $('#club').innerHTML = `
    <div class="club__balloons"><span class="para" data-speed="-.1" style="position:relative">${balloon('#e8222b', 60)}</span><span class="para" data-speed="-.05" style="position:relative;margin-top:30px">${balloon('#3db54a', 46)}</span><span class="para" data-speed="-.14" style="position:relative;margin-top:10px">${balloon('#ffc83d', 52)}</span></div>
    <div>
      <h2>Join the Enfantillage Club</h2>
      <p>Be first to hear about new arrivals, birthday surprises and members-only offers.</p>
    </div>
    <div>
      <form id="clubForm" novalidate>
        <label class="sr-only" for="clubEmail">Email address</label>
        <input id="clubEmail" type="email" placeholder="Your email address" required>
        <button class="btn btn--navy" type="submit">Join the fun</button>
      </form>
      <p class="club__note">No spam, only smiles. Unsubscribe anytime.</p>
    </div>`;
  $('#clubForm').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#clubEmail');
    if (!/^\S+@\S+\.\S+$/.test(inp.value)) { inp.focus(); inp.parentElement.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
    burst(e.submitter || inp, undefined, 60);
    toast('Welcome to the club! Check your inbox soon');
    inp.value = '';
  });

  observeReveals();
});
