/* ==========================================================================
   Welcome pop-up for the limited-time 30% offer (until 25 December):
   30% back = 20% off everything + a 10% cashback voucher for the store (with your email).
   Shows once when someone arrives; after it's closed it stays away for 3 days, and for good once
   the voucher is taken. Off automatically when the campaign ends (CAMPAIGN.active).
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { CAMPAIGN: C, icon, balloon, esc, shopUrl, burst, toast } = window.ENF;
  if (!C.active) return;
  const page = document.body.dataset.current || 'home';
  if (page === 'checkout') return;

  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const V_KEY = 'enf_voucher', SEEN_KEY = 'enf_promo_closed', AWAY = 3 * 24 * 60 * 60 * 1000;
  const readVoucher = () => { try { return JSON.parse(ls.get(V_KEY) || 'null'); } catch (e) { return null; } };
  const preview = /[?&]promo-popup\b/.test(location.search);   // ?promo-popup shows it again (for checking)
  if (!preview && (readVoucher() || Date.now() - Number(ls.get(SEEN_KEY) || 0) < AWAY)) return;

  const twenty = C.auto
    ? ['20% off everything', 'Already taken off every price. No code needed!']
    : [`${C.pct}% off everything`, `Use code <b>${esc(C.code)}</b> at checkout`];
  const voucherHTML = v => `
    <div class="voucher" role="status">
      <span class="voucher__kicker">${icon('gift', 'icon', 2.4)} Enfantillage Club</span>
      <b class="voucher__big">${C.cashback}% cashback</b>
      <span class="voucher__for">Voucher for <b>${esc(v.email)}</b></span>
      <span class="voucher__how">Show this screen at our store in Mazraat Yachouh to use it.</span>
    </div>`;

  const pop = document.createElement('div');
  pop.className = 'promo-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'true');
  pop.setAttribute('aria-labelledby', 'promoTitle');
  pop.innerHTML = `
    <div class="promo-pop__backdrop" data-promo-close></div>
    <div class="promo-pop__card">
      <button class="promo-pop__x" type="button" data-promo-close aria-label="Close">${icon('x', 'icon', 2.8)}</button>
      <div class="promo-pop__balloons" aria-hidden="true">${balloon('#e8222b', 46)}${balloon('#ffc83d', 36)}${balloon('#00a6e4', 40)}</div>
      <span class="promo-pop__kicker">${icon('tag', 'icon', 2.4)} Limited time · until ${C.until}</span>
      <h2 class="promo-pop__title" id="promoTitle">Get <em>30%</em> back!</h2>
      <p class="promo-pop__lead">Our Christmas offer comes in two parts:</p>
      <div class="promo-pop__parts">
        <div class="promo-pop__part" style="--c:var(--red)"><b>${twenty[0]}</b><small>${twenty[1]}</small></div>
        <span class="promo-pop__plus" aria-hidden="true">+</span>
        <div class="promo-pop__part" style="--c:var(--green)"><b>+${C.cashback}% cashback</b><small>A voucher to spend in our store</small></div>
      </div>
      <div class="promo-pop__action" id="promoAction">
        <form class="promo-pop__form" id="promoForm" novalidate>
          <label class="sr-only" for="promoEmail">Email address</label>
          <input id="promoEmail" type="email" placeholder="Your email for the 10% voucher" required autocomplete="email">
          <button class="btn btn--red" type="submit">Get my voucher</button>
        </form>
        <p class="promo-pop__note">Your voucher appears right here and stays in this browser.</p>
      </div>
      <div class="promo-pop__foot">
        <a class="btn btn--navy btn--sm" href="${shopUrl({ promo: 1 })}" data-promo-close>Shop the offer ${icon('arrow', 'icon', 2.6)}</a>
        <button class="promo-pop__skip" type="button" data-promo-close>No thanks</button>
      </div>
    </div>`;
  document.body.appendChild(pop);

  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    pop.classList.add('is-open');
    pop.querySelector('.promo-pop__x').focus({ preventScroll: true });
  };
  const close = () => {
    if (!pop.classList.contains('is-open')) return;
    pop.classList.remove('is-open');
    ls.set(SEEN_KEY, String(Date.now()));
    lastFocus?.focus?.({ preventScroll: true });
  };
  pop.addEventListener('click', e => { if (e.target.closest('[data-promo-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  pop.querySelector('#promoAction').addEventListener('submit', e => {
    e.preventDefault();
    const inp = pop.querySelector('#promoEmail');
    const email = inp.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      inp.focus();
      inp.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      return;
    }
    const v = { email, at: new Date().toISOString() };
    ls.set(V_KEY, JSON.stringify(v));            // same voucher as the club section on the home page
    burst(e.submitter || inp, undefined, 60);
    pop.querySelector('#promoAction').innerHTML = voucherHTML(v);
    toast(`Here’s your ${C.cashback}% cashback voucher!`);
  });

  // a moment after arriving, so the page shows first
  setTimeout(open, preview ? 300 : 1200);
});
