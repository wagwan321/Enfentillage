/* Cart review, followed by WooCommerce's own delivery/payment checkout.
   Never creates a local order number, stores customer details, or pretends an order succeeded. */
document.addEventListener('site:ready', async () => {
  'use strict';
  const { byId, esc, money, icon, getCart, productUrl } = window.ENF;
  const main = document.getElementById('checkoutMain');
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
        <input type="hidden" name="action" value="enf_checkout_cart"><input type="hidden" name="items" id="handoffItems">
        <div class="co-pay" role="radiogroup" aria-label="Payment preference">
          <label class="co-pay__opt"><input type="radio" name="payment" value="cod" checked><span class="co-pay__text"><b>Cash on delivery</b><small>Pay the courier when your order arrives.</small></span></label>
          <label class="co-pay__opt"><input type="radio" name="payment" value="whish"><span class="co-pay__text"><b>Whish Money</b><small>Payment is confirmed manually by the store.</small></span></label>
        </div>
        <p id="whishInstructions" hidden>After WooCommerce confirms your order number and total, send payment to <strong>+961 78 881 100</strong>. Send the payment screenshot and order number to the same number. Wait for the store to confirm payment.</p>
        <p>Next, enter your delivery details and confirm the final total in our store checkout. Prices and stock are checked again there. Continuing transfers this toy box to your store cart.</p>
        <p id="checkoutStatus" role="status">Checking the store checkout…</p>
        <button class="btn btn--green co-place" type="submit" id="continueCheckout" disabled>Continue to delivery details ${icon('arrow', 'icon', 2.6)}</button>
      </form>
    </section>
    <aside class="co-card co-summary"><h2>Your toy box</h2><div class="co-lines">${items.map(item => { const p = byId.get(item.id); return `<div class="co-line"><a href="${productUrl(p)}"><img src="${esc(p.i)}" alt=""></a><div><a href="${productUrl(p)}">${esc(p.n)}</a><small>${item.quantity} × ${money(p.p)}</small></div><b>${money(p.p * item.quantity)}</b></div>`; }).join('')}</div>
      <dl class="co-totals"><dt>Item subtotal</dt><dd>${money(subtotal)}</dd><dt>Delivery in Lebanon</dt><dd>Free</dd></dl>
      <p>Any valid coupon and the final order total are confirmed by WooCommerce at the next step.</p>
    </aside></div>`;
  const form = document.getElementById('handoffForm');
  const button = document.getElementById('continueCheckout');
  const status = document.getElementById('checkoutStatus');
  let ready = false;
  document.getElementById('handoffItems').value = JSON.stringify(items);
  form.addEventListener('change', () => { document.getElementById('whishInstructions').hidden = form.elements.payment.value !== 'whish'; });
  form.addEventListener('submit', event => {
    if (!ready || window.ENF_COMMERCE.failed) { event.preventDefault(); return; }
    try { document.getElementById('handoffItems').value = JSON.stringify(window.ENF_CHECKOUT.cartItems(getCart(), byId)); }
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
    ready = true;
    button.disabled = false;
    status.textContent = 'Ready to continue to delivery and payment.';
  } catch {
    status.textContent = 'Checkout is being connected. Your toy box has been kept. To order now, call +961 3 720 233.';
  }
});
