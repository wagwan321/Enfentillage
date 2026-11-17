/* ==========================================================================
   Tillo, the Enfantillage mascot — he lives all over the site.
   - corner buddy: hops up with a page-specific tip and a "new message" badge
   - homepage: welcome card, points at the Gift
     Finder and the club sign-up
   - shop/brands heroes, product tip card, checkout, cart drawer, footer
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { tillo, shopUrl, icon, money } = window.ENF;
  const C = window.ENF.CAMPAIGN;
  const XMAS = window.ENF_THEME === 'christmas';
  const page = document.body.dataset.current || 'home';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
               set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

  /* ---------- corner buddy ---------- */
  const TIPS = {
    home: XMAS
      ? [['Ho ho ho! I’m Tillo. Want help picking a Christmas gift?', 'Open the Gift Finder', 'index.html#gift-finder'],
         [`Psst… my code ${C.code} takes ${C.pct}% off your Christmas shopping, plus ${C.cashback}% cashback in store!`, 'Get my voucher', 'index.html#club'],
         ['Gift wrapping is on request: just tick it at checkout.', 'Start shopping', 'shop.html']]
      : [['Hi, I’m Tillo! Need a gift idea? I can help.', 'Open the Gift Finder', 'index.html#gift-finder'],
         [`Psst… use my code ${C.code} for ${C.pct}% off, then get ${C.cashback}% cashback in store!`, 'Get my voucher', 'index.html#club'],
         ['We deliver anywhere in Lebanon, and you pay when it arrives.', 'Start shopping', 'shop.html']],
    shop: [['Use the filters to shop by age, brand or character!', '', ''],
           [`Use code ${C.code} at checkout for ${C.pct}% off!`, '', ''],
           ['Tap the heart to save toys for later.', 'My wishlist', shopUrl({ fav: 1 })]],
    product: [['Want it later? Tap the heart and it goes to your wishlist.', '', ''],
              ['Pay when it arrives: cash on delivery or Whish Money.', '', ''],
              [`Use my code ${C.code} at checkout to save ${C.pct}%.`, '', '']],
    brands: [['Looking for a brand? Type its name in the box above!', '', ''],
             ['Tap any logo to see all of that brand’s toys.', '', '']],
    info: [['Can’t find your answer? Call us on +961 3 720 233!', 'Call the store', 'tel:+9613720233'],
           ['We deliver anywhere in Lebanon for 3 $.', '', '']],
    checkout: [[`Don’t forget my code ${C.code} for ${C.pct}% off!`, '', ''],
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
  setTimeout(appear, 300);   // Tillo is there right away (his tip bubble follows a moment later)
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

    }

    // product page: a little tip card (no Tillo picture: the site keeps just 2 Tillos)
    if (page === 'product') {
      const id = +new URLSearchParams(location.search).get('id');
      const p = window.ENF.byId.get(id);
      const perks = $('.pdp__perks');
      if (p && perks) {
        const line = !p.s ? 'This one is sold out right now. Call us and we’ll tell you when it’s back!'
          : !p.p ? 'Ask us for the price: we’re happy to help!'
          : `With code <b>${C.code}</b> it’s only <b>${money(Math.round(p.p * (100 - C.pct)) / 100)}</b>, plus ${C.cashback}% cashback in store!`;
        place(perks, 'beforebegin', `<div class="tillo-tip tillo-tip--plain"><span class="tillo-tip__icon" aria-hidden="true">${icon('sparkle', 'icon', 2.4)}</span><p><b>Tip:</b> ${line}</p></div>`);
      }
    }

    window.ENF.observeReveals();
  }, 0);
});
