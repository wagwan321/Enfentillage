/* ==========================================================================
   Enfantillage — checkout: delivery details + cash on delivery / Whish Money

   PREVIEW: there is no order system behind this page yet, so placed orders
   are only shown back to the customer (and kept in this browser). Before
   launch, connect "Place order" to the store's order system (e.g. the
   existing WooCommerce store, which has cash on delivery built in) and set
   PREVIEW to false.
   ========================================================================== */
const PREVIEW = true;
const STORE_PHONE = '+961 3 720 233';
const DELIVERY_FEE = 3;          // $ anywhere in Lebanon (store delivery policy)
const FREE_DELIVERY_FROM = 50;   // $ free delivery above this subtotal
const PROMO = { code: 'TILLO12', pct: 12 };
/* banknote + padlock drawn inline so they match the site's icon style */
const CASH_ICON = '<svg viewBox="0 0 48 32" width="44" height="30" aria-hidden="true"><rect x="2" y="4" width="44" height="24" rx="4" fill="#3db54a"/><rect x="6" y="8" width="36" height="16" rx="2" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/><circle cx="24" cy="16" r="5.5" fill="#fff"/><text x="24" y="19.6" font-size="9" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" fill="#3db54a">$</text></svg>';
const LOCK_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const REGIONS = ['Beirut', 'Mount Lebanon', 'Keserwan-Jbeil', 'North', 'Akkar', 'Bekaa', 'Baalbek-Hermel', 'South', 'Nabatieh'];

