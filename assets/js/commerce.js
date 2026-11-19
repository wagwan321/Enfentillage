/* Opt-in public WooCommerce catalog adapter. Checkout is deliberately a separate step.
   Speed: the last catalog is kept in this browser for a few hours, so pages appear straight away;
   a fresh copy is fetched in the background for the next page. First visits use the CDN copy. */
window.ENF_COMMERCE = { enabled: false, failed: false, ready: null, cartProducts: new Map() };
window.ENF_COMMERCE.ready = (async () => {
  const state = window.ENF_COMMERCE;
  const CACHE_KEY = 'enf_catalog_v2', CACHE_MAX_AGE = 6 * 60 * 60 * 1000;
  try { localStorage.removeItem('enf_catalog_v1'); } catch {}   // older format (no website category)
  const readCache = () => {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      const ok = c && Array.isArray(c.products) && c.products.length && Number.isFinite(c.at) && c.at <= Date.now() && Date.now() - c.at < CACHE_MAX_AGE &&
        c.products.every(p => p && Number.isSafeInteger(p.id) && p.prices && Array.isArray(p.categories));
      return ok ? c.products : null;
    } catch { return null; }
  };
  const fetchCatalog = async () => {
    const response = await fetch('/api/commerce?resource=catalog', { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error('Catalog unavailable');
    const { products } = await response.json();
    if (!Array.isArray(products)) throw new Error('Invalid catalog');
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), products })); }
    catch { try { localStorage.removeItem(CACHE_KEY); } catch {} }
    return products;
  };
  try {
    const cached = readCache();
    // config and catalog are requested together (the catalog request is ignored when the store is off)
    const catalogRequest = cached ? null : fetchCatalog();
    catalogRequest?.catch(() => {});
    const configResponse = await fetch('/api/commerce?resource=config', { signal: AbortSignal.timeout(15000) });
    if (!configResponse.ok) throw new Error('Configuration unavailable');
    const config = await configResponse.json();
    if (!config.enabled) { try { localStorage.removeItem(CACHE_KEY); } catch {} return; }
    state.enabled = true;
    // automatic campaign discount, as applied by the WordPress checkout (0 = none)
    state.autoDiscount = Number.isInteger(config.autoDiscount) && config.autoDiscount > 0 && config.autoDiscount <= 50 ? config.autoDiscount : 0;
    // never past the end of the campaign (end of 25 December, Beirut), even from a cached reply
    if (Date.now() >= Date.parse('2026-12-26T00:00:00+02:00') || /[?&]campaign=off(&|$)/.test(globalThis.location?.search || '')) state.autoDiscount = 0;
    const products = cached || await catalogRequest;
    // refresh the saved copy quietly once the page has had time to draw
    if (cached) setTimeout(() => fetchCatalog().catch(() => {}), 4000);
    const previous = new Map((window.PRODUCTS || []).map(p => [p.id, p]));
    const text = html => {
      const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
      doc.querySelectorAll('script,style,iframe,object').forEach(el => el.remove());
      return doc.body.textContent || '';
    };
    const safeImage = url => { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
    // WooCommerce categories stay readable (old links like shop.html?cat=wc-210 still filter), but the
    // website's own category is one per toy, chosen on the server (api/categorize.js).
    state.categories = [...new Map(products.flatMap(p => p.categories).map(c => [c.id, { key: 'wc-' + c.id, name: text(c.name), color: 'navy' }])).values()];
    const mapProduct = raw => {
      const old = previous.get(raw.id);
      const name = text(raw.name);
      const unit = Number(raw.prices.currency_minor_unit);
      if (!Number.isInteger(unit) || unit < 0 || unit > 6 || raw.prices.currency_code !== 'USD') throw new Error('Unsupported currency');
      const price = Number(raw.prices.price) / 10 ** unit;
      const regular = Number(raw.prices.regular_price) / 10 ** unit;
      if (!Number.isFinite(price) || price < 0) throw new Error('Invalid price');
      const categoryNames = raw.categories.map(c => text(c.name));
      const ages = categoryNames.map(n => n.replace(/[–—]/g, '-').replace(/\s/g, '')).filter(n => /^(0-3|3-5|3-6|5-8|8-11|11-16|17\+)$/.test(n));
      const images = (raw.images || []).map(i => safeImage(i.src)).filter(Boolean);
      // during the automatic discount the old price is the crossed-out one; the discount per toy is rounded
      // like the store (0.1 $), exactly as the checkout plugin computes it
      const off = state.autoDiscount && price > 0 ? Math.round(price * state.autoDiscount / 10) / 10 : 0;
      return { ...old, id: raw.id, n: name, p: off ? Math.round((price - off) * 100) / 100 : price, o: off ? price : regular > price ? regular : 0,
        s: !!raw.is_in_stock && !!raw.is_purchasable, v: raw.type === 'variable',
        b: raw.brands?.length ? text(raw.brands[0].name).toUpperCase() : (name.split(/\s+[–—-]\s+/).length > 1 ? name.split(/\s+[–—-]\s+/)[0].toUpperCase() : old?.b || ''),
        c: [...(raw.site_category ? [raw.site_category] : old?.c || []), ...raw.categories.map(c => 'wc-' + c.id)], a: ages, h: old?.h || [],
        i: images[0] || 'assets/img/no-photo.svg', _images: images, _live: true, r: undefined,
        _canAdd: raw.type === 'simple' && !!raw.is_purchasable, _categoryNames: categoryNames,
        _maxQty: Math.max(1, Math.min(99, Number(raw.add_to_cart?.maximum) || 99)),
        _options: (raw.attributes || []).filter(a => a.has_variations).map(a => ({
          name: text(a.name), terms: (a.terms || []).map(t => ({value: String(t.slug || t.name), label: text(t.name)}))
        })),
        _choices: (raw.variations || []).map(v => ({id: v.id, attributes: (v.attributes || []).map(a => ({name: text(a.name), value: String(a.value || '')}))})) };
    };
    window.PRODUCTS = products.map(mapProduct);
    const parents = new Map(window.PRODUCTS.map(p => [p.id, p]));
    const pending = new Map();
    const read = async id => {
      const r = await fetch('/api/commerce?resource=product&id=' + encodeURIComponent(id), {cache:'no-store',signal:AbortSignal.timeout(15000)});
      if (!r.ok) throw new Error('This option could not be checked. Please try again.');
      const {product} = await r.json();
      if (product?.id !== id) throw new Error('This option could not be checked.');
      return product;
    };
    state.loadVariation = async (parentId, id, loaded) => {
      const parent = parents.get(parentId);
      const choice = parent?._choices.find(v => v.id === id);
      if (!parent?.v || !parent._options.length || !choice || choice.attributes.length !== parent._options.length ||
          !parent._options.every(a => choice.attributes.filter(v => v.name === a.name && a.terms.some(t => t.value === v.value)).length === 1)) {
        throw new Error('Please contact the store about this option.');
      }
      if (!pending.has(id)) pending.set(id, (async () => {
        const raw = loaded || await read(id);
        if (raw.id !== id || raw.type !== 'variation' || raw.parent !== parentId) throw new Error('Invalid product option.');
        const selected = mapProduct(raw);
        const labels = parent._options.map(a => a.terms.find(t => t.value === choice.attributes.find(v => v.name === a.name).value).label);
        const images = selected._images.length ? selected._images : parent._images;
        const result = {...parent, ...selected, n: parent.n + ' — ' + labels.join(' / '), b:parent.b, c:parent.c, a:parent.a, h:parent.h,
          v:false, _canAdd:!!raw.is_purchasable, s:parent.s && selected.s, _parentId:parentId,
          _images:images, i:images[0] || parent.i, _options:[], _choices:[]};
        state.cartProducts.set(id,result);
        return result;
      })().catch(error => {pending.delete(id); throw error;}));
      return pending.get(id);
    };
    // Variation IDs are rechecked from WooCommerce after every page load.
    // No price, stock or product metadata from local storage is trusted.
    let saved = {};
    try { saved = JSON.parse(window.localStorage?.getItem('enf_cart') || '{}'); } catch {}
    const missing = saved && typeof saved === 'object' && !Array.isArray(saved)
      ? Object.keys(saved).filter(id => /^[1-9]\d{0,9}$/.test(id) && !parents.has(Number(id))).slice(0,30).map(Number) : [];
    for (let i=0; i<missing.length; i+=3) await Promise.allSettled(missing.slice(i,i+3).map(async id => {
      const raw = await read(id);
      if (raw.type === 'variation') await state.loadVariation(raw.parent,id,raw);
    }));
    state.fetchedAt = Date.now();
  } catch {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    state.failed = true;
    // Static details may remain readable during an outage, but never imply verified stock.
    (window.PRODUCTS || []).forEach(p => { p.s = false; });
  }
})();
