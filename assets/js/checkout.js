/* Cart review, followed by WooCommerce's own delivery/payment checkout.
   Never creates a local order number, stores customer details, or pretends an order succeeded. */
document.addEventListener('site:ready', async () => {
  'use strict';
  const { byId, esc, money, icon, getCart, productUrl } = window.ENF;
  const main = document.getElementById('checkoutMain');
  const CASH_ICON = '<svg viewBox="0 0 48 32" width="44" height="30" aria-hidden="true"><rect x="2" y="4" width="44" height="24" rx="4" fill="#3db54a"/><rect x="6" y="8" width="36" height="16" rx="2" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/><circle cx="24" cy="16" r="5.5" fill="#fff"/><text x="24" y="19.6" font-size="9" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" fill="#3db54a">$</text></svg>';
  let items;
  try { items = window.ENF_CHECKOUT.cartItems(getCart(), byId); }
  catch (error) {
    main.innerHTML = `<div class="wrap empty-state" style="padding:60px 20px"><h1>Review your toy box</h1><p>${esc(error.message)}</p><br><a class="btn btn--navy" href="shop.html">Return to the shop</a></div>`;
    return;
  }
  const subtotal = items.reduce((sum, item) => sum + byId.get(item.id).p * item.quantity, 0);
  main.innerHTML = `<h1 class="co-title">Review your order</h1><div class="co-grid">
    <section class="co-card"><h2>Payment preference</h2>
      <form id="handoffForm" method="post">
        <input type="hidden" name="action" value="enf_checkout_cart"><input type="hidden" name="items" id="handoffItems"><input type="hidden" name="cart_token" id="handoffToken">
        <div class="co-pay" role="radiogroup" aria-label="Payment preference">
          <label class="co-pay__opt co-pay__opt--cod is-on"><input type="radio" name="payment" value="cod" checked><span class="co-pay__radio" aria-hidden="true"></span><span class="co-pay__brand co-pay__brand--cod">${CASH_ICON}</span><span class="co-pay__text"><b>Cash on delivery</b><small>Pay the courier in cash when your toys arrive.</small></span><span class="co-pay__tags"><em>No card needed</em></span></label>
          <label class="co-pay__opt co-pay__opt--whish"><input type="radio" name="payment" value="whish"><span class="co-pay__radio" aria-hidden="true"></span><span class="co-pay__brand co-pay__brand--whish"><img src="assets/img/pay/whish-money.svg" alt="Whish Money" width="124" height="28"></span><span class="co-pay__text"><b>Whish Money</b><small>Send the total from your Whish app after ordering.</small></span><span class="co-pay__tags"><em>Checked by the store</em></span></label>
        </div>
        <div class="co-pay__detail" data-for="cod"><p>Our courier brings your toys to your door. Please have the total ready in cash.</p></div>
        <div class="co-pay__detail" data-for="whish" id="whishInstructions" hidden><p>After ordering, send the total to <strong>+961 78 881 100</strong> from your <img src="assets/img/pay/whish-icon.png" alt="" class="co-whish-ico"> Whish app, then send the screenshot and your order number to the same number. We confirm the payment and prepare your delivery.</p></div>
        <p>Next, enter your delivery details and confirm the final total in our store checkout. Prices and stock are checked again there. Continuing transfers this toy box to your store cart.</p>
        <p id="checkoutStatus" role="status">Checking the store checkout…</p>
        <button class="btn btn--green co-place" type="submit" id="continueCheckout" disabled>Continue to delivery details ${icon('arrow', 'icon', 2.6)}</button>
      </form>
    </section>
    <aside class="co-card co-summary"><h2>Your toy box</h2><div class="co-lines">${items.map(item => { const p = byId.get(item.id); return `<div class="co-line"><a href="${productUrl(p)}"><img src="${esc(p.i)}" alt=""></a><div><a href="${productUrl(p)}">${esc(p.n)}</a><small>${item.quantity} × ${money(p.p)}</small></div><b>${money(p.p * item.quantity)}</b></div>`; }).join('')}</div>
      <dl class="co-totals"><dt>Item subtotal</dt><dd>${money(subtotal)}</dd><dt id="coDeliveryLabel">Delivery in Lebanon</dt><dd id="coDelivery">${money(window.ENF.deliveryFor(items.map(i => i.id)))}</dd></dl>
      <p>${window.ENF.CAMPAIGN.auto ? `<b>${window.ENF.CAMPAIGN.pct}% off everything</b> is already included. ` : window.ENF.CAMPAIGN.active ? `Have code <b>${esc(window.ENF.CAMPAIGN.code)}</b>? Enter it on the next step. ` : ''}The final total is confirmed there.</p>
    </aside></div>`;
  const form = document.getElementById('handoffForm');
  const button = document.getElementById('continueCheckout');
  const status = document.getElementById('checkoutStatus');
  let ready = false;
  document.getElementById('handoffItems').value = JSON.stringify(items);
  form.addEventListener('change', () => {
    const method = form.elements.payment.value;
    form.querySelectorAll('.co-pay__opt').forEach(o => o.classList.toggle('is-on', o.querySelector('input').checked));
    form.querySelectorAll('.co-pay__detail').forEach(d => { d.hidden = d.dataset.for !== method; });
  });
  form.addEventListener('submit', event => {
    if (!ready || window.ENF_COMMERCE.failed) { event.preventDefault(); return; }
    try {
      document.getElementById('handoffItems').value = JSON.stringify(window.ENF_CHECKOUT.cartItems(getCart(), byId));
      const token = crypto.randomUUID();
      // Only IDs/quantities and an opaque token; never customer information.
      localStorage.setItem('enf_handoff', JSON.stringify({token,cart:getCart(),createdAt:Date.now()}));
      document.getElementById('handoffToken').value=token;
    }
    catch (error) { event.preventDefault(); status.textContent = error.message; return; }
    button.disabled = true;
    button.textContent = 'Opening store checkout…';
    // Keep local cart: a failed handoff must not lose the customer's products.
  });
  addEventListener('pageshow', event => {
    if (event.persisted && ready) { button.disabled = false; button.textContent = 'Continue to delivery details'; }
  });
  try {
    const response = await fetch('/api/checkout', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Checkout unavailable');
    const config = await response.json();
    const url = new URL(config.handoffUrl);
    const store = new URL((await (await fetch('/api/commerce?resource=config', { signal: AbortSignal.timeout(15000) })).json()).storeUrl);
    if (!config.enabled || url.origin !== store.origin || url.protocol !== 'https:' || url.pathname !== '/wp-admin/admin-post.php' || url.search || url.hash || url.username || url.password) throw new Error('Invalid checkout address');
    form.action = url.href;
    if (Number.isFinite(config.deliveryFee)) {
      // a large toy in the box: the plugin's large-item price, once for the whole order
      const large = Number.isFinite(config.largeDeliveryFee) && items.some(i => window.ENF.isLarge(byId.get(i.id)));
      const fee = large ? config.largeDeliveryFee : config.deliveryFee;
      document.getElementById('coDelivery').textContent = fee ? money(fee) : 'Free';
      if (large) document.getElementById('coDeliveryLabel').textContent = 'Delivery in Lebanon (large toy)';
    }
    ready = true;
    button.disabled = false;
    status.textContent = 'Ready to continue to delivery and payment.';
  } catch {
    status.textContent = 'Checkout is being connected. Your toy box has been kept. To order now, call +961 3 720 233.';
  }
});
