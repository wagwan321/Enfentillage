// Public catalog only. Never forwards WordPress cookies, credentials or arbitrary URLs.
const FIELDS = 'id,name,type,permalink,prices,is_in_stock,is_purchasable,images,categories,brands,attributes,variations';
function settings(env = process.env) {
  // Temporary read-only preview configuration. Both conditions are required:
  // merging this branch must never activate the production storefront.
  const testingBranch = env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'codex/woocommerce-connection';
  if (env.WOO_ENABLE_CATALOG === 'false' || (env.WOO_ENABLE_CATALOG !== 'true' && !testingBranch)) return { enabled: false };
  const url = new URL(env.WOO_STORE_URL || (testingBranch ? 'https://enfantillagestore.com' : ''));
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid store URL');
  return { enabled: true, storeUrl: url.origin };
}
async function readProducts(config, fetcher = fetch) {
  async function page(number) {
    const url = new URL('/wp-json/wc/store/v1/products', config.storeUrl);
    url.search = new URLSearchParams({ per_page: '100', page: String(number), _fields: FIELDS, orderby: 'id', order: 'desc' });
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
  for (let i = 2; i <= first.pages; i += 3) {
    const pages = await Promise.all(Array.from({ length: Math.min(3, first.pages - i + 1) }, (_, k) => page(i + k)));
    if (pages.some(p => p.pages !== first.pages)) throw new Error('Catalog changed while loading');
    pages.forEach(p => products.push(...p.products));
  }
  if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Catalog changed while loading');
  return products;
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
async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const config = settings();
    if (req.query.resource === 'config') return res.status(200).json(config);
    if (!config.enabled) return res.status(503).json({ error: 'Catalog connection is not enabled' });
    if (req.query.resource === 'product') {
      const product = await readProduct(config, req.query.id);
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
      return res.status(200).json({ product });
    }
    if (req.query.resource !== 'catalog') return res.status(404).json({ error: 'Not found' });
    const products = await readProducts(config);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60');
    return res.status(200).json({ products, fetchedAt: new Date().toISOString() });
  } catch { return res.status(503).json({ error: 'The store is temporarily unavailable. Please try again.' }); }
}
module.exports = handler;
module.exports.settings = settings;
module.exports.readProducts = readProducts;
module.exports.readProduct = readProduct;
