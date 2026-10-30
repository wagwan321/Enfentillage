/* ==========================================================================
   Enfantillage — shared site logic
   Header, mega menus, search, cart, wishlist, product cards, quick view,
   scroll reveal + parallax. Used by every page.
   ========================================================================== */
(function () {
  'use strict';

  const P = window.PRODUCTS || [];
  /* pictures are stored with the site: sm = card thumbnail, lg = quick-view gallery */
  P.forEach(p => { p.i = `assets/img/products/sm/${p.id}.webp`; });
  const imgLg = (p, k = 0) => `assets/img/products/lg/${p.id}-${k}.webp`;
  const byId = new Map(P.map(p => [p.id, p]));

  /* ---------- palette ---------- */
  const COLORS = {
    red:   { c: '#e8222b', soft: '#ffe7e8', dark: '#b3151c' },
    green: { c: '#3db54a', soft: '#e3f6e5', dark: '#2a8a35' },
    blue:  { c: '#00a6e4', soft: '#def4fd', dark: '#0080b0' },
    pink:  { c: '#ec1c8c', soft: '#fde4f1', dark: '#b5126a' },
    teal:  { c: '#12b5c1', soft: '#dcf6f8', dark: '#0b8a93' },
    navy:  { c: '#25318c', soft: '#e6e8f7', dark: '#1a2266' },
  };
  const COLOR_KEYS = Object.keys(COLORS);
  const colorVars = k => { const x = COLORS[k] || COLORS.navy; return `--c:${x.c};--c-soft:${x.soft};--c-dark:${x.dark}`; };
  const hashColor = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return COLOR_KEYS[h % COLOR_KEYS.length]; };

  /* ---------- catalog config ---------- */
  const CATEGORIES = [
    { key: 'baby',     name: 'Baby & Toddler',        color: 'pink',  img: 20700 },
    { key: 'outdoor',  name: 'Outdoor & Pool',        color: 'blue',  img: 17148 },
    { key: 'rideon',   name: 'Ride-ons & Bikes',      color: 'red',   img: 52531 },
    { key: 'building', name: 'Building Sets',         color: 'navy',  img: 31572 },
    { key: 'dolls',    name: 'Dolls & Dollhouses',    color: 'pink',  img: 55166 },
    { key: 'stem',     name: 'STEM & Learning',       color: 'green', img: 26621 },
    { key: 'creative', name: 'Arts & Crafts',         color: 'teal',  img: 54119 },
    { key: 'vehicles', name: 'Cars & RC',             color: 'red',   img: 54669 },
    { key: 'games',    name: 'Games & Puzzles',       color: 'blue',  img: 53537 },
    { key: 'plush',    name: 'Plush & Soft Toys',     color: 'green', img: 20577 },
    { key: 'figures',  name: 'Figures & Collectibles',color: 'navy',  img: 31156 },
    { key: 'pretend',  name: 'Pretend Play',          color: 'teal',  img: 55164 },
  ];

  const AGES = [
    { key: '0-3',   num: '0–3',   unit: 'years', label: 'Babies & Toddlers', color: 'pink' },
    { key: '3-6',   num: '3–6',   unit: 'years', label: 'Preschoolers',      color: 'blue' },
    { key: '5-8',   num: '5–8',   unit: 'years', label: 'Little Explorers',  color: 'green' },
    { key: '8-11',  num: '8–11',  unit: 'years', label: 'Big Kids',          color: 'red' },
    { key: '11-16', num: '11–16', unit: 'years', label: 'Tweens & Teens',    color: 'teal' },
    { key: '17+',   num: '17+',   unit: 'years', label: 'Grown-up Fun',      color: 'navy' },
  ];

  /* Brand display names, colors and official logos (files in assets/img/brands).
     Every brand in the catalog is listed automatically; entries here only refine how it looks. */
  const BRAND_INFO = {
    'LEGO': { name: 'LEGO', color: 'red', logo: 'lego.svg' },
    'STEP2': { name: 'Step2', color: 'blue', logo: 'step2.svg' },
    'LITTLE TIKES': { name: 'Little Tikes', color: 'red', logo: 'littletikes.svg' },
    'BARBIE': { name: 'Barbie', color: 'pink', logo: 'barbie.svg' },
    'NINTENDO': { name: 'Nintendo', color: 'red', logo: 'nintendo.svg' },
    'INTEX': { name: 'Intex', color: 'blue', logo: 'intex.png' },
    'BESTWAY': { name: 'Bestway', color: 'teal', logo: 'bestway.png' },
    'PLAY-DOH': { name: 'Play-Doh', color: 'blue', logo: 'playdoh.png' },
    'HUFFY': { name: 'Huffy', color: 'navy', logo: 'huffy.png' },
    'TINY LOVE': { name: 'Tiny Love', color: 'green', logo: 'tinylove.png' },
    'TOMMEE TIPPEE': { name: 'Tommee Tippee', color: 'teal', logo: 'tommeetippee.svg' },
    'SILVERLIT': { name: 'Silverlit', color: 'red', logo: 'silverlit.png' },
    'KIDYWOLF': { name: 'Kidywolf', color: 'navy', logo: 'kidywolf.png' },
    'DOOMOO': { name: 'Doomoo', color: 'green', logo: 'doomoo.png' },
    'TOBAR': { name: 'Tobar', color: 'pink', logo: 'tobar.png' },
    'ODYSSEY TOYS': { name: 'Odyssey Toys', color: 'navy', logo: 'odyssey.png' },
    'INFANTINO': { name: 'Infantino', color: 'pink', logo: 'infantino.png' },
    'FEBER': { name: 'Feber', color: 'red', logo: 'feber.svg' },
    'TOWNLEY': { name: 'Townley Girl', color: 'pink', logo: 'townley.png' },
    'RAINBOW HIGH': { name: 'Rainbow High', color: 'pink', logo: 'rainbowhigh.png' },
    'LISCIANI GIOCHI': { name: 'Lisciani', color: 'green', logo: 'lisciani.png' },
    'BEBECONFORT': { name: 'Bébéconfort', color: 'teal' },
    'WOWWEE': { name: 'WowWee', color: 'blue', logo: 'wowwee.svg' },
    'B TOYS': { name: 'B. Toys', color: 'teal', logo: 'btoys.svg' },
    'NEEDOH': { name: 'NeeDoh', color: 'green', logo: 'needoh.svg' },
    'POKEMON': { name: 'Pokémon', logo: 'pokemon.png' },
    'SENTOSPHÈRE': { name: 'Sentosphère', logo: 'sentosphere.png' },
    'SCIENCE4YOU': { name: 'Science4you', logo: 'science4you.png' },
    'MGA': { name: 'MGA', logo: 'mga.svg' }, "MGA'S MINIVERSE": { name: "MGA's Miniverse", logo: 'miniverse.png' },
    'SBV': { name: 'SBV' }, 'HGL': { name: 'HGL' }, 'IMC TOYS': { name: 'IMC Toys' },
    'LEAPFROG': { name: 'LeapFrog', logo: 'leapfrog.svg' }, 'FISHER PRICE': { name: 'Fisher-Price' },
    'PAW PATROL': { name: 'PAW Patrol', logo: 'pawpatrol.png' }, 'POP MART': { name: 'POP MART' }, 'MRBEAST': { name: 'MrBeast' },
    'L.O.L SURPRISE': { name: 'L.O.L. Surprise!' }, 'NETFLIX K-POP': { name: 'K-Pop Demon Hunters' },
    "GABBY'S DOLLHOUSE": { name: "Gabby's Dollhouse", logo: 'gabbysdollhouse.png' }, 'JAKKS': { name: 'JAKKS Pacific' },
    'XOX KWEENIE': { name: 'XOX Kweenie' }, 'SKY CASTLE': { name: 'Sky Castle' },
    'BLOKEES': { logo: 'blokees.svg' },
    'PLAYMOBIL': { logo: 'playmobil.svg' },
    'BABYJEM': { logo: 'babyjem.png' },
    'VITAL BABY': { logo: 'vitalbaby.png' },
    'WOW GENERATION': { logo: 'wowgeneration.png' },
    'GALT': { logo: 'galt.png' },
    'GOLIATH': { logo: 'goliath.svg' },
    'ZURU': { logo: 'zuru.svg' },
    'SKILLMATICS': { logo: 'skillmatics.png' },
    'JOIE': { logo: 'joie.png' },
    'CUDDLE BARN': { logo: 'cuddlebarn.png' },
    'MADMIA': { logo: 'madmia.png' },
    'BUKI': { logo: 'buki.png' },
    'CANAL TOYS': { logo: 'canaltoys.png' },
    'MAISTO': { logo: 'maisto.png' },
    'STICKI ROLLS': { logo: 'stickirolls.png' },
    'PHATMOJO': { logo: 'phatmojo.svg' },
    'ALPHANOVA': { logo: 'alphanova.svg' },
    'OUR GENERATION': { logo: 'ourgeneration.svg' },
    'NICE': { logo: 'nice.png' },
    'SQUISHMALLOWS': { logo: 'squishmallows.png' },
    'NATHAN': { logo: 'nathan.png' },
    'TOSSIT': { logo: 'tossit.png' },
    'MAGBLOX': { logo: 'magblox.png' },
    'STARLUX': { logo: 'starlux.png' },
    'DORA': { logo: 'dora.svg' },
    'HELLO KITTY': { logo: 'hellokitty.png' },
    'CLEMENTONI': { logo: 'clementoni.png' },
    'DISNEY STITCH': { logo: 'stitch.svg' },
    'SMOBY': { logo: 'smoby.svg' },
    'BBURAGO': { name: 'Bburago', logo: 'bburago.png' },
    'GEOMAG': { logo: 'geomag.png' },
    'BEYBLADE X': { name: 'Beyblade X', logo: 'beybladex.svg' },
    'BEAVER': { logo: 'beaver.png' },
    'FISHER PRICE': { logo: 'fisherprice.svg' },
    'HOT WHEELS': { logo: 'hotwheels.svg' },
    'SPIN MASTER': { name: 'Spin Master', logo: 'spinmaster.png' },
    'ECOIFFIER': { logo: 'ecoiffier.svg' },
    'BABY EINSTEIN': { logo: 'babyeinstein.png' },
    'GRACO': { logo: 'graco.png' },
    'RAZOR': { logo: 'razor.svg' },
    'FUNKO FIGURE': { name: 'Funko', logo: 'funko.svg' },
    "RUBIK'S": { name: "Rubik's", logo: 'rubiks.svg' },
    'BRIGHT STARTS': { logo: 'brightstarts.png' },
    'BABYMOOV': { name: 'Babymoov', logo: 'babymoov.png' },
    'SCHMIDT': { logo: 'schmidt.png' },
    'MATCHBOX': { logo: 'matchbox.png' },
    'BRATZ': { logo: 'bratz.png' },
    'POP MART': { logo: 'popmart.svg' },
    'INGENUITY': { logo: 'ingenuity.png' },
    'EVENFLO': { logo: 'evenflo.png' },
    'JAKKS': { logo: 'jakks.png' },
    'NENUCO': { logo: 'nenuco.png' },
    'RAINBOW LOOM': { logo: 'rainbowloom.png' },
    'PILSAN': { logo: 'pilsan.svg' },
  };
  const titleCase = k => k.toLowerCase().replace(/(^|[\s\-/&(])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const brandCounts = {};
  P.forEach(p => { if (p.b) brandCounts[p.b] = (brandCounts[p.b] || 0) + 1; });
  /* all catalog brands, biggest first */
  const BRANDS = Object.keys(brandCounts).map(key => {
    const info = BRAND_INFO[key] || {};
    return { key, name: info.name || titleCase(key), color: info.color || hashColor(key), logo: info.logo, n: brandCounts[key] };
  }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));

  const CHARACTERS = [
    { key: 'mario',       name: 'Super Mario',       color: 'red',   img: 30977 },
    { key: 'barbie',      name: 'Barbie',            color: 'pink',  img: 54021 },
    { key: 'sonic',       name: 'Sonic',             color: 'blue',  img: 31150 },
    { key: 'stitch',      name: 'Stitch',            color: 'teal',  img: 54596 },
    { key: 'pokemon',     name: 'Pokémon',           color: 'red',   img: 54592 },
    { key: 'minions',     name: 'Minions',           color: 'blue',  img: 54595 },
    { key: 'princess',    name: 'Disney Princess',   color: 'pink',  img: 53794 },
    { key: 'harrypotter', name: 'Harry Potter',      color: 'navy',  img: 31379 },
    { key: 'rainbowhigh', name: 'Rainbow High',      color: 'pink',  img: 54223 },
    { key: 'marvel',      name: 'Marvel',            color: 'red',   img: 31382 },
    { key: 'lol',         name: 'L.O.L. Surprise!',  color: 'teal',  img: 54287 },
    { key: 'kpop',        name: 'K-Pop Demon Hunters', color: 'navy', img: 52837 },
    { key: 'unicorn',     name: 'Unicorns',          color: 'pink',  img: 54925 },
    { key: 'dino',        name: 'Dinosaurs',         color: 'green', img: 31948 },
  ];

  /* brand logo <img> (official logos live in assets/img/brands) */
  const brandLogo = (b, cls = '') => b.logo ? `<img class="${cls}" src="assets/img/brands/${b.logo}" alt="${b.name}">` : '';
  const brandMatch = (p, key) => p.b === key;
  const imgOf = (id, fallbackFilter) => (byId.get(id) || (fallbackFilter && P.find(fallbackFilter)) || P[0] || {}).i;

  /* ---------- icons ---------- */
  const PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12.5h12L22 7H6.2"/>',
    heart: '<path d="M12 20.5s-7.6-4.5-9.4-9.4C1.2 7.3 3.8 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4c3.5 0 6.1 3.3 4.7 7.1-1.8 4.9-9.4 9.4-9.4 9.4z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M12 8S10.5 3 8 3.5 6.5 8 12 8zm0 0s1.5-5 4-4.5S17.5 8 12 8z"/>',
    tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>',
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    returns: '<path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="m8 6-4 4 4 4"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    blocks: '<rect x="3" y="12" width="8" height="8" rx="1.5"/><rect x="13" y="12" width="8" height="8" rx="1.5"/><rect x="8" y="4" width="8" height="8" rx="1.5"/>',
    baby: '<circle cx="12" cy="9" r="5"/><path d="M9.5 9h.01M14.5 9h.01M10 11.5c1 .8 3 .8 4 0"/><path d="M7 21c0-3 2.2-5 5-5s5 2 5 5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    bike: '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h5l3 8M10 8 8 5H6M14 8l-4 8"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
    squiggle: '<path d="M3 14c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke-width="3"/>',
  };
  const icon = (name, cls = 'icon', sw = 2.2) =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || ''}</svg>`;

  /* balloon from the logo — used as decoration everywhere */
  const balloon = (color, w = 50, cls = '') =>
    `<svg class="${cls}" viewBox="0 0 50 84" width="${w}" aria-hidden="true"><path d="M25 2C12 2 4 12 4 24c0 14 12 26 21 28 9-2 21-14 21-28C46 12 38 2 25 2z" fill="${color}"/><path d="M21 52l4 6 4-6z" fill="${color}"/><ellipse cx="16" cy="18" rx="4" ry="7" fill="#fff" opacity=".5" transform="rotate(-20 16 18)"/><path d="M25 58c-3 6 3 10 0 16s2 6 0 8" stroke="${color}" stroke-width="1.6" fill="none" opacity=".8"/></svg>`;
  const starSvg = (color, w = 18) =>
    `<svg viewBox="0 0 24 24" width="${w}" aria-hidden="true"><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.2 5.8 20.9l1.6-7L2 9.2l7.1-.6z" fill="${color}"/></svg>`;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' $';
  const brandName = key => (BRAND_INFO[key] || {}).name || titleCase(key);

  /* "new" = most recently added products (highest ids) */
  const NEW_IDS = new Set([...P].sort((a, b) => b.id - a.id).slice(0, 60).map(p => p.id));

  /* ---------- storage (per-viewer conveniences only) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  let cart = store.get('enf_cart', {});
  let favs = new Set(store.get('enf_favs', []));

  /* ==========================================================================
     Product card
     ========================================================================== */
  /* price block: sale price, "from" for products with options, or ask-in-store when the old site had no price */
  function priceHTML(p, cls = 'price') {
    if (!p.p) return `<div class="${cls} price--ask">Ask in store</div>`;
    return `<div class="${cls}${p.o ? ' price--sale' : ''}">${p.o ? `<s>${money(p.o)}</s>` : ''}${p.v ? '<small>from</small> ' : ''}${money(p.p)}</div>`;
  }

  function card(p, opts = {}) {
    const pct = p.o ? Math.round((1 - p.p / p.o) * 100) : 0;
    const badges = [];
    if (pct >= 5) badges.push(`<span class="badge badge--sale">-${pct}%</span>`);
    if (NEW_IDS.has(p.id)) badges.push('<span class="badge badge--new">NEW</span>');
    else if (opts.hot) badges.push('<span class="badge badge--hot">HOT</span>');
    const brandColor = COLORS[hashColor(p.b)].c;
    const added = cart[p.id] ? ' is-added' : '';
    return `<article class="card${opts.reveal ? ' reveal' : ''}" ${opts.reveal ? `data-from="${opts.reveal}"` : ''} style="--d:${opts.delay || 0}s" data-id="${p.id}">
      <div class="card__media" data-quick="${p.id}">
        <div class="card__badges">${badges.join('')}</div>
        <img src="${esc(p.i)}" alt="${esc(p.n)}" loading="lazy" width="300" height="300">
        <button class="card__quick" data-quick="${p.id}" type="button">${icon('eye', 'icon', 2.4).replace('class="icon"', 'class="icon" style="width:16px;height:16px"')} Quick look</button>
      </div>
      <button class="card__fav${favs.has(p.id) ? ' is-on' : ''}" data-fav="${p.id}" type="button" aria-label="Add to wishlist">${icon('heart', 'icon', 2.2).replace('class="icon"', 'class="icon" style="width:20px;height:20px"')}</button>
      <div class="card__body">
        ${p.b ? `<div class="card__brand" style="--c:${brandColor}">${esc(brandName(p.b))}</div>` : ''}
        <h3 class="card__name" data-quick="${p.id}">${esc(p.n)}</h3>
        <div class="card__foot">
          ${priceHTML(p)}
          ${p.p ? `<button class="add-btn${added}" data-add="${p.id}" type="button" aria-label="Add ${esc(p.n)} to cart">
            ${icon('cart', 'icon i-cart', 2.4)}${icon('check', 'icon i-check', 3)}
          </button>` : `<a class="ask-btn" href="tel:+9613720233" aria-label="Call the store about ${esc(p.n)}">${icon('phone', 'icon', 2.4)}</a>`}
        </div>
      </div>
    </article>`;
  }

  /* ==========================================================================
     Header / nav / footer markup
     ========================================================================== */
  const shopUrl = params => 'shop.html' + (params ? '?' + new URLSearchParams(params).toString() : '');
  const countBy = f => P.filter(f).length;

  function megaCategories() {
    const cols = [
      { title: 'Toys', color: 'red', links: [['Building Sets', { cat: 'building' }], ['Dolls & Dollhouses', { cat: 'dolls' }], ['Cars & RC', { cat: 'vehicles' }], ['Figures & Collectibles', { cat: 'figures' }], ['Plush & Soft Toys', { cat: 'plush' }], ['Pretend Play', { cat: 'pretend' }]] },
      { title: 'Learn & Create', color: 'green', links: [['STEM & Learning', { cat: 'stem' }], ['Arts & Crafts', { cat: 'creative' }], ['Games & Puzzles', { cat: 'games' }], ['Play-Doh', { brand: 'PLAY-DOH' }], ['Nail Art & Beauty', { q: 'nail' }], ['Drawing & Tracing', { q: 'draw' }]] },
      { title: 'Baby', color: 'pink', links: [['All Baby & Toddler', { cat: 'baby' }], ['Rockers & Bouncers', { q: 'rocker' }], ['Car Seats', { q: 'car seat' }], ['Feeding', { brand: 'TOMMEE TIPPEE' }], ['Pillows & Sleep', { brand: 'DOOMOO' }], ['Play Gyms & Mats', { q: 'mat' }]] },
      { title: 'Outdoor', color: 'blue', links: [['All Outdoor & Pool', { cat: 'outdoor' }], ['Pools', { q: 'pool' }], ['Slides & Swings', { q: 'slide' }], ['Playhouses', { q: 'playhouse' }], ['Bicycles', { q: 'bicycle' }], ['Ride-on Cars', { cat: 'rideon' }]] },
    ];
    return `<div class="mega"><div class="wrap mega__inner">
      ${cols.map(c => `<div class="mega__col" style="${colorVars(c.color)}"><h4>${c.title}</h4>${c.links.map(([t, q]) => `<a href="${shopUrl(q)}">${t}</a>`).join('')}</div>`).join('')}
      <a class="mega__promo" href="${shopUrl({ sale: 1 })}">
        <img src="${esc(imgOf(54021))}" alt="">
        <h3>Offer Zone</h3><p>Real savings on ${countBy(p => p.o)} toys right now</p>
      </a>
    </div></div>`;
  }
  function megaAges() {
    return `<div class="mega"><div class="wrap mega__tiles">${AGES.map(a => `<a class="mega__tile" style="${colorVars(a.color)}" href="${shopUrl({ age: a.key })}"><big>${a.num}</big>${a.unit}<small>${a.label}</small></a>`).join('')}</div></div>`;
  }
  function megaBrands() {
    return `<div class="mega"><div class="wrap mega__brands">${[...BRANDS].sort((a, b) => !!b.logo - !!a.logo).slice(0, 23).map(b => `<a href="${shopUrl({ brand: b.key })}" style="${colorVars(b.color)}"${b.logo ? ' class="has-logo"' : ''}>${b.logo ? brandLogo(b) : esc(b.name)}</a>`).join('')}<a href="brands.html" style="${colorVars('navy')}">All ${BRANDS.length} brands →</a></div></div>`;
  }
  function megaChars() {
    return `<div class="mega"><div class="wrap mega__tiles mega__tiles--chars">${CHARACTERS.map(c => `<a class="mega__tile" style="${colorVars(c.color)}" href="${shopUrl({ char: c.key })}"><img src="${esc(imgOf(c.img, p => p.h.includes(c.key)))}" alt="" loading="lazy">${esc(c.name)}</a>`).join('')}</div></div>`;
  }

  function headerHTML(current) {
    const maxOff = Math.max(0, ...P.filter(p => p.o).map(p => Math.round((1 - p.p / p.o) * 100)));
    const navIcon = (name, color) => `<span class="nav__emoji" style="${colorVars(color)}">${icon(name, '', 2.4)}</span>`;
    return `
    <div class="ticker" role="region" aria-label="Store announcements"><div class="ticker__track">
      ${[0, 1].map(() => `
        <span class="ticker__item"><span class="ticker__dot" style="--c:var(--sun)"></span>Save <b>12%</b> today with code <b>TILLO12</b> at checkout</span>
        <span class="ticker__item"><span class="ticker__dot" style="--c:var(--green)"></span><b>Free delivery</b> on orders above 50 $</span>
        <span class="ticker__item"><span class="ticker__dot" style="--c:var(--pink)"></span>Holiday wishlists are open — find the perfect gift with our <b>Gift Finder</b></span>
        <span class="ticker__item"><span class="ticker__dot" style="--c:var(--blue)"></span>Visit our store in <b>Mazraat Yachouh</b>, Chattat Center</span>
        <span class="ticker__item"><span class="ticker__dot" style="--c:var(--red)"></span>Up to <b>${maxOff}% off</b> in the Offer Zone</span>`).join('')}
    </div></div>
    <header class="header" id="header">
      <div class="wrap header__row">
        <button class="burger" data-open="menu" aria-label="Open menu">${icon('menu')}</button>
        <a class="logo" href="index.html" aria-label="Enfantillage home"><img src="assets/img/logo.png" alt="Enfantillage" width="700" height="400"></a>
        <div class="search" id="search">
          <form class="search__box" action="shop.html" role="search">
            <input class="search__input" name="q" type="search" autocomplete="off" placeholder="Search toys, brands, characters…" aria-label="Search">
            <button class="search__btn" type="submit" aria-label="Search">${icon('search', 'icon', 2.6)}</button>
          </form>
          <div class="search__suggest" id="suggest"></div>
        </div>
        <nav class="actions" aria-label="Account">
          <a class="action action--hide-sm" href="https://enfantillagestore.com/my-account/">${icon('user')}<span class="action__label">Account</span></a>
          <a class="action" href="${shopUrl({ fav: 1 })}" id="favAction">${icon('heart')}<span class="action__label">Wishlist</span><span class="action__count" data-fav-count>0</span></a>
          <button class="action" data-open="cart" id="cartAction">${icon('cart')}<span class="action__label">Cart</span><span class="action__count" data-cart-count>0</span></button>
        </nav>
      </div>
      <nav class="nav" aria-label="Main">
        <div class="wrap"><ul class="nav__list">
          <li class="nav__item" style="--c:var(--red)"><a class="nav__link" href="${shopUrl()}">${navIcon('grid', 'red')}Categories ${icon('down', 'caret', 3)}</a>${megaCategories()}</li>
          <li class="nav__item" style="--c:var(--blue)"><a class="nav__link" href="index.html#ages">${navIcon('star', 'blue')}Shop by Age ${icon('down', 'caret', 3)}</a>${megaAges()}</li>
          <li class="nav__item" style="--c:var(--green)"><a class="nav__link" href="index.html#brands">${navIcon('tag', 'green')}Brands ${icon('down', 'caret', 3)}</a>${megaBrands()}</li>
          <li class="nav__item" style="--c:var(--pink)"><a class="nav__link" href="index.html#characters">${navIcon('sparkle', 'pink')}Characters ${icon('down', 'caret', 3)}</a>${megaChars()}</li>
          <li class="nav__item" style="--c:var(--pink)"><a class="nav__link${current === 'baby' ? ' is-current' : ''}" href="${shopUrl({ cat: 'baby' })}">Baby</a></li>
          <li class="nav__item" style="--c:var(--blue)"><a class="nav__link${current === 'outdoor' ? ' is-current' : ''}" href="${shopUrl({ cat: 'outdoor' })}">Outdoor & Pool</a></li>
          <li class="nav__item" style="--c:var(--teal)"><a class="nav__link" href="index.html#gift-finder">Gift Finder</a></li>
          <li class="nav__item nav__item--offer"><a class="nav__link" href="${shopUrl({ sale: 1 })}">Offer Zone <span class="nav__pill">-${maxOff}%</span></a></li>
        </ul></div>
      </nav>
    </header>

    <div class="drawer-backdrop" data-close></div>
    <aside class="drawer drawer--left" id="menuDrawer" aria-label="Menu">
      <div class="drawer__head"><img src="assets/img/logo.png" alt="Enfantillage" style="height:52px"><button class="drawer__close" data-close aria-label="Close menu">${icon('x')}</button></div>
      <div class="drawer__body">
        ${macc('Categories', 'red', CATEGORIES.map(c => [c.name, shopUrl({ cat: c.key })]))}
        ${macc('Shop by Age', 'blue', AGES.map(a => [`${a.num} years · ${a.label}`, shopUrl({ age: a.key })]))}
        ${macc('Brands', 'green', [...BRANDS.filter(b => b.n >= 5).map(b => [b.name, shopUrl({ brand: b.key })]), [`All ${BRANDS.length} brands →`, 'brands.html']])}
        ${macc('Characters', 'pink', CHARACTERS.map(c => [c.name, shopUrl({ char: c.key })]))}
        <a class="macc__btn" href="index.html#gift-finder"><span><span class="dot" style="--c:var(--teal)"></span>Gift Finder</span></a>
        <a class="macc__btn" href="${shopUrl({ sale: 1 })}" style="color:var(--red)"><span><span class="dot"></span>Offer Zone</span><span class="nav__pill">-${maxOff}%</span></a>
      </div>
      <div class="drawer__foot" style="display:flex;gap:10px">
        <a class="btn btn--navy btn--sm" href="https://enfantillagestore.com/my-account/">${icon('user', 'icon', 2.4)} My account</a>
        <a class="btn btn--pink btn--sm" href="tel:+9613720233">${icon('phone', 'icon', 2.4)} Call us</a>
      </div>
    </aside>

    <aside class="drawer drawer--right" id="cartDrawer" aria-label="Shopping cart">
      <div class="drawer__head"><h3>Your Toy Box</h3><button class="drawer__close" data-close aria-label="Close cart">${icon('x')}</button></div>
      <div class="drawer__body" id="cartBody"></div>
      <div class="drawer__foot" id="cartFoot"></div>
    </aside>

    <div class="modal" id="quick" aria-hidden="true">
      <div class="modal__backdrop" data-close-modal></div>
      <div class="modal__card" role="dialog" aria-modal="true" aria-label="Product quick view"></div>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"><i>${icon('check', 'icon', 3).replace('class="icon"', 'class="icon" style="width:16px;height:16px"')}</i><span></span></div>
    `;
  }
  function macc(title, color, links) {
    return `<div class="macc" style="--c:var(--${color})"><button class="macc__btn" type="button"><span><span class="dot"></span>${title}</span>${icon('down', 'icon', 2.6)}</button><div class="macc__panel"><div>${links.map(([t, u]) => `<a href="${u}">${esc(t)}</a>`).join('')}</div></div></div>`;
  }

  function footerHTML() {
    return `
    <footer class="footer">
      <svg class="wave" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48V24C120 0 240 0 360 16s240 32 360 16S960 0 1080 8s240 32 360 24v16z" fill="currentColor"/></svg>
      <div class="wrap footer__grid">
        <div>
          <a class="footer__logo" href="index.html"><img src="assets/img/logo.png" alt="Enfantillage"></a>
          <p>Lebanon’s happy place for toys, games, baby essentials and outdoor fun — big brands, little prices, endless smiles.</p>
          <div class="socials">
            <a href="https://www.facebook.com/enfantillagestore/" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>
            <a href="https://www.instagram.com/enfantillagestore/" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>
          </div>
        </div>
        <div><h4>Shop</h4><ul>
          <li><a href="${shopUrl({ cat: 'baby' })}">Baby & Toddler</a></li>
          <li><a href="${shopUrl({ cat: 'outdoor' })}">Outdoor & Pool</a></li>
          <li><a href="${shopUrl({ cat: 'rideon' })}">Ride-ons & Bikes</a></li>
          <li><a href="${shopUrl({ cat: 'building' })}">Building Sets</a></li>
          <li><a href="${shopUrl({ sale: 1 })}">Offer Zone</a></li>
        </ul></div>
        <div><h4>Help</h4><ul>
          <li><a href="https://enfantillagestore.com/about-us/">About us</a></li>
          <li><a href="https://enfantillagestore.com/contact-us/">Contact us</a></li>
          <li><a href="https://enfantillagestore.com/delivery-policy/">Delivery Policy</a></li>
          <li><a href="https://enfantillagestore.com/return-policy/">Return Policy</a></li>
          <li><a href="https://enfantillagestore.com/faq/">FAQ</a></li>
        </ul></div>
        <div><h4>Visit us</h4><ul class="footer__contact">
          <li>${icon('pin')}<span>Mazraat Yachouh, Chattat Center, Lebanon</span></li>
          <li>${icon('phone')}<span><a href="tel:+9614921863">+961 4 921 863</a><br><a href="tel:+9613720233">+961 3 720 233</a></span></li>
        </ul></div>
      </div>
      <div class="wrap footer__bottom">
        <span>© ${new Date().getFullYear()} Enfantillage sarl. All rights reserved.</span>
        <span class="pay"><span>VISA</span><span>Mastercard</span><span>Cash on delivery</span></span>
      </div>
    </footer>
    <button class="to-top" id="toTop" aria-label="Back to top">${balloon('#e8222b', 56)}</button>
    <nav class="mbar" aria-label="Quick links">
      <a href="index.html" class="${location.pathname.endsWith('shop.html') ? '' : 'is-current'}">${icon('home')}Home</a>
      <button type="button" data-open="menu">${icon('grid')}Shop</button>
      <a href="index.html#gift-finder">${icon('gift')}Gifts</a>
      <a href="${shopUrl({ fav: 1 })}">${icon('heart')}Wishlist<span class="action__count" data-fav-count>0</span></a>
      <button type="button" data-open="cart" id="mCartAction">${icon('cart')}Cart<span class="action__count" data-cart-count>0</span></button>
    </nav>`;
  }

  /* ==========================================================================
     Cart + wishlist
     ========================================================================== */
  const FREE_SHIP = 50;
  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => Object.entries(cart).reduce((s, [id, q]) => s + (byId.get(+id)?.p || 0) * q, 0);

  function syncCounts() {
    const n = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = n; el.classList.toggle('has-items', n > 0); });
    document.querySelectorAll('[data-fav-count]').forEach(el => { el.textContent = favs.size; el.classList.toggle('has-items', favs.size > 0); });
  }

  function renderCart() {
    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    if (!body) return;
    const lines = Object.entries(cart).filter(([id]) => byId.has(+id));
    const total = cartTotal();
    if (!lines.length) {
      body.innerHTML = `<div class="cart-empty">${balloon('#00a6e4', 90)}<h3 style="color:var(--navy);font-size:24px;margin:10px 0 4px">Your toy box is empty!</h3><p>Let’s fill it with something fun.</p><br><a class="btn btn--red" href="shop.html">Start shopping</a></div>`;
      foot.innerHTML = '';
      return;
    }
    const left = Math.max(0, FREE_SHIP - total);
    body.innerHTML = `
      <div class="ship-meter">${left > 0 ? `You’re only <b>${money(left)}</b> away from <b>free delivery!</b>` : 'Woohoo! You’ve unlocked <b>free delivery</b>'}
        <div class="ship-meter__bar"><div class="ship-meter__fill" style="width:${Math.min(100, (total / FREE_SHIP) * 100)}%"></div></div></div>
      ${lines.map(([id, q]) => { const p = byId.get(+id); return `
        <div class="cart-line">
          <img src="${esc(p.i)}" alt="">
          <div><h5>${esc(p.n)}</h5><small>${esc(brandName(p.b))}</small><br>
            <span class="qty"><button type="button" data-qty="${p.id}" data-d="-1" aria-label="Decrease">−</button><span>${q}</span><button type="button" data-qty="${p.id}" data-d="1" aria-label="Increase">+</button></span>
          </div>
          <div class="cart-line__price">${money(p.p * q)}</div>
        </div>`; }).join('')}`;
    foot.innerHTML = `<div class="cart-total"><span>Subtotal</span><span>${money(total)}</span></div>
      <p style="font-size:13px;color:var(--ink-soft);margin-bottom:12px">Use code <b style="color:var(--red)">TILLO12</b> at checkout to save 12%.</p>
      <button class="btn btn--green" style="width:100%" type="button" data-checkout>Checkout ${icon('arrow', 'icon', 2.6)}</button>`;
  }

  function addToCart(id, fromEl) {
    if (!byId.get(id)?.p) return;
    cart[id] = (cart[id] || 0) + 1;
    store.set('enf_cart', cart);
    renderCart();
    flyToCart(id, fromEl);
    document.querySelectorAll(`[data-add="${id}"]`).forEach(b => b.classList.add('is-added'));
    const p = byId.get(id);
    toast(`<b>${esc(p.n.length > 38 ? p.n.slice(0, 36) + '…' : p.n)}</b> added to your toy box`);
  }
  function setQty(id, d) {
    cart[id] = (cart[id] || 0) + d;
    if (cart[id] <= 0) { delete cart[id]; document.querySelectorAll(`[data-add="${id}"]`).forEach(b => b.classList.remove('is-added')); }
    store.set('enf_cart', cart);
    renderCart(); syncCounts();
  }
  function toggleFav(id, btn) {
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    store.set('enf_favs', [...favs]);
    document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => {
      b.classList.toggle('is-on', favs.has(id));
      if (favs.has(id)) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
    });
    syncCounts();
    if (favs.has(id) && btn) burst(btn, ['#ec1c8c', '#e8222b', '#ffc83d'], 10);
    document.dispatchEvent(new CustomEvent('favs:change'));
  }

  function visibleCartTarget() {
    const m = document.getElementById('mCartAction');
    if (m && m.offsetParent !== null) return m;
    return document.getElementById('cartAction');
  }
  function flyToCart(id, fromEl) {
    const target = visibleCartTarget();
    const finish = () => { syncCounts(); if (target) { target.classList.remove('bump'); void target.offsetWidth; target.classList.add('bump'); } };
    const src = fromEl && (fromEl.closest('.card')?.querySelector('.card__media img') || fromEl.closest('.modal__card')?.querySelector('#qvMain'));
    if (!src || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly';
    fly.innerHTML = `<img src="${esc(byId.get(id).i)}" alt="">`;
    const sx = a.left + a.width / 2 - 35, sy = a.top + a.height / 2 - 35;
    const ex = b.left + b.width / 2 - 35, ey = b.top + b.height / 2 - 35;
    fly.style.left = sx + 'px'; fly.style.top = sy + 'px';
    document.body.appendChild(fly);
    const dx = ex - sx, dy = ey - sy;
    fly.animate([
      { transform: 'translate(0,0) scale(1.2)', opacity: 1 },
      { transform: `translate(${dx * .5}px, ${dy * .5 - 140}px) scale(.9) rotate(-20deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.2) rotate(15deg)`, opacity: .6 },
    ], { duration: 850, easing: 'cubic-bezier(.5,0,.4,1)' }).onfinish = () => { fly.remove(); finish(); };
  }

  /* confetti burst from an element (or the center of the screen) */
  function burst(el, colors = ['#e8222b', '#3db54a', '#00a6e4', '#ec1c8c', '#ffc83d', '#12b5c1'], n = 40) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const c = document.createElement('i');
      c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      c.style.left = cx + 'px'; c.style.top = cy + 'px';
      if (i % 3 === 0) c.style.borderRadius = '50%';
      document.body.appendChild(c);
      const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * (n > 20 ? 220 : 70);
      const tx = Math.cos(ang) * dist, ty = Math.sin(ang) * dist - 60;
      c.animate([
        { transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(${tx * 1.1}px, ${ty + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ], { duration: 1100 + Math.random() * 600, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => c.remove();
    }
  }

  let toastTimer;
  function toast(html) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.querySelector('span').innerHTML = html;
    t.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-shown'), 2600);
  }

  /* ==========================================================================
     Quick view
     ========================================================================== */
  let lastFocus;
  /* descriptions + gallery live in details.json, fetched the first time someone opens a quick view */
  let detailsP;
  const loadDetails = () => detailsP || (detailsP = fetch('assets/data/details.json').then(r => r.json()).catch(() => ({})));

  function openQuick(id) {
    const p = byId.get(id);
    if (!p) return;
    const m = document.getElementById('quick');
    const pct = p.o ? Math.round((1 - p.p / p.o) * 100) : 0;
    const cats = CATEGORIES.filter(c => p.c.includes(c.key));
    const ages = AGES.filter(a => p.a.includes(a.key));
    const chars = CHARACTERS.filter(c => p.h.includes(c.key));
    const shots = Array.from({ length: p.g || 1 }, (_, k) => imgLg(p, k));
    m.querySelector('.modal__card').innerHTML = `
      <button class="drawer__close modal__close" data-close-modal aria-label="Close">${icon('x')}</button>
      <div class="modal__media">
        <div class="gallery__main"><img src="${esc(shots[0])}" alt="${esc(p.n)}" id="qvMain"></div>
        ${shots.length > 1 ? `<div class="gallery__thumbs">${shots.map((src, k) => `<button type="button" class="gallery__thumb${k ? '' : ' is-on'}" data-shot="${esc(src)}" aria-label="Picture ${k + 1} of ${shots.length}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      </div>
      <div class="modal__info">
        ${p.b ? `<a class="card__brand" style="--c:${COLORS[hashColor(p.b)].c}" href="${shopUrl({ brand: p.b })}">${esc(brandName(p.b))}</a>` : ''}
        <h3>${esc(p.n)}</h3>
        <div class="modal__meta">
          ${ages.map(a => `<span style="${colorVars(a.color)}">Ages ${a.num}</span>`).join('')}
          ${cats.map(c => `<span style="${colorVars(c.color)}">${c.name}</span>`).join('')}
          ${chars.map(c => `<span style="${colorVars(c.color)}">${c.name}</span>`).join('')}
        </div>
        ${p.p ? `<div class="modal__price">${p.v ? '<small>from</small> ' : ''}${money(p.p)}${p.o ? `<s>${money(p.o)}</s> <span class="badge badge--sale" style="vertical-align:middle">-${pct}%</span>` : ''}</div>`
              : '<div class="modal__price price--ask">Ask in store for the price</div>'}
        <span class="stock${p.s ? '' : ' is-out'}">${p.s ? 'In stock — ready to play' : 'Out of stock'}</span>
        <div class="modal__desc" id="qvDesc"><span class="modal__loading">Loading details…</span></div>
        <div class="modal__actions">
          ${p.p ? `<button class="btn btn--red" type="button" data-add="${p.id}">${icon('cart', 'icon', 2.4)} Add to cart</button>`
                : `<a class="btn btn--red" href="tel:+9613720233">${icon('phone', 'icon', 2.4)} Call the store</a>`}
          <button class="btn btn--white" type="button" data-fav-btn="${p.id}">${icon('heart', 'icon', 2.4)} ${favs.has(p.id) ? 'Saved' : 'Wishlist'}</button>
        </div>
        <p class="modal__note">Free delivery on orders above 50 $. Save 12% with code <b>TILLO12</b>.${p.v ? ' This toy comes in several options; choose yours at checkout.' : ''}</p>
      </div>`;
    loadDetails().then(all => {
      const d = all[p.id];
      const box = m.querySelector('#qvDesc');
      if (!box || m.querySelector('#qvMain')?.alt !== p.n) return;   // another product was opened meanwhile
      box.innerHTML = d && d.d
        ? `<p>${esc(d.d).replace(/\n/g, '<br>')}</p>${d.sku ? `<small>Ref. ${esc(d.sku)}</small>` : ''}`
        : (d && d.sku ? `<small>Ref. ${esc(d.sku)}</small>` : '');
    });
    lastFocus = document.activeElement;
    m.classList.add('is-open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => m.querySelector('.modal__close').focus(), 50);
  }
  function closeQuick() {
    const m = document.getElementById('quick');
    if (!m.classList.contains('is-open')) return;
    m.classList.remove('is-open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus && lastFocus.focus();
  }

  /* ==========================================================================
     Drawers
     ========================================================================== */
  function openDrawer(which) {
    const d = document.getElementById(which === 'cart' ? 'cartDrawer' : 'menuDrawer');
    if (which === 'cart') renderCart();
    d.classList.add('is-open');
    document.querySelector('.drawer-backdrop').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawers() {
    document.querySelectorAll('.drawer.is-open, .filters.is-open').forEach(d => d.classList.remove('is-open'));
    document.querySelector('.drawer-backdrop')?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     Search: animated placeholder + live suggestions
     ========================================================================== */
  function initSearch() {
    const wrap = document.getElementById('search');
    const input = wrap.querySelector('input');
    const box = document.getElementById('suggest');
    const prompts = ['Search for LEGO…', 'Search for Barbie…', 'Search for Super Mario…', 'Search for pools…', 'Search for bikes…', 'Search for Play-Doh…', 'Search for baby rockers…'];
    let pi = 0, ci = 0, del = false, timer;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function typeLoop() {
      if (document.activeElement === input || input.value) { timer = setTimeout(typeLoop, 800); return; }
      const word = prompts[pi];
      ci += del ? -1 : 1;
      input.placeholder = word.slice(0, ci) || ' ';
      let wait = del ? 35 : 70;
      if (!del && ci === word.length) { del = true; wait = 1600; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % prompts.length; wait = 300; }
      timer = setTimeout(typeLoop, wait);
    }
    if (!reduce) typeLoop();

    const popular = [['LEGO', { brand: 'LEGO' }], ['Barbie', { char: 'barbie' }], ['Super Mario', { char: 'mario' }], ['Pools', { q: 'pool' }], ['Bicycles', { q: 'bicycle' }], ['Play-Doh', { brand: 'PLAY-DOH' }], ['Stitch', { char: 'stitch' }], ['Cozy Coupe', { q: 'cozy coupe' }]];
    let active = -1;
    function render() {
      const q = input.value.trim().toLowerCase();
      active = -1;
      if (!q) {
        box.innerHTML = `<div class="suggest__label">Popular right now</div><div class="suggest__chips">${popular.map(([t, p]) => `<a class="suggest__chip" href="${shopUrl(p)}">${t}</a>`).join('')}</div>
          <div class="suggest__label">Trending toys</div>${P.slice(0, 4).map(itemHTML).join('')}`;
        return;
      }
      const terms = q.split(/\s+/);
      const hit = p => { const s = (p.n + ' ' + p.b).toLowerCase(); return terms.every(t => s.includes(t)); };
      const prods = P.filter(hit).slice(0, 6);
      const brands = BRANDS.filter(b => b.name.toLowerCase().includes(q)).slice(0, 4).map(b => [b.name, { brand: b.key }]);
      const chars = CHARACTERS.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3).map(c => [c.name, { char: c.key }]);
      const cats = CATEGORIES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3).map(c => [c.name, { cat: c.key }]);
      const chips = [...cats, ...chars, ...brands];
      box.innerHTML = (chips.length ? `<div class="suggest__label">Jump to</div><div class="suggest__chips">${chips.map(([t, p]) => `<a class="suggest__chip" href="${shopUrl(p)}">${esc(t)}</a>`).join('')}</div>` : '') +
        (prods.length ? `<div class="suggest__label">Toys</div>${prods.map(itemHTML).join('')}<a class="suggest__chip" style="display:block;text-align:center;margin:8px" href="${shopUrl({ q: input.value.trim() })}">See all results for “${esc(input.value.trim())}”</a>`
          : `<div class="suggest__empty">${balloon('#ec1c8c', 36)}<br>No toys found for “${esc(input.value)}” — try another word!</div>`);
    }
    const itemHTML = p => `<a class="suggest__item" href="#" data-quick="${p.id}"><img src="${esc(p.i)}" alt=""><span><small>${esc(brandName(p.b))}</small>${esc(p.n)}</span><b>${p.p ? money(p.p) : 'Ask'}</b></a>`;
    input.addEventListener('focus', () => { render(); wrap.classList.add('is-open'); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', e => {
      const items = [...box.querySelectorAll('.suggest__item')];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle('is-active', i === active));
      } else if (e.key === 'Enter' && active >= 0 && items[active]) {
        e.preventDefault(); openQuick(+items[active].dataset.quick); wrap.classList.remove('is-open');
      } else if (e.key === 'Escape') { wrap.classList.remove('is-open'); input.blur(); }
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) wrap.classList.remove('is-open'); });
    const urlQ = new URLSearchParams(location.search).get('q');
    if (urlQ) input.value = urlQ;
  }

  /* ==========================================================================
     Scroll: header shrink, reveal, parallax, back-to-top
     ========================================================================== */
  let revealObserver;
  function observeReveals(root = document) {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }
    root.querySelectorAll('.reveal:not(.is-in)').forEach(el => revealObserver.observe(el));
  }

  function initScroll() {
    const header = document.getElementById('header');
    const toTop = document.getElementById('toTop');
    const paras = [...document.querySelectorAll('[data-speed]')];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticking = false;
    function onScroll() {
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      toTop.classList.toggle('is-shown', y > 900);
      if (!reduce) {
        const vh = innerHeight;
        paras.forEach(el => {
          const host = el.offsetParent || el.parentElement;
          const r = host.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const progress = (r.top + r.height / 2 - vh / 2);
          el.style.transform = `translate3d(0, ${progress * parseFloat(el.dataset.speed)}px, 0) rotate(${progress * (parseFloat(el.dataset.rot) || 0)}deg)`;
        });
      }
      ticking = false;
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* horizontal rails with arrow buttons */
  function initRail(wrapEl) {
    const rail = wrapEl.querySelector('.rail');
    const prev = wrapEl.querySelector('.arrow-btn--prev');
    const next = wrapEl.querySelector('.arrow-btn--next');
    if (!rail || !prev || !next) return;
    const update = () => {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    };
    const step = () => Math.max(rail.clientWidth * 0.8, 240);
    prev.onclick = () => rail.scrollBy({ left: -step(), behavior: 'smooth' });
    next.onclick = () => rail.scrollBy({ left: step(), behavior: 'smooth' });
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    // drag-to-scroll with a mouse (touch already scrolls natively)
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.style.scrollSnapType = 'none'; rail.style.scrollBehavior = 'auto'; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) moved = true; rail.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; rail.style.scrollSnapType = ''; rail.style.scrollBehavior = ''; });
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    rail._update = update;
  }

  /* ==========================================================================
     Global event delegation
     ========================================================================== */
  function initEvents() {
    document.addEventListener('click', e => {
      const t = e.target;
      const add = t.closest('[data-add]');
      if (add) { e.preventDefault(); addToCart(+add.dataset.add, add); return; }
      const fav = t.closest('[data-fav]');
      if (fav) { e.preventDefault(); toggleFav(+fav.dataset.fav, fav); return; }
      const favBtn = t.closest('[data-fav-btn]');
      if (favBtn) { const id = +favBtn.dataset.favBtn; toggleFav(id, favBtn); favBtn.lastChild.textContent = favs.has(id) ? ' Saved' : ' Wishlist'; return; }
      const shot = t.closest('[data-shot]');
      if (shot) {
        const main = document.getElementById('qvMain');
        main.src = shot.dataset.shot;
        main.animate([{ opacity: .3, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'ease-out' });
        shot.parentElement.querySelectorAll('.gallery__thumb').forEach(b => b.classList.toggle('is-on', b === shot));
        return;
      }
      const quick = t.closest('[data-quick]');
      if (quick) { e.preventDefault(); document.getElementById('search').classList.remove('is-open'); openQuick(+quick.dataset.quick); return; }
      const qty = t.closest('[data-qty]');
      if (qty) { setQty(+qty.dataset.qty, +qty.dataset.d); return; }
      const open = t.closest('[data-open]');
      if (open) { openDrawer(open.dataset.open); return; }
      if (t.closest('[data-close]')) { closeDrawers(); return; }
      if (t.closest('[data-close-modal]')) { closeQuick(); return; }
      if (t.closest('[data-checkout]')) { burst(t.closest('[data-checkout]')); toast('Checkout will connect to the live WooCommerce store'); return; }
      const acc = t.closest('.macc__btn');
      if (acc && acc.tagName === 'BUTTON') { acc.parentElement.classList.toggle('is-open'); return; }
      if (t.closest('.mbar a[href*="#"], .drawer a[href*="#"]')) closeDrawers();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeQuick(); closeDrawers(); } });
  }

  /* ==========================================================================
     Boot
     ========================================================================== */
  function boot() {
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if (h) h.outerHTML = headerHTML(document.body.dataset.current);
    if (f) f.outerHTML = footerHTML();
    initEvents();
    initSearch();
    syncCounts();
    renderCart();
    document.dispatchEvent(new CustomEvent('site:ready'));
    initScroll();
    observeReveals();
  }

  window.ENF = {
    P, byId, COLORS, colorVars, hashColor, CATEGORIES, AGES, BRANDS, CHARACTERS,
    brandMatch, brandLogo, imgOf, imgLg, priceHTML, titleCase, icon, balloon, starSvg, esc, money, brandName, card, shopUrl,
    observeReveals, initRail, burst, toast, NEW_IDS, getFavs: () => favs,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
