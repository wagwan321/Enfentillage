/* ==========================================================================
   Welcome pop-up for the limited-time 30% offer (until 25 December):
   30% back = 20% off everything + 10% of what you spend back as a voucher for the store.
   (The cashback is earned by buying: nothing is handed out before a purchase.)
   Shows when someone arrives; once closed it stays away for the rest of that visit, and comes back on the next one.
   Off automatically when the campaign ends (CAMPAIGN.active). Preview again with ?promo-popup.
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { CAMPAIGN: C, icon, balloon, starSvg, esc, shopUrl, imgOf, byId } = window.ENF;
  if (!C.active) return;
  const page = document.body.dataset.current || 'home';
  if (page === 'checkout') return;

  const visit = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const SEEN_KEY = 'enf_promo_closed';
  try { localStorage.removeItem(SEEN_KEY); } catch (e) { /* old 3-day setting */ }
  const preview = /[?&]promo-popup\b/.test(location.search);
  if (!preview && visit.get(SEEN_KEY)) return;

  const END = Date.parse('2026-12-26T00:00:00+02:00');
  const days = Math.max(1, Math.ceil((END - Date.now()) / 86400000));
  const left = days === 1 ? 'Last day!' : `${days} days left`;
  // three favourites with photos (falls back to other in-stock toys)
  const pics = [30954, 31379, 54021].map(id => ({ src: imgOf(id), alt: byId.get(id)?.n || '' }));

  const pop = document.createElement('div');
  pop.className = 'promo-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'true');
  pop.setAttribute('aria-labelledby', 'promoTitle');
  pop.innerHTML = `
    <div class="promo-pop__backdrop" data-promo-close></div>
    <div class="promo-pop__card">
      <button class="promo-pop__x" type="button" data-promo-close aria-label="Close">${icon('x', 'icon', 2.8)}</button>
      <div class="promo-pop__art" aria-hidden="true">
        <span class="promo-pop__star" style="left:12%;top:14%">${starSvg('#ffc83d', 22)}</span>
        <span class="promo-pop__star" style="right:14%;top:58%">${starSvg('#fff', 14)}</span>
        <span class="promo-pop__star" style="left:20%;bottom:12%">${starSvg('#fff', 12)}</span>
        <div class="promo-pop__balloons">${balloon('#ffc83d', 34)}${balloon('#00a6e4', 28)}</div>
        <div class="promo-pop__burst"><span>Get<b>30%</b>back</span></div>
        <div class="promo-pop__pics">${pics.map((p, k) => `<span class="promo-pop__pic promo-pop__pic--${k}"><img src="${esc(p.src)}" alt=""></span>`).join('')}</div>
      </div>
      <div class="promo-pop__body">
        <span class="promo-pop__kicker">${icon('gift', 'icon', 2.4)} Christmas offer · ${left}</span>
        <h2 class="promo-pop__title" id="promoTitle">Get <em>30%</em> back on every toy</h2>
        <p class="promo-pop__lead">Until ${esc(C.until)}, every purchase comes with two treats:</p>
        <ul class="promo-pop__treats">
          <li style="--c:var(--red);--c-soft:var(--red-soft)">
            <span class="promo-pop__num">${C.pct}%</span>
            <span><b>Off everything</b><small>${C.auto ? 'Already taken off every price. No code needed!' : `Enter code <b>${esc(C.code)}</b> at checkout.`}</small></span>
          </li>
          <li style="--c:var(--green);--c-soft:var(--green-soft)">
            <span class="promo-pop__num">+${C.cashback}%</span>
            <span><b>Back after you buy</b><small>${C.cashback}% of what you spend comes back as a store voucher in your order email. Use it in our store by ${esc(C.until)}.</small></span>
          </li>
        </ul>
        <a class="btn btn--red promo-pop__cta" href="${shopUrl({ promo: 1 })}" data-promo-close>Shop the offer ${icon('arrow', 'icon', 2.6)}</a>
        <button class="promo-pop__skip" type="button" data-promo-close>Maybe later</button>
      </div>
    </div>`;
  document.body.appendChild(pop);

  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    pop.classList.add('is-open');
    pop.querySelector('.promo-pop__cta').focus({ preventScroll: true });
  };
  const close = () => {
    if (!pop.classList.contains('is-open')) return;
    pop.classList.remove('is-open');
    visit.set(SEEN_KEY, '1');
    lastFocus?.focus?.({ preventScroll: true });
  };
  pop.addEventListener('click', e => { if (e.target.closest('[data-promo-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // a moment after arriving, so the page shows first
  setTimeout(open, preview ? 300 : 1200);
});
