/* ==========================================================================
   Enfantillage — shop / listing page
   Every "shop by" link (category, age, brand, character, budget, offers,
   search, wishlist) lands here via URL params.
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { P, colorVars, CATEGORIES, AGES, BRANDS, CHARACTERS, brandMatch, icon, balloon, esc, card, getFavs, NEW_IDS } = window.ENF;
  const $ = s => document.querySelector(s);
  const PAGE = 24;

  /* ---------- state <-> URL ---------- */
  const url = new URLSearchParams(location.search);
  const list = k => (url.get(k) || '').split(',').filter(Boolean);
  const st = {
    cat: list('cat'), age: list('age'), brand: list('brand'), char: list('char'),
    q: url.get('q') || '', sale: url.get('sale') === '1', fav: url.get('fav') === '1',
    min: url.get('min') || '', max: url.get('max') || '',
    sort: url.get('sort') || 'popular',
  };
  let shown = PAGE;

  function writeUrl() {
    const u = new URLSearchParams();
    ['cat', 'age', 'brand', 'char'].forEach(k => st[k].length && u.set(k, st[k].join(',')));
    if (st.q) u.set('q', st.q);
    if (st.sale) u.set('sale', '1');
    if (st.fav) u.set('fav', '1');
    if (st.min) u.set('min', st.min);
    if (st.max) u.set('max', st.max);
    if (st.sort !== 'popular') u.set('sort', st.sort);
    history.replaceState(null, '', 'shop.html' + (u.toString() ? '?' + u : ''));
  }

  /* ---------- filtering ---------- */
  const TESTS = {
    cat: p => st.cat.some(k => p.c.includes(k)),
    age: p => st.age.some(k => p.a.includes(k)),
    brand: p => st.brand.some(k => brandMatch(p, k)),
    char: p => st.char.some(k => p.h.includes(k)),
  };
  function passes(p, skip) {
    for (const k of ['cat', 'age', 'brand', 'char']) if (k !== skip && st[k].length && !TESTS[k](p)) return false;
    if (st.q) { const s = (p.n + ' ' + p.b).toLowerCase(); if (!st.q.toLowerCase().split(/\s+/).every(t => s.includes(t))) return false; }
    if (st.sale && !p.o) return false;
    if (st.fav && !getFavs().has(p.id)) return false;
    if (st.min !== '' && p.p < +st.min) return false;
    if (st.max !== '' && p.p > +st.max) return false;
    return true;
  }
  const SORTS = {
    popular: null,
    new: (a, b) => b.id - a.id,
    low: (a, b) => a.p - b.p,
    high: (a, b) => b.p - a.p,
    deal: (a, b) => (b.o ? (b.o - b.p) / b.o : 0) - (a.o ? (a.o - a.p) / a.o : 0),
  };
  function results() {
    const r = P.filter(p => passes(p));
    return SORTS[st.sort] ? r.sort(SORTS[st.sort]) : r;
  }
  const facetCount = (facet, test) => P.filter(p => passes(p, facet) && test(p)).length;

  /* ---------- hero ---------- */
  function renderHero() {
    let title = 'All Toys', sub = 'Everything fun, all in one place', color = 'blue';
    const one = (k, arr) => st[k].length === 1 && arr.find(x => x.key === st[k][0]);
    const c = one('cat', CATEGORIES), a = one('age', AGES), b = one('brand', BRANDS), h = one('char', CHARACTERS);
    if (st.fav) { title = 'Your Wishlist'; sub = 'All the toys you’ve hearted, saved in this browser'; color = 'pink'; }
    else if (st.sale) { title = 'Offer Zone'; sub = 'Real savings on top toys — plus 12% off with code TILLO12'; color = 'red'; }
    else if (st.q) { title = `“${st.q}”`; sub = 'Search results'; color = 'navy'; }
    else if (h) { title = h.name; sub = `Toys, playsets and goodies starring ${h.name}`; color = h.color; }
    else if (b) { title = b.name; sub = `Shop the ${b.name} collection at Enfantillage`; color = b.color; }
    else if (a) { title = `Ages ${a.num}`; sub = `${a.label} — hand-picked for this stage`; color = a.color; }
    else if (c) { title = c.name; sub = 'Find their next favourite thing'; color = c.color; }
    else if (st.max && !st.min) { title = `Under ${st.max} $`; sub = 'Big fun, small price'; color = 'green'; }
    else if (st.min && !st.max) { title = `${st.min} $ and up`; sub = 'The showstopper gifts'; color = 'red'; }
    const hero = $('#shopHero');
    hero.style.cssText = colorVars(color);
    hero.innerHTML = `
      <span class="para" style="right:8%;top:10px;animation:floaty 6s ease-in-out infinite">${balloon('#ffffff', 46)}</span>
      <span class="para" style="right:14%;top:40px;opacity:.7;animation:floaty 7s ease-in-out -3s infinite">${balloon(getComputedStyle(hero).getPropertyValue('--c'), 34)}</span>
      <div class="wrap" style="position:relative;z-index:1">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span>›</span><a href="shop.html">Shop</a>${title !== 'All Toys' ? `<span>›</span><span>${esc(title)}</span>` : ''}</nav>
        <h1 class="reveal" data-from="left">${esc(title)}</h1>
        <p class="reveal" data-from="left" style="--d:.1s">${esc(sub)}</p>
      </div>`;
    document.title = `${title.replace(/[“”]/g, '')} — Enfantillage Lebanon`;
  }

  /* ---------- filter sidebar ---------- */
  const group = (key, title, inner, closed) => `
    <div class="fgroup${closed ? ' is-closed' : ''}" data-g="${key}">
      <button class="fgroup__title" type="button">${title}${icon('down', 'icon', 2.6)}</button>
      <div class="fgroup__body"><div><div class="fgroup__inner">${inner}</div></div></div>
    </div>`;
  const check = (facet, key, label, n, color) => `
    <label class="check" style="${color ? colorVars(color) : ''}${!n && !st[facet].includes(key) ? ';opacity:.45' : ''}">
      <input type="checkbox" data-f="${facet}" value="${esc(key)}"${st[facet].includes(key) ? ' checked' : ''}> ${esc(label)} <em>${n}</em>
    </label>`;

  function renderFilters() {
    const f = $('#filters');
    const closedState = {};
    f.querySelectorAll('.fgroup').forEach(g => closedState[g.dataset.g] = g.classList.contains('is-closed'));
    const isClosed = (k, d) => (k in closedState ? closedState[k] : d);
    const brands = BRANDS.map(b => ({ ...b, n: facetCount('brand', p => brandMatch(p, b.key)) })).sort((x, y) => y.n - x.n);
    f.innerHTML = `
      <div class="drawer__head filter-btn" style="padding:0 0 12px;display:none;justify-content:space-between;align-items:center"><h3 style="font-size:24px;color:var(--navy)">Filters</h3><button class="drawer__close" type="button" data-close aria-label="Close filters">${icon('x')}</button></div>
      ${group('age', 'Age', `<div class="age-chips">${AGES.map(a => `<button type="button" style="${colorVars(a.color)}" class="${st.age.includes(a.key) ? 'is-on' : ''}" data-age="${a.key}">${a.num}</button>`).join('')}</div>`, isClosed('age', false))}
      ${group('cat', 'Category', CATEGORIES.map(c => check('cat', c.key, c.name, facetCount('cat', p => p.c.includes(c.key)), c.color)).join(''), isClosed('cat', false))}
      ${group('price', 'Price', `
        <div class="range"><input type="number" min="0" placeholder="Min $" id="pmin" value="${esc(st.min)}" aria-label="Minimum price"><span>–</span><input type="number" min="0" placeholder="Max $" id="pmax" value="${esc(st.max)}" aria-label="Maximum price"></div>
        <div class="chips" style="margin-top:10px">${[[0, 10], [0, 25], [25, 50], [50, 100], [100, '']].map(([a, b]) => `<button type="button" class="suggest__chip" data-price="${a},${b}">${b === '' ? a + ' $+' : a ? a + '–' + b + ' $' : 'Under ' + b + ' $'}</button>`).join('')}</div>
        <label class="toggle" style="margin-top:10px">On sale only <input type="checkbox" id="saleT"${st.sale ? ' checked' : ''}></label>`, isClosed('price', false))}
      ${group('char', 'Character', CHARACTERS.map(c => check('char', c.key, c.name, facetCount('char', p => p.h.includes(c.key)), c.color)).join(''), isClosed('char', true))}
      ${group('brand', 'Brand', `<div class="fgroup__inner fgroup__inner--scroll" style="padding:0">${brands.map(b => check('brand', b.key, b.name, b.n, b.color)).join('')}</div>`, isClosed('brand', true))}
      <div class="filter-btn" style="display:none;padding-top:16px"><button class="btn btn--red" style="width:100%" type="button" data-close>Show ${results().length} toys</button></div>`;
    if (matchMedia('(max-width: 1024px)').matches) f.querySelectorAll('.filter-btn').forEach(el => el.style.display = 'flex');
  }

  /* ---------- active filter chips ---------- */
  function renderActive() {
    const chips = [];
    const add = (label, color, fn) => chips.push({ label, color, fn });
    st.cat.forEach(k => { const c = CATEGORIES.find(x => x.key === k); c && add(c.name, c.color, () => st.cat = st.cat.filter(x => x !== k)); });
    st.age.forEach(k => { const a = AGES.find(x => x.key === k); a && add(`Ages ${a.num}`, a.color, () => st.age = st.age.filter(x => x !== k)); });
    st.brand.forEach(k => { const b = BRANDS.find(x => x.key === k); add(b ? b.name : k, b ? b.color : 'navy', () => st.brand = st.brand.filter(x => x !== k)); });
    st.char.forEach(k => { const c = CHARACTERS.find(x => x.key === k); c && add(c.name, c.color, () => st.char = st.char.filter(x => x !== k)); });
    if (st.q) add(`“${st.q}”`, 'navy', () => { st.q = ''; const i = document.querySelector('.search__input'); if (i) i.value = ''; });
    if (st.sale) add('On sale', 'red', () => st.sale = false);
    if (st.fav) add('Wishlist', 'pink', () => st.fav = false);
    if (st.min || st.max) add(`${st.min || 0} – ${st.max || '∞'} $`, 'green', () => { st.min = ''; st.max = ''; });
    $('#active').innerHTML = chips.map((c, i) => `<span class="afilter" style="${colorVars(c.color)}">${esc(c.label)}<button type="button" data-rm="${i}" aria-label="Remove ${esc(c.label)}">×</button></span>`).join('') +
      (chips.length > 1 ? '<button class="clear-all" type="button" data-clear>Clear all</button>' : '');
    $('#active')._chips = chips;
  }

  /* ---------- grid ---------- */
  function renderGrid(keep) {
    const r = results();
    $('#count').innerHTML = `<b>${r.length}</b> ${r.length === 1 ? 'toy' : 'toys'} found`;
    const grid = $('#grid');
    if (!r.length) {
      grid.innerHTML = `<div class="empty-state">${balloon('#ec1c8c', 70)}<h3>${st.fav ? 'No hearts yet!' : 'No toys match… yet!'}</h3><p style="color:var(--ink-soft)">${st.fav ? 'Tap the heart on any toy to save it here.' : 'Try removing a filter or searching for something else.'}</p><br><a class="btn btn--navy" href="shop.html">See all toys</a></div>`;
      $('#more').innerHTML = '';
      return;
    }
    const start = keep ? grid.children.length : 0;
    const slice = r.slice(start, shown);
    const html = slice.map((p, i) => card(p, { delay: Math.min(i, 11) * 0.04 })).join('');
    if (keep) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html;
    $('#more').innerHTML = shown < r.length ? `<button class="btn btn--blue" type="button" id="moreBtn">Show more toys <span style="opacity:.8">(${r.length - shown} left)</span></button>` : '';
  }

  function refresh() {
    shown = PAGE;
    writeUrl();
    renderHero();
    renderFilters();
    renderActive();
    renderGrid(false);
    window.ENF.observeReveals();
  }

  /* ---------- events ---------- */
  const filters = $('#filters');
  filters.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.f) {
      const arr = st[t.dataset.f];
      st[t.dataset.f] = t.checked ? [...arr, t.value] : arr.filter(x => x !== t.value);
      refresh();
    } else if (t.id === 'saleT') { st.sale = t.checked; refresh(); }
    else if (t.id === 'pmin' || t.id === 'pmax') { st.min = $('#pmin').value; st.max = $('#pmax').value; refresh(); }
  });
  filters.addEventListener('click', e => {
    const ttl = e.target.closest('.fgroup__title');
    if (ttl) { ttl.parentElement.classList.toggle('is-closed'); return; }
    const ag = e.target.closest('[data-age]');
    if (ag) { const k = ag.dataset.age; st.age = st.age.includes(k) ? st.age.filter(x => x !== k) : [...st.age, k]; refresh(); return; }
    const pr = e.target.closest('[data-price]');
    if (pr) { const [a, b] = pr.dataset.price.split(','); st.min = a === '0' ? '' : a; st.max = b; refresh(); }
  });
  $('#active').addEventListener('click', e => {
    const rm = e.target.closest('[data-rm]');
    if (rm) { $('#active')._chips[+rm.dataset.rm].fn(); refresh(); return; }
    if (e.target.closest('[data-clear]')) { Object.assign(st, { cat: [], age: [], brand: [], char: [], q: '', sale: false, fav: false, min: '', max: '' }); refresh(); }
  });
  $('#sort').value = st.sort;
  $('#sort').addEventListener('change', e => { st.sort = e.target.value; refresh(); });
  $('#more').addEventListener('click', e => { if (e.target.closest('#moreBtn')) { shown += PAGE; renderGrid(true); } });
  $('#openFilters').addEventListener('click', () => {
    filters.classList.add('is-open');
    document.querySelector('.drawer-backdrop').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });
  // wishlist view updates live when a heart is removed
  document.addEventListener('favs:change', () => { if (st.fav) { renderGrid(false); renderFilters(); } });

  refresh();
});
