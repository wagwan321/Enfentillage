/* ==========================================================================
   Tillo, the Enfantillage mascot — he lives all over the site.
   - corner buddy: hops up with a page-specific tip and a "new message" badge
   - homepage: welcome card, peeks over section titles, points at the Gift
     Finder and the club sign-up
   - shop/brands heroes, product tip card, checkout, cart drawer, footer
   - tap any Tillo and he jumps and says something
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { tillo, shopUrl, icon, money } = window.ENF;
  const XMAS = window.ENF_THEME === 'christmas';
  const page = document.body.dataset.current || 'home';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
               set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

  /* ---------- tap any Tillo: he jumps and says something ---------- */
  const QUIPS = XMAS
    ? ['Ho ho ho!', 'Merry Christmas!', 'Wheee!', 'Jingle bells!', 'Let it snow!', 'Gifts for everyone!']
    : ['Hi there!', 'Wheee!', 'Let’s play!', 'Boing!', 'You’re awesome!', 'Toys toys toys!'];
  let q = 0;
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-tillo]');
    if (!t || t.closest('.tillo-peek')) return;
    t.classList.remove('is-boing'); void t.offsetWidth; t.classList.add('is-boing');
    say(t, QUIPS[q++ % QUIPS.length]);
    window.ENF.burst(t, XMAS ? ['#c8102e', '#1f8a3e', '#f2b705', '#fff'] : undefined, 14);
  });
  function say(el, text) {
    const b = document.createElement('span');
    b.className = 'tillo-quip';
    b.textContent = text;
    const r = el.getBoundingClientRect();
    b.style.left = (r.left + r.width / 2) + 'px';
    b.style.top = (r.top - 8) + 'px';
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1600);
  }

  /* ---------- corner buddy ---------- */
  const TIPS = {
    home: XMAS
      ? [['Ho ho ho! I’m Tillo. Want help picking a Christmas gift?', 'Open the Gift Finder', 'index.html#gift-finder'],
         ['Psst… my code TILLO12 takes 12% off your Christmas shopping!', 'See the offers', shopUrl({ sale: 1 })],
         ['Gift wrapping is on request: just tick it at checkout.', 'Start shopping', 'shop.html']]
      : [['Hi, I’m Tillo! Need a gift idea? I can help.', 'Open the Gift Finder', 'index.html#gift-finder'],
         ['Psst… use my code TILLO12 to save 12% today!', 'See the offers', shopUrl({ sale: 1 })],
         ['Free delivery on orders above 50 $, anywhere in Lebanon.', 'Start shopping', 'shop.html']],
    shop: [['Use the filters to shop by age, brand or character!', '', ''],
           ['Free delivery on orders above 50 $!', '', ''],
           ['Tap the heart to save toys for later.', 'My wishlist', shopUrl({ fav: 1 })]],
    product: [['Want it later? Tap the heart and it goes to your wishlist.', '', ''],
              ['Pay when it arrives: cash on delivery or Whish Money.', '', ''],
              ['Use my code TILLO12 at checkout to save 12%.', '', '']],
    brands: [['Looking for a brand? Type its name in the box above!', '', ''],
             ['Tap any logo to see all of that brand’s toys.', '', '']],
    checkout: [['Don’t forget my code TILLO12 for 12% off!', '', ''],
               ['Want it gift-wrapped? Tick the box under the address.', '', '']],
  };
  const tips = TIPS[page] || TIPS.home;
  let tipIndex = 0;

  const peek = document.createElement('div');
  peek.className = 'tillo-peek';
  peek.innerHTML = `
    <div class="tillo-peek__bubble" role="status" aria-live="polite">
      <button class="tillo-peek__x" type="button" aria-label="Close Tillo’s message">${icon('x', 'icon', 2.8)}</button>
      <b class="tillo-peek__name">Tillo</b>
      <p class="tillo-peek__msg"></p>
      <a class="tillo-peek__cta btn btn--red btn--sm" href="#"></a>
    </div>
    <button class="tillo-peek__body" type="button" aria-label="Talk to Tillo">
      ${tillo('tillo--peek', 150)}
      <span class="tillo-peek__badge" aria-hidden="true">1</span>
    </button>`;
  document.body.appendChild(peek);
  const msg = peek.querySelector('.tillo-peek__msg');
  const cta = peek.querySelector('.tillo-peek__cta');
  const closedKey = 'tillo_closed_' + page;

  function showTip(i) {
    const [m, label, href] = tips[i % tips.length];
    msg.textContent = m;
    cta.hidden = !label;
    if (label) { cta.textContent = label; cta.href = href; }
    peek.classList.add('is-talking');
    peek.classList.remove('has-news');
  }
  function hush() { peek.classList.remove('is-talking'); }
  function appear() {
    if (peek.classList.contains('is-up')) return;
    peek.classList.add('is-up');
    if (ss.get(closedKey)) { peek.classList.add('has-news'); return; }
    setTimeout(() => showTip(tipIndex), reduce ? 0 : 900);
  }
  peek.querySelector('.tillo-peek__body').addEventListener('click', () => {
    const fig = peek.querySelector('[data-tillo]');
    fig.classList.remove('is-boing'); void fig.offsetWidth; fig.classList.add('is-boing');
    if (peek.classList.contains('is-talking')) { tipIndex = (tipIndex + 1) % tips.length; }
    showTip(tipIndex);
  });
  peek.querySelector('.tillo-peek__x').addEventListener('click', () => { hush(); ss.set(closedKey, '1'); peek.classList.add('has-news'); });
  cta.addEventListener('click', hush);

  // pops up quickly; after that he offers a new tip now and then (until you close him)
  setTimeout(appear, 2500);
  addEventListener('scroll', function first() { if (scrollY > 300) { appear(); removeEventListener('scroll', first); } }, { passive: true });
  let nudges = 0;
  setInterval(() => {
    if (ss.get(closedKey) || peek.classList.contains('is-talking') || document.hidden || nudges >= 3) return;
    nudges++; tipIndex = (tipIndex + 1) % tips.length; showTip(tipIndex);
    setTimeout(hush, 9000);
  }, 28000);

  // stay out of the way of drawers, the quick view and big Tillos on screen
  const sync = () => peek.classList.toggle('is-hidden', !!$('.drawer.is-open, .modal.is-open, .filters.is-open'));
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  // corner Tillo steps aside while any big Tillo is on screen
  const bigOnScreen = new Set();
  const awayFrom = el => el && new IntersectionObserver(([e]) => {
    e.isIntersecting ? bigOnScreen.add(el) : bigOnScreen.delete(el);
    peek.classList.toggle('is-away', bigOnScreen.size > 0);
  }, { threshold: 0.4 }).observe(el);

  /* ---------- helpers for placing Tillo in the page ---------- */
  const place = (target, where, html) => { if (target) target.insertAdjacentHTML(where, html); return target; };

  // a head popping up over a section title (a little ledge hides his body)
  function peekOverTitle(section, line) {
    const head = section && section.querySelector('.section__head');
    if (!head || head.querySelector('.tillo-ledge')) return;
    head.style.position = 'relative';
    place(head, 'beforeend', `<div class="tillo-ledge reveal" data-from="up" aria-hidden="false">
      <span class="tillo-ledge__say">${line}</span><span class="tillo-ledge__win">${tillo('tillo--ledge', 96)}</span></div>`);
  }

  /* ---------- page placements (one tick later: page scripts render first) ---------- */
  setTimeout(() => {
    if (page === 'home') {
      // welcome card under the hero
      place($('#perks'), 'afterend', `
        <div class="tillo-hello reveal" data-from="left">
          <div class="tillo-hello__fig">${tillo('tillo--hello', 160)}</div>
          <div class="tillo-hello__text">
            <span class="tillo-hello__kicker">${XMAS ? 'Merry Christmas!' : 'Say hi!'}</span>
            <h2>${XMAS ? 'Hi, I’m Tillo — let’s make this Christmas magical!' : 'Hi, I’m Tillo — your toy-finding buddy!'}</h2>
            <p>${XMAS ? 'I’ve picked the best gifts in the shop. Where shall we start?' : 'I know every toy in the shop. Where shall we start?'}</p>
            <div class="tillo-hello__chips">
              <a class="chip-link" href="index.html#gift-finder">${icon('gift', 'icon', 2.4)} Find a gift</a>
              <a class="chip-link" href="${shopUrl({ max: 25 })}">${icon('tag', 'icon', 2.4)} Under 25 $</a>
              <a class="chip-link" href="${shopUrl({ sort: 'new' })}">${icon('sparkle', 'icon', 2.4)} New arrivals</a>
              <a class="chip-link" href="${shopUrl({ sale: 1 })}">${icon('star', 'icon', 2.4)} Offers</a>
            </div>
          </div>
        </div>`);
      const hello = $('.tillo-hello'); if (hello) awayFrom(hello);

      peekOverTitle($('#ages'), 'Pick an age!');
      peekOverTitle($('#characters'), 'My favourites!');
      peekOverTitle($('#brands'), XMAS ? 'Santa’s brands!' : 'So many brands!');

      // Gift Finder
      const finder = $('#finder');
      if (finder && !finder.querySelector('.finder__tillo')) {
        place(finder, 'beforeend', `<div class="finder__tillo reveal" data-from="left">
          <span class="finder__say">${XMAS ? 'Let’s find the perfect Christmas gift!' : 'Let me help you pick!'}</span>${tillo('tillo--point', 160)}</div>`);
        awayFrom(finder.querySelector('.finder__tillo'));
      }
      // club sign-up: Tillo points at the form
      place($('#club'), 'beforeend', `<div class="club__tillo reveal" data-from="up">${tillo('tillo--point', 150)}</div>`);
    }

    // shop + brands heroes
    const hero = $('.shop-hero');
    if (page === 'brands' && hero && !hero.querySelector('.hero-tillo')) {
      hero.querySelectorAll('.para').forEach(b => b.remove());
      place(hero, 'beforeend', `<div class="hero-tillo">${tillo('tillo--hero', 130)}<span class="hero-tillo__say">${page === 'brands' ? 'Which one is your favourite?' : 'Ooh, look at all these toys!'}</span></div>`);
    }

    // product page: Tillo's tip
    if (page === 'product') {
      const id = +new URLSearchParams(location.search).get('id');
      const p = window.ENF.byId.get(id);
      const perks = $('.pdp__perks');
      if (p && perks) {
        const left = 50 - p.p;
        const line = !p.s ? 'This one is sold out right now. Call us and we’ll tell you when it’s back!'
          : !p.p ? 'Ask us for the price: we’re happy to help!'
          : left <= 0 ? 'Great pick! This one gets free delivery.'
          : `Add ${money(left)} more to your cart and delivery is free!`;
        place(perks, 'beforebegin', `<div class="tillo-tip">${tillo('tillo--tip', 64)}<p><b>Tillo says:</b> ${line}</p></div>`);
      }
    }

    // checkout: peeking over the order summary
    place($('.co-summary'), 'afterbegin', `<div class="co-tillo" aria-hidden="true">${tillo('tillo--ledge', 84)}</div>`);

    // footer: sitting on the wave, waving
    place($('.footer'), 'afterbegin', `<div class="footer-tillo">${tillo('tillo--sit', 120)}<span class="footer-tillo__say">${XMAS ? 'Merry Christmas!' : 'See you soon!'}</span></div>`);

    window.ENF.observeReveals();
    // the Christmas scene adds its own Tillo a moment later
    setTimeout(() => ['.xscene__tillo', '.footer-tillo', '.club__tillo', '.hero-tillo'].forEach(sel => awayFrom($(sel))), 200);
  }, 0);
});
