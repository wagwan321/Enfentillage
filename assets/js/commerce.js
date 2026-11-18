/* Opt-in public WooCommerce catalog adapter. Checkout is deliberately a separate step. */
window.ENF_COMMERCE = { enabled: false, failed: false, ready: null };
window.ENF_COMMERCE.ready = (async () => {
  const state = window.ENF_COMMERCE;
  try {
    const configResponse = await fetch('/api/commerce?resource=config', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!configResponse.ok) throw new Error('Configuration unavailable');
    const config = await configResponse.json();
    if (!config.enabled) return;
    state.enabled = true;
    const response = await fetch('/api/commerce?resource=catalog', { cache: 'no-store', signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error('Catalog unavailable');
    const { products } = await response.json();
    if (!Array.isArray(products)) throw new Error('Invalid catalog');
    const previous = new Map((window.PRODUCTS || []).map(p => [p.id, p]));
    const text = html => {
      const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
      doc.querySelectorAll('script,style,iframe,object').forEach(el => el.remove());
      return doc.body.textContent || '';
    };
    const safeImage = url => { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
    state.categories = [...new Map(products.flatMap(p => p.categories).map(c => [c.id, { key: 'wc-' + c.id, name: text(c.name), color: 'navy' }])).values()];
    window.PRODUCTS = products.map(raw => {
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
      return { ...old, id: raw.id, n: name, p: price, o: regular > price ? regular : 0,
        s: !!raw.is_in_stock && !!raw.is_purchasable, v: raw.type === 'variable',
        b: raw.brands?.length ? text(raw.brands[0].name).toUpperCase() : (name.split(/\s+[–—-]\s+/).length > 1 ? name.split(/\s+[–—-]\s+/)[0].toUpperCase() : old?.b || ''),
        c: [...(old?.c || []), ...raw.categories.map(c => 'wc-' + c.id)], a: ages, h: old?.h || [],
        i: images[0] || 'assets/img/no-photo.svg', _images: images, _live: true, r: undefined,
        _canAdd: raw.type === 'simple' && !!raw.is_purchasable, _categoryNames: categoryNames };
    });
    state.fetchedAt = Date.now();
  } catch {
    state.failed = true;
    // Static details may remain readable during an outage, but never imply verified stock.
    (window.PRODUCTS || []).forEach(p => { p.s = false; });
  }
})();