document.addEventListener('site:ready', () => {
  'use strict';
  const { byId, esc, money, icon, balloon, burst, getCart, setCart, brandName, productUrl } = window.ENF;
  const main = document.getElementById('checkoutMain');
  let promoOn = false;

  const lines = () => Object.entries(getCart()).map(([id, q]) => [byId.get(+id), q]).filter(([p]) => p && p.p);
  const totals = () => {
    const sub = lines().reduce((s, [p, q]) => s + p.p * q, 0);
    const disc = promoOn ? Math.round(sub * PROMO.pct) / 100 : 0;
    const ship = sub >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    return { sub, disc, ship, total: Math.max(0, sub - disc + ship) };
  };
  const notice = PREVIEW ? `<div class="co-preview">${icon('sparkle', 'icon', 2.4)}<span><b>Preview of the new website.</b> Orders placed here aren’t sent to the store yet. To order now, call <a href="tel:+9613720233">${STORE_PHONE}</a> or visit us in Mazraat Yachouh.</span></div>` : '';

  function render() {
    if (!lines().length) {
      main.innerHTML = `${notice}<div class="empty-state" style="padding:60px 20px">${balloon('#00a6e4', 80)}
        <h3>Your toy box is empty</h3><p style="color:var(--ink-soft)">Add a few toys first, then come back to check out.</p><br>
        <a class="btn btn--red" href="shop.html">Start shopping</a></div>`;
      return;
    }
    main.innerHTML = `
      ${notice}
      <h1 class="co-title">Checkout</h1>
      <form class="co-grid" id="coForm" novalidate>
        <div class="co-steps">
          <section class="co-card">
            <h2><span>1</span> Your details</h2>
            <div class="co-row">
              ${field('name', 'Full name', 'text', 'name', true)}
              ${field('phone', 'Mobile number', 'tel', 'tel', true, '03 123 456', 'We’ll call to confirm your order')}
            </div>
            ${field('email', 'Email (optional)', 'email', 'email', false, '', 'For your order confirmation')}
          </section>

          <section class="co-card">
            <h2><span>2</span> Delivery address</h2>
            <div class="co-row">
              <label class="co-field"><span>Region <em>*</em></span>
                <select name="region" required class="select co-select"><option value="">Choose…</option>${REGIONS.map(r => `<option>${r}</option>`).join('')}</select>
                <small class="co-err">Please choose your region</small></label>
              ${field('city', 'Town / area', 'text', 'address-level2', true)}
            </div>
            ${field('address', 'Street, building and floor', 'text', 'street-address', true, 'e.g. Main road, Chattat Center, 2nd floor')}
            <label class="co-field"><span>Notes for delivery (optional)</span>
              <textarea name="notes" rows="2" placeholder="Landmarks, best time to call, toy colour or size…"></textarea></label>
            <label class="co-check"><input type="checkbox" name="wrap"> ${icon('gift', 'icon', 2.2)} Wrap my gifts</label>
            <p class="co-hint">${icon('truck', 'icon', 2.2)} Delivery anywhere in Lebanon, usually in 2–6 business days. We’ll contact you before we arrive.</p>
          </section>

          <section class="co-card">
            <div class="co-card__head">
              <h2><span>3</span> Payment method</h2>
              <span class="co-secure">${LOCK_ICON} Secure checkout</span>
            </div>
            <div class="co-pay" role="radiogroup" aria-label="Payment method">
              <label class="co-pay__opt co-pay__opt--cod is-on">
                <input type="radio" name="pay" value="cod" checked>
                <span class="co-pay__radio" aria-hidden="true"></span>
                <span class="co-pay__brand co-pay__brand--cod">${CASH_ICON}</span>
                <span class="co-pay__text"><b>Cash on delivery</b><small>Pay the courier in cash when your toys arrive.</small></span>
                <span class="co-pay__tags"><em>No card needed</em></span>
              </label>
              <label class="co-pay__opt co-pay__opt--whish">
                <input type="radio" name="pay" value="whish">
                <span class="co-pay__radio" aria-hidden="true"></span>
                <span class="co-pay__brand co-pay__brand--whish"><img src="assets/img/pay/whish-money.svg" alt="Whish Money" width="124" height="28"></span>
                <span class="co-pay__text"><b>Whish Money</b><small>Pay from your Whish wallet: quick and contactless.</small></span>
                <span class="co-pay__tags"><em>Instant</em></span>
              </label>
            </div>

            <div class="co-pay__detail" data-for="cod">
              <p><b>How it works:</b> we’ll call to confirm your order, then our courier brings it to your door. Please have <b class="co-amount">${money(totals().total)}</b> ready in cash.</p>
            </div>
            <div class="co-pay__detail" data-for="whish" hidden>
              <ol class="co-steps-list">
                <li><span>1</span>Place your order. Nothing is charged yet.</li>
                <li><span>2</span>We call to confirm, then send a Whish payment request for <b class="co-amount">${money(totals().total)}</b>.</li>
                <li><span>3</span>Approve it in your <img src="assets/img/pay/whish-icon.png" alt="" class="co-whish-ico"> Whish app, and we prepare your delivery.</li>
              </ol>
              <label class="co-field co-field--inline"><span>Whish number <small>(if different from your mobile)</small></span>
                <input name="whishNumber" type="tel" autocomplete="off" placeholder="e.g. 70 123 456"></label>
            </div>
          </section>
        </div>

        <aside class="co-summary co-card">
          <h2>Your order</h2>
          <div class="co-lines">${lines().map(([p, q]) => `
            <div class="co-line"><a href="${productUrl(p)}"><img src="${esc(p.i)}" alt=""></a>
              <div><a href="${productUrl(p)}">${esc(p.n)}</a><small>${esc(brandName(p.b))}${q > 1 ? ` · ${q} × ${money(p.p)}` : ''}</small></div>
              <b>${money(p.p * q)}</b></div>`).join('')}</div>
          <div class="co-promo">
            <input type="text" id="promo" placeholder="Promo code" value="${promoOn ? PROMO.code : ''}" aria-label="Promo code">
            <button type="button" class="btn btn--navy btn--sm" id="promoBtn">${promoOn ? 'Applied' : 'Apply'}</button>
          </div>
          <small class="co-promo-msg" id="promoMsg"></small>
          ${totalsHTML()}
          <button class="btn btn--green co-place" type="submit">Place order ${icon('arrow', 'icon', 2.6)}</button>
          <div class="co-accept"><span>We accept</span><span class="co-accept__cod">${CASH_ICON} Cash</span><img src="assets/img/pay/whish-money.svg" alt="Whish Money" width="88" height="20"></div>
          <p class="co-small">By placing your order you agree to our <a href="https://enfantillagestore.com/terms-and-conditions/">terms</a>. Returns within 30 days, unused and in the original box.</p>
        </aside>
      </form>`;
    wire();
  }

  function field(name, label, type, auto, req, ph = '', hint = '') {
    return `<label class="co-field"><span>${label}${req ? ' <em>*</em>' : ''}</span>
      <input name="${name}" type="${type}" autocomplete="${auto}" ${req ? 'required' : ''} placeholder="${esc(ph)}">
      ${hint ? `<small class="co-hintline">${hint}</small>` : ''}<small class="co-err">${req ? 'Please fill this in' : 'Please check this'}</small></label>`;
  }
  function totalsHTML() {
    const t = totals();
    return `<dl class="co-totals" id="coTotals">
      <dt>Subtotal</dt><dd>${money(t.sub)}</dd>
      ${t.disc ? `<dt>Code ${PROMO.code} (−${PROMO.pct}%)</dt><dd class="co-save">−${money(t.disc)}</dd>` : ''}
      <dt>Delivery</dt><dd>${t.ship ? money(t.ship) : '<span class="co-free">Free</span>'}</dd>
      <dt class="co-total">Total</dt><dd class="co-total">${money(t.total)}</dd></dl>
      ${t.ship ? `<p class="co-small">Add ${money(FREE_DELIVERY_FROM - t.sub)} more for free delivery.</p>` : ''}`;
  }

  function wire() {
    const form = document.getElementById('coForm');
    form.addEventListener('change', e => {
      if (e.target.name === 'pay') {
        form.querySelectorAll('.co-pay__opt').forEach(o => o.classList.toggle('is-on', o.querySelector('input').checked));
        form.querySelectorAll('.co-pay__detail').forEach(d => { d.hidden = d.dataset.for !== e.target.value; });
      }
    });
    form.addEventListener('input', e => e.target.closest('.co-field')?.classList.remove('is-bad'));
    document.getElementById('promoBtn').onclick = () => {
      const v = document.getElementById('promo').value.trim().toUpperCase();
      const msg = document.getElementById('promoMsg');
      if (v === PROMO.code) { promoOn = true; msg.textContent = `${PROMO.pct}% off applied!`; msg.className = 'co-promo-msg is-ok'; }
      else { promoOn = false; msg.textContent = v ? 'That code isn’t valid.' : ''; msg.className = 'co-promo-msg is-bad'; }
      document.getElementById('promoBtn').textContent = promoOn ? 'Applied' : 'Apply';
      document.getElementById('coTotals').outerHTML = totalsHTML().replace(/<p class="co-small">.*<\/p>$/s, '');
      document.querySelectorAll('.co-amount').forEach(el => { el.textContent = money(totals().total); });
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      form.querySelectorAll('[required]').forEach(el => {
        const bad = !el.value.trim();
        el.closest('.co-field').classList.toggle('is-bad', bad);
        if (bad && !first) first = el;
      });
      const phone = form.phone.value.replace(/[^\d+]/g, '');
      const phoneOk = /^(\+?961)?0?\d{7,8}$/.test(phone);
      if (!phoneOk && form.phone.value.trim()) { form.phone.closest('.co-field').classList.add('is-bad'); first = first || form.phone; }
      const email = form.email.value.trim();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { form.email.closest('.co-field').classList.add('is-bad'); first = first || form.email; }
      if (first) { first.focus(); first.closest('.co-field').animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 300 }); return; }
      placeOrder(Object.fromEntries(new FormData(form)));
    });
  }

  function placeOrder(f) {
    const t = totals();
    const order = {
      no: 'ENF-' + Date.now().toString(36).toUpperCase().slice(-6),
      at: new Date().toISOString(), pay: f.pay, wrap: !!f.wrap,
      customer: { name: f.name, phone: f.phone, whish: f.whishNumber || '', email: f.email, region: f.region, city: f.city, address: f.address, notes: f.notes },
      items: lines().map(([p, q]) => ({ id: p.id, name: p.n, qty: q, price: p.p })), totals: t, promo: promoOn ? PROMO.code : '',
    };
    try { localStorage.setItem('enf_last_order', JSON.stringify(order)); } catch (e) { /* private mode */ }
    setCart({});
    const whish = f.pay === 'whish';
    main.innerHTML = `
      ${notice}
      <div class="co-done">
        ${balloon('#3db54a', 70)}
        <h1>Thank you, ${esc(f.name.split(' ')[0])}!</h1>
        <p class="co-done__no">Order <b>${order.no}</b> · ${money(t.total)}</p>
        <div class="co-done__next">
          <h2>What happens next</h2>
          <ol>
            <li>We’ll call you on <b>${esc(f.phone)}</b> to confirm your order${order.wrap ? ' and gift wrapping' : ''}.</li>
            ${whish ? `<li>We’ll send a <img src="assets/img/pay/whish-money.svg" alt="Whish Money" class="co-inline-logo"> payment request for <b>${money(t.total)}</b> to <b>${esc(f.whishNumber || f.phone)}</b>. Approve it in your Whish app and we’ll prepare your delivery.</li>`
                    : `<li>Have <b>${money(t.total)}</b> ready in cash when your order arrives.</li>`}
            <li>Delivery to ${esc(f.city)}, ${esc(f.region)}, usually within 2–6 business days.</li>
          </ol>
        </div>
        <a class="btn btn--red" href="shop.html">Keep shopping</a>
      </div>`;
    scrollTo({ top: 0, behavior: 'smooth' });
    burst(main.querySelector('.co-done h1'), undefined, 60);
  }

  render();
});
