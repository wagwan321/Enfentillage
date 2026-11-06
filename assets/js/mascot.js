/* ==========================================================================
   Tillo, the Enfantillage mascot
   - peeks up from the bottom corner with a page-specific tip (once you've
     scrolled a little or after a few seconds; never as a load-time intro)
   - points at the Gift Finder on the homepage
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { esc, shopUrl, icon } = window.ENF;
  const XMAS = window.ENF_THEME === 'christmas';
  const page = document.body.dataset.current || 'home';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
               set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } } };

  /* tips per page: [message, button label, link] */
  const TIPS = {
    home: XMAS
      ? [['Ho ho ho! I’m Tillo. Want help picking a Christmas gift?', 'Open the Gift Finder', 'index.html#gift-finder'],
         ['Gifts under the tree? Wrapping is on request: just tick it at checkout!', 'Shop toys', 'shop.html'],
         ['Psst… use my code TILLO12 for 12% off your Christmas shopping.', 'See the offers', shopUrl({ sale: 1 })]]
      : [['Hi, I’m Tillo! Need a gift idea? I can help.', 'Open the Gift Finder', 'index.html#gift-finder'],
         ['Psst… use my code TILLO12 to save 12% today!', 'See the offers', shopUrl({ sale: 1 })],
         ['Free delivery on orders above 50 $, anywhere in Lebanon.', 'Start shopping', 'shop.html']],
    shop: [['Use the filters to shop by age, brand or character.', '', ''],
           ['Free delivery on orders above 50 $!', '', ''],
           ['Tap the heart to save toys to your wishlist.', 'My wishlist', shopUrl({ fav: 1 })]],
    product: [['Want it later? Tap the heart and it goes to your wishlist.', '', ''],
              ['Pay when it arrives: cash on delivery or Whish Money.', '', ''],
              ['Use my code TILLO12 at checkout to save 12%.', '', '']],
    brands: [['Looking for a brand? Type its name in the box above.', '', ''],
             ['Tap any logo to see all of that brand’s toys.', '', '']],
    checkout: [['Don’t forget my code TILLO12 for 12% off!', '', ''],
               ['Want it gift-wrapped? Tick the box under the address.', '', '']],
  };
  const tips = TIPS[page] || TIPS.home;
  let tipIndex = 0;

  /* ---------- peek pop-up ---------- */
  const wrap = document.createElement('div');
  wrap.className = 'tillo-peek';
  wrap.innerHTML = `
    <div class="tillo-peek__bubble" role="status" aria-live="polite">
      <button class="tillo-peek__x" type="button" aria-label="Close Tillo’s message">${icon('x', 'icon', 2.8)}</button>
      <p class="tillo-peek__msg"></p>
      <a class="tillo-peek__cta btn btn--red btn--sm" href="#"></a>
    </div>
    <button class="tillo-peek__body" type="button" aria-label="Talk to Tillo">
      <img src="assets/img/mascot/tillo-sm.webp" alt="Tillo, the Enfantillage mascot" width="120" height="181">
    </button>`;
  document.body.appendChild(wrap);
  const msg = wrap.querySelector('.tillo-peek__msg');
  const cta = wrap.querySelector('.tillo-peek__cta');

  function showTip(i) {
    const [m, label, href] = tips[i % tips.length];
    msg.textContent = m;
    cta.hidden = !label;
    if (label) { cta.textContent = label; cta.href = href; }
    wrap.classList.add('is-talking');
  }
  function appear() {
    if (wrap.classList.contains('is-up')) return;
    wrap.classList.add('is-up');
    // say hello shortly after he pops up (only once per visit; later he just waves)
    if (!ss.get('tillo_hello')) { setTimeout(() => showTip(tipIndex), reduce ? 0 : 700); ss.set('tillo_hello', '1'); }
  }
  wrap.querySelector('.tillo-peek__body').addEventListener('click', () => {
    if (wrap.classList.contains('is-talking')) { wrap.classList.remove('is-talking'); return; }
    tipIndex = (tipIndex + 1) % tips.length;
    showTip(tipIndex);
  });
  wrap.querySelector('.tillo-peek__x').addEventListener('click', () => wrap.classList.remove('is-talking'));
  cta.addEventListener('click', () => wrap.classList.remove('is-talking'));

  // pop up after some scrolling or a short delay, whichever comes first
  const onScroll = () => { if (scrollY > 500) { appear(); removeEventListener('scroll', onScroll); } };
  addEventListener('scroll', onScroll, { passive: true });
  setTimeout(appear, 5000);

  // hide while a drawer or the quick view is open, so he never covers them
  const sync = () => wrap.classList.toggle('is-hidden', !!document.querySelector('.drawer.is-open, .modal.is-open, .filters.is-open'));
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

  /* ---------- homepage: Tillo points at the Gift Finder ---------- */
  // (deferred one tick: the homepage script builds the finder's contents after this runs)
  setTimeout(() => {
  const finder = document.getElementById('finder');
  if (finder && !finder.querySelector('.finder__tillo')) {
    finder.insertAdjacentHTML('beforeend', `
      <div class="finder__tillo reveal" data-from="left" aria-hidden="true">
        <span class="finder__say">${XMAS ? 'Let’s find the perfect Christmas gift!' : 'Let me help you pick!'}</span>
        <img src="assets/img/mascot/tillo.webp" alt="" width="212" height="320" loading="lazy">
      </div>`);
    window.ENF.observeReveals(finder);
    // only one Tillo at a time: the corner Tillo steps away while this one is on screen
    new IntersectionObserver(([e]) => wrap.classList.toggle('is-away', e.isIntersecting), { threshold: 0.3 })
      .observe(finder.querySelector('.finder__tillo'));
  }
  }, 0);
});
