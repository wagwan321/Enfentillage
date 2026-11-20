// Public catalog only. Never forwards WordPress cookies, credentials or arbitrary URLs.
const { websiteCategory } = require('./categorize');
const FIELDS = 'id,name,type,parent,permalink,prices,is_in_stock,is_purchasable,images,categories,brands,attributes,variations,add_to_cart';
// Store API conditionally populates images/options only when their root fields are requested.
// Compact the response after fetching; nested _fields alone can silently omit those fields.
// Catalog cards need one thumbnail; full galleries and descriptions load per product.
const CATALOG_FIELDS = 'id,name,type,parent,prices,is_in_stock,is_purchasable,images,categories,brands,attributes,variations,add_to_cart';
function catalogProduct(p, paths = new Map()) {
  const {id,name,type,parent,prices,is_in_stock,is_purchasable,categories}=p;
  const site_category = websiteCategory({ name, paths: (categories||[]).map(c => paths.get(c.id) || String(c.name || '')) }).key;
  return {id,name,type,parent,site_category,prices:{price:prices?.price,regular_price:prices?.regular_price,currency_code:prices?.currency_code,currency_minor_unit:prices?.currency_minor_unit},is_in_stock,is_purchasable,categories:(categories||[]).map(c=>({id:c.id,name:c.name})),
    images:(p.images||[]).slice(0,1).map(i=>({src:i.thumbnail||i.src})),
    brands:(p.brands||[]).map(b=>({name:b.name})),
    attributes:(p.attributes||[]).filter(a=>a.has_variations).map(a=>({name:a.name,has_variations:true,terms:(a.terms||[]).map(t=>({name:t.name,slug:t.slug}))})),
    variations:(p.variations||[]).map(v=>({id:v.id,attributes:v.attributes})),
    add_to_cart:{maximum:p.add_to_cart?.maximum}};
}
function settings(env = process.env) {
  // Temporary read-only preview configuration. Both conditions are required:
  // merging this branch must never activate the production storefront.
  const testingBranch = env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'codex/woocommerce-connection';
  if (env.WOO_ENABLE_CATALOG === 'false' || (env.WOO_ENABLE_CATALOG !== 'true' && !testingBranch)) return { enabled: false };
  const url = new URL(env.WOO_STORE_URL || (testingBranch ? 'https://enfantillagestore.com' : ''));
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid store URL');
  return { enabled: true, storeUrl: url.origin };
}
// Full category paths (e.g. "TOYS > PRETEND PLAY > KITCHEN & FOOD") from the public WordPress taxonomy.
// Optional: if it fails, the one-category rules still work from the category names alone.
async function readCategoryPaths(config, fetcher = fetch) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const url = new URL('/wp-json/wp/v2/product_cat', config.storeUrl);
    url.search = new URLSearchParams({ per_page: '100', page: String(page), _fields: 'id,name,parent' });
    const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
    if (!response.ok) break;
    const list = await response.json();
    if (!Array.isArray(list) || !list.length) break;
    all.push(...list);
    if (page >= Number(response.headers.get('x-wp-totalpages') || page)) break;
  }
  const byId = new Map(all.map(c => [c.id, c]));
  const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&#8211;|&#8212;/g, '-').replace(/&#0?39;|&#8217;/g, "'");
  const paths = new Map();
  for (const c of all) {
    const names = []; let cur = c; let guard = 0;
    while (cur && guard++ < 10) { names.unshift(decode(cur.name)); cur = byId.get(cur.parent); }
    paths.set(c.id, names.join(' > '));
  }
  return paths;
}
async function readProducts(config, fetcher = fetch) {
  const pathsRequest = readCategoryPaths(config, fetcher).catch(() => new Map());
  async function page(number) {
    const url = new URL('/wp-json/wc/store/v1/products', config.storeUrl);
    url.search = new URLSearchParams({ per_page: '100', page: String(number), _fields: CATALOG_FIELDS, orderby: 'id', order: 'desc' });
    const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Store unavailable');
    const products = await response.json();
    if (!Array.isArray(products) || products.some(p => !Number.isSafeInteger(p.id) || !p.prices || !Array.isArray(p.categories))) throw new Error('Invalid catalog');
    return { products, pages: Number(response.headers.get('x-wp-totalpages')) };
  }
  const first = await page(1);
  if (!Number.isInteger(first.pages) || first.pages < 1 || first.pages > 100) throw new Error('Invalid pagination');
  const products = [...first.products];
  // Bounded concurrency; a failed page rejects the entire response, never a partial catalog.
  for (let i = 2; i <= first.pages; i += 5) {
    const pages = await Promise.all(Array.from({ length: Math.min(5, first.pages - i + 1) }, (_, k) => page(i + k)));
    if (pages.some(p => p.pages !== first.pages)) throw new Error('Catalog changed while loading');
    pages.forEach(p => products.push(...p.products));
  }
  if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Catalog changed while loading');
  const paths = await pathsRequest;
  return products.map(p => catalogProduct(p, paths));
}
async function readProduct(config, id, fetcher = fetch) {
  if (!/^[1-9]\d{0,9}$/.test(String(id))) throw new Error('Invalid product ID');
  const url = new URL('/wp-json/wc/store/v1/products/' + id, config.storeUrl);
  url.searchParams.set('_fields', FIELDS + ',sku,description,short_description');
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Product unavailable');
  const product = await response.json();
  if (product.id !== Number(id) || !product.prices || !Array.isArray(product.categories)) throw new Error('Invalid product');
  return product;
}
// The automatic campaign discount (e.g. 20% off everything) as reported by the WordPress checkout plugin.
// 0 when the plugin doesn't apply one (older plugin, campaign over, store unreachable): the website then
// never shows prices the checkout wouldn't charge.
// Also the large toys (shipping class "Large item" in WooCommerce) and their delivery price (15 $),
// so the website shows the right delivery before checkout. Nothing large when the plugin doesn't say so.
async function readStoreStatus(config, fetcher = fetch) {
  const none = { autoDiscount: 0, largeDeliveryFee: null, largeItems: [] };
  try {
    const response = await fetcher(new URL('/wp-json/enfantillage/v1/checkout-status', config.storeUrl), {
      redirect: 'error', signal: AbortSignal.timeout(6000), headers: { Accept: 'application/json' },
    });
    if (!response.ok) return none;
    const status = await response.json();
    if (status?.enabled !== true) return none;
    const pct = status?.discount?.pct;
    const fee = status.largeDeliveryFee;
    const ids = Array.isArray(status.largeItems) && status.largeItems.length <= 5000 && status.largeItems.every(id => Number.isSafeInteger(id) && id > 0) ? status.largeItems : [];
    return {
      autoDiscount: Number.isInteger(pct) && pct > 0 && pct <= 50 ? pct : 0,
      largeDeliveryFee: Number.isInteger(fee) && fee > 0 && fee <= 100 ? fee : null,
      largeItems: Number.isInteger(fee) && fee > 0 && fee <= 100 ? ids : [],
    };
  } catch { return none; }
}
async function readAutoDiscount(config, fetcher = fetch) { return (await readStoreStatus(config, fetcher)).autoDiscount; }
async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const config = settings();
    if (req.query.resource === 'config') {
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
      return res.status(200).json(config.enabled ? { ...config, ...await readStoreStatus(config) } : config);
    }
    if (!config.enabled) return res.status(503).json({ error: 'Catalog connection is not enabled' });
    if (req.query.resource === 'product') {
      const product = await readProduct(config, req.query.id);
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
      return res.status(200).json({ product });
    }
    if (req.query.resource !== 'catalog') return res.status(404).json({ error: 'Not found' });
    const products = await readProducts(config);
    // The CDN keeps a copy for 5 minutes and keeps serving it instantly while it refreshes in the
    // background, so visitors never wait for all the WooCommerce pages. Checkout re-checks stock and prices.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).json({ products, fetchedAt: new Date().toISOString() });
  } catch { return res.status(503).json({ error: 'The store is temporarily unavailable. Please try again.' }); }
}
module.exports = handler;
module.exports.settings = settings;
module.exports.readProducts = readProducts;
module.exports.readProduct = readProduct;

module.exports.catalogProduct = catalogProduct;
module.exports.readCategoryPaths = readCategoryPaths;
module.exports.readAutoDiscount = readAutoDiscount;
module.exports.readStoreStatus = readStoreStatus;
