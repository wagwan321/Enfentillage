/* ==========================================================================
   Enfantillage — single product page (product.html?id=123)
   ========================================================================== */
document.addEventListener('site:ready', () => {
  'use strict';
  const { P, byId, COLORS, colorVars, hashColor, CATEGORIES, AGES, CHARACTERS, BRANDS, brandLogo, brandName,
          gallery, galleryHTML, descHTML, loadDetail, priceHTML, icon, balloon, esc, money, card, shopUrl,
          observeReveals, initRail, addToCart, getFavs } = window.ENF;
  const main = document.getElementById('productMain');
  const id = +new URLSearchParams(location.search).get('id');
  const p = byId.get(id);

  if (!p) {
    document.title = 'Toy not found — Enfantillage Lebanon';
    main.innerHTML = `<div class="wrap empty-state" style="padding:80px 20px"><div class="empty-art" aria-hidden="true">${window.ENF.balloon('#e8222b', 54)}${window.ENF.balloon('#ffc83d', 44)}${window.ENF.balloon('#00a6e4', 50)}</div>
      <h3>We couldn’t find that toy</h3><p style="color:var(--ink-soft)">It may have moved. Try searching for it, or browse everything we have.</p><br>
      <a class="btn btn--navy" href="shop.html">Browse all toys</a></div>`;
    return;
  }

  const brand = BRANDS.find(b => b.key === p.b);
  const cats = CATEGORIES.filter(c => p.c.includes(c.key));
  const ages = AGES.filter(a => p.a.includes(a.key));
  const chars = CHARACTERS.filter(c => p.h.includes(c.key));
  const pct = window.ENF.offPct(p);
  const buyable = p.p && p.s && (!p._live || p._canAdd);
  const chooseOptions = p._live && p.v && p.s && p._options?.length;
  const tint = cats[0] ? cats[0].color : hashColor(p.b);

  document.title = `${brand ? brand.name + ' – ' : ''}${p.n} — Enfantillage Lebanon`;
  const meta = document.querySelector('meta[name="description"]');
  meta.content = `${p.n}${brand ? ' by ' + brand.name : ''}${p.p ? ' — ' + money(p.p) : ''}. Delivery anywhere in Lebanon, cash on delivery or Whish Money.`;

  const crumbCat = cats[0];
  main.innerHTML = `
    <div class="wrap pdp" style="${colorVars(tint)}">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span>›</span><a href="shop.html">Shop</a>
        ${crumbCat ? `<span>›</span><a href="${shopUrl({ cat: crumbCat.key })}">${crumbCat.name}</a>` : ''}
        ${brand ? `<span>›</span><a href="${shopUrl({ brand: brand.key })}">${esc(brand.name)}</a>` : ''}
      </nav>

      <div class="pdp__grid">
        <div class="pdp__media reveal" data-from="left">
          <div class="pdp__badges">
            ${!p.s ? '<span class="badge badge--out">Sold out</span>' : pct >= 5 ? `<span class="badge badge--sale">-${pct}%</span>` : ''}
          </div>
          <div id="pdpGallery">${galleryHTML(gallery(p), p.n, 'pdpMain')}</div>
        </div>

        <div class="pdp__info reveal" data-from="right">
          ${brand ? `<a class="pdp__brand${brand.logo ? ' has-logo' : ''}" href="${shopUrl({ brand: brand.key })}" style="${colorVars(brand.color)}">${brand.logo ? brandLogo(brand, 'pdp__brand-logo') : esc(brand.name)}</a>` : ''}
          <h1 class="pdp__title">${esc(p.n)}</h1>
          <div class="modal__meta">
            ${ages.map(a => `<a href="${shopUrl({ age: a.key })}" style="${colorVars(a.color)}">Ages ${a.num}</a>`).join('')}
            ${cats.map(c => `<a href="${shopUrl({ cat: c.key })}" style="${colorVars(c.color)}">${esc(c.name)}</a>`).join('')}
            ${chars.map(c => `<a href="${shopUrl({ char: c.key })}" style="${colorVars(c.color)}">${esc(c.name)}</a>`).join('')}
          </div>

          <div class="pdp__price">
            ${p.p ? `${p.v ? '<small>from</small> ' : ''}<b>${money(p.p)}</b>${p.o ? ` <s>${money(p.o)}</s> <span class="badge badge--sale">Save ${money(p.o - p.p)}</span>` : ''}${window.ENF.codeLine(p)}`
                  : '<b class="price--ask">Ask in store for the price</b>'}
          </div>
          <span class="stock${p.s ? '' : ' is-out'}">${p.s ? 'In stock — ready to play' : 'Sold out for now. Call us and we’ll let you know when it’s back.'}</span>
          ${chooseOptions ? `<div class="pdp__options">${p._options.map((a,k) => `<label style="display:block;margin:14px 0">${esc(a.name)}<select id="pdpOption${k}" style="display:block;width:100%;padding:12px;margin-top:6px;border:2px solid var(--navy);border-radius:10px"><option value="">Choose ${esc(a.name)}</option>${a.terms.map(t => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join('')}</select></label>`).join('')}<p id="pdpOptionStatus" role="status">Choose your options to check the price and availability.</p></div>` : p.v ? '<p class="pdp__note">Please call the store to confirm your choice and availability.</p>' : ''}

          <div class="pdp__buy">
            ${buyable || chooseOptions ? `
              <div class="qty qty--lg" aria-label="Quantity">
                <button type="button" id="qMinus" aria-label="Fewer">−</button><span id="qVal">1</span><button type="button" id="qPlus" aria-label="More">+</button>
              </div>
              <button class="btn btn--red pdp__add" type="button" id="pdpAdd" ${chooseOptions ? 'disabled' : ''}>${chooseOptions ? 'Choose an option' : icon('cart', 'icon', 2.4) + ' Add to cart'}</button>`
              : `<a class="btn btn--teal pdp__add" href="tel:+9613720233">${icon('phone', 'icon', 2.4)} Call +961 3 720 233</a>`}
            <button class="btn btn--white pdp__fav" type="button" data-fav-btn="${p.id}" aria-label="Add to wishlist">${icon('heart', 'icon', 2.4)} ${getFavs().has(p.id) ? 'Saved' : 'Wishlist'}</button>
          </div>

          <ul class="pdp__perks">
            <li style="${colorVars('green')}">${icon('truck', 'icon', 2.2)}<span><b>Delivery anywhere in Lebanon</b>${window.ENF.isLarge(p) ? `${money(window.ENF.largeFee())} for this large toy (once per order)` : '5 $'}, usually in 2–6 business days.</span></li>
            <li style="${colorVars('blue')}">${icon('tag', 'icon', 2.2)}<span><b>Cash on delivery or Whish Money</b>Pay when your toys arrive, or by Whish.</span></li>
            <li style="${colorVars('pink')}">${icon('gift', 'icon', 2.2)}<span><b>Gift wrapping</b>Just tick “wrap my gifts” at checkout.</span></li>
            <li style="${colorVars('teal')}">${icon('returns', 'icon', 2.2)}<span><b>Easy exchanges</b>Within 30 days, unused and in the original box. <a href="info.html#returns">No refunds</a>.</span></li>
          </ul>
        </div>
      </div>

      <section class="pdp__about reveal" data-from="up">
        <div>
          <h2>About this toy</h2>
          <div class="pdp__desc" id="pdpDesc"><span class="modal__loading">Loading details…</span></div>
        </div>
        <dl class="pdp__specs" id="pdpSpecs">
          ${brand ? `<dt>Brand</dt><dd><a href="${shopUrl({ brand: brand.key })}">${esc(brand.name)}</a></dd>` : ''}
          ${ages.length ? `<dt>Ages</dt><dd>${ages.map(a => a.num + ' years').join(', ')}</dd>` : ''}
          ${cats.length ? `<dt>Type</dt><dd>${cats.map(c => c.name).join(', ')}</dd>` : ''}
          <dt>Availability</dt><dd>${p.s ? 'In stock' : 'Sold out'}</dd>
        </dl>
      </section>
    </div>

    ${railHTML('More from ' + (brand ? esc(brand.name) : 'this brand'), 'brandRail', brand ? shopUrl({ brand: brand.key }) : '')}
    ${railHTML('You may also like', 'alsoRail', crumbCat ? shopUrl({ cat: crumbCat.key }) : 'shop.html')}
  `;

  function railHTML(title, rid, link) {
    return `<section class="section pdp-rail" data-rail="${rid}"><div class="wrap">
      <div class="section__head"><div><h2 class="section__title" style="--c:var(--pink)">${title}</h2></div>
      ${link ? `<a class="see-all" href="${link}">See all ${icon('arrow', 'icon', 2.6)}</a>` : ''}</div>
      <div class="rail-wrap"><button class="arrow-btn arrow-btn--prev" aria-label="Previous">${icon('left', 'icon', 2.8)}</button>
      <div class="rail p-rail" id="${rid}"></div>
      <button class="arrow-btn arrow-btn--next" aria-label="Next">${icon('right', 'icon', 2.8)}</button></div></div></section>`;
  }

  /* related products: same brand, then same category/age — on-sale items only */
  const others = P.filter(x => x.id !== p.id && x.s);
  const sameBrand = p.b ? others.filter(x => x.b === p.b).slice(0, 12) : [];
  const score = x => (x.c.filter(c => p.c.includes(c)).length * 2) + x.a.filter(a => p.a.includes(a)).length + (x.h.some(h => p.h.includes(h)) ? 3 : 0);
  const also = others.filter(x => x.b !== p.b).map(x => [score(x), x]).filter(([s]) => s > 0)
    .sort((a, b) => b[0] - a[0] || b[1].id - a[1].id).slice(0, 12).map(([, x]) => x);
  const fill = (rid, list) => {
    const sec = main.querySelector(`[data-rail="${rid}"]`);
    if (!list.length) { sec.remove(); return; }
    document.getElementById(rid).innerHTML = list.map((x, i) => card(x, { reveal: 'right', delay: Math.min(i, 6) * 0.06 })).join('');
    initRail(sec.querySelector('.rail-wrap'));
  };
  fill('brandRail', sameBrand);
  fill('alsoRail', also);

  /* description, reference and (for sold-out items) the full gallery */
  loadDetail(p.id).then(d => {
    document.getElementById('pdpDesc').innerHTML = descHTML(d) || '<p>Ask us anything about this toy: call +961 3 720 233 or visit our store in Mazraat Yachouh.</p>';
    if (d && d.sku) document.getElementById('pdpSpecs').insertAdjacentHTML('afterbegin', `<dt>Reference</dt><dd>${esc(d.sku)}</dd>`);
    if (d && d.cat && d.cat.length) document.getElementById('pdpSpecs').insertAdjacentHTML('beforeend', `<dt>Listed in</dt><dd>${d.cat.map(esc).join(', ')}</dd>`);
    if ((p._live || p.r) && d?.img?.length && document.getElementById('pdpMain')?.alt === p.n) document.getElementById('pdpGallery').innerHTML = galleryHTML(gallery(p, d), p.n, 'pdpMain');
  });

  /* quantity + add to cart */
  if (buyable || chooseOptions) {
    let q = 1;
    let selected = buyable ? p : null;
    let selectionRun = 0;
    const val = document.getElementById('qVal');
    const addButton = document.getElementById('pdpAdd');
    document.getElementById('qMinus').onclick = () => { q = Math.max(1, q - 1); val.textContent = q; };
    document.getElementById('qPlus').onclick = () => { q = Math.min(20, selected?._maxQty || 20, q + 1); val.textContent = q; };
    addButton.onclick = e => {
      if (!selected || !addToCart(selected.id, e.currentTarget, q)) return;
      const b = e.currentTarget;
      b.innerHTML = `${icon('check', 'icon', 3)} Added ${q > 1 ? q + ' to cart' : 'to cart'}`;
      b.classList.add('btn--green');
      setTimeout(() => { b.innerHTML = `${icon('cart', 'icon', 2.4)} Add to cart`; b.classList.remove('btn--green'); }, 2200);
    };
    if (chooseOptions) {
      const selects = p._options.map((_,k) => document.getElementById('pdpOption' + k));
      const status = document.getElementById('pdpOptionStatus');
      const choose = async () => {
        const run = ++selectionRun;
        selected = null; addButton.disabled = true; q = 1; val.textContent = q;
        if (selects.some(s => !s.value)) { addButton.textContent = 'Choose an option'; status.textContent = 'Choose your options to check the price and availability.'; return; }
        const matches = p._choices.filter(v => v.attributes.length === selects.length && p._options.every((a,k) => v.attributes.some(t => t.name === a.name && t.value === selects[k].value)));
        if (matches.length !== 1) { status.textContent = 'This combination is unavailable. Please choose another option or call the store.'; addButton.textContent = 'Unavailable'; return; }
        status.textContent = 'Checking your option…'; addButton.textContent = 'Checking…';
        try {
          const result = await window.ENF_COMMERCE.loadVariation(p.id,matches[0].id);
          if (run !== selectionRun) return;
          byId.set(result.id,result); selected = result;
          main.querySelector('.pdp__price').innerHTML = `<b>${money(result.p)}</b>${result.o ? ' <s>' + money(result.o) + '</s>' : ''}${window.ENF.codeLine(result)}`;
          document.getElementById('pdpGallery').innerHTML = galleryHTML(gallery(result),result.n,'pdpMain');
          const stock = main.querySelector('.pdp__info .stock');
          stock.textContent = result.s ? 'In stock — ready to play' : 'Sold out for now'; stock.classList.toggle('is-out',!result.s);
          addButton.disabled = !result.s || !result._canAdd || !result.p;
          addButton.textContent = addButton.disabled ? 'Unavailable' : 'Add to cart';
          status.textContent = addButton.disabled ? 'This option is unavailable. Please choose another.' : result.n + ' selected.';
        } catch (error) { if (run === selectionRun) { status.textContent = error.message; addButton.textContent = 'Unable to check'; } }
      };
      selects.forEach(s => s.addEventListener('change',choose));
      const optionId = Number(new URLSearchParams(location.search).get('option'));
      const initial = p._choices.find(v => v.id === optionId);
      if (initial) { p._options.forEach((a,k) => {selects[k].value = initial.attributes.find(t => t.name === a.name)?.value || '';}); choose(); }
    }
  }

  /* remember recently viewed (used on the checkout page) */
  try {
    const seen = JSON.parse(localStorage.getItem('enf_seen') || '[]').filter(x => x !== p.id);
    localStorage.setItem('enf_seen', JSON.stringify([p.id, ...seen].slice(0, 12)));
  } catch (e) { /* private mode */ }

  observeReveals();
});
