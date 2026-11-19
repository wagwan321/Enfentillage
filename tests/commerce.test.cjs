const { test } = require('node:test');
const assert = require('node:assert/strict');
const { settings, readProducts } = require('../api/commerce');
test('catalog is opt-in and store addresses must be HTTPS origins', () => {
 assert.deepEqual(settings({}), { enabled: false });
 assert.throws(() => settings({ WOO_ENABLE_CATALOG: 'true', WOO_STORE_URL: 'http://example.com' }));
 assert.throws(() => settings({ WOO_ENABLE_CATALOG: 'true', WOO_STORE_URL: 'https://user:password@example.com' }));
 assert.equal(settings({ WOO_ENABLE_CATALOG: 'true', WOO_STORE_URL: 'https://example.com' }).storeUrl, 'https://example.com');
});
const product = id => ({ id, prices: {}, categories: [] });
test('temporary preview configuration cannot activate production or another branch', () => {
 const preview = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/woocommerce-connection' };
 assert.equal(settings(preview).storeUrl, 'https://enfantillagestore.com');
 assert.equal(settings({ ...preview, VERCEL_ENV: 'production' }).enabled, false);
 assert.equal(settings({ ...preview, VERCEL_ENV: 'development' }).enabled, false);
 assert.equal(settings({ ...preview, VERCEL_GIT_COMMIT_REF: 'main' }).enabled, false);
 assert.equal(settings({ ...preview, WOO_ENABLE_CATALOG: 'false' }).enabled, false);
});
const response = (rows, pages = 2, ok = true) => ({ ok, json: async () => rows, headers: { get: () => String(pages) } });
test('collects all pages without forwarding cookies or credentials', async () => {
 const rows = await readProducts({ storeUrl: 'https://example.com' }, async (url, options) => {
  assert.equal(options.redirect, 'error'); assert.equal(options.headers.Cookie, undefined);
  for (const key of ['images','attributes','variations']) assert.ok(url.searchParams.get('_fields').split(',').includes(key), 'Store API requires root field '+key);
  return response([product(Number(url.searchParams.get('page')))]);
 });
 assert.deepEqual(rows.map(p => p.id), [1, 2]);
});
test('rejects partial downloads, duplicate products and inconsistent pagination', async () => {
 await assert.rejects(readProducts({ storeUrl: 'https://example.com' }, async url => response([product(1)], 2, url.searchParams.get('page') === '1')));
 await assert.rejects(readProducts({ storeUrl: 'https://example.com' }, async () => response([product(1)])));
 await assert.rejects(readProducts({ storeUrl: 'https://example.com' }, async url => response([product(Number(url.searchParams.get('page')))], Number(url.searchParams.get('page')) === 1 ? 2 : 3)));
});

test('single product reads only the configured store and validates identity', async () => {
 const { readProduct } = require('../api/commerce');
 let calls = 0;
 const fetcher = async (url, options) => {
  calls++;
  assert.equal(url.origin, 'https://example.com');
  assert.equal(url.pathname, '/wp-json/wc/store/v1/products/42');
  assert.equal(options.redirect, 'error');
  assert.deepEqual(options.headers, { Accept: 'application/json' });
  return response(product(42));
 };
 assert.equal((await readProduct({ storeUrl: 'https://example.com' }, '42', fetcher)).id, 42);
 for (const id of ['../users', 'https://evil.example', '0', ['42', '43'], '42?password=x']) {
  await assert.rejects(readProduct({ storeUrl: 'https://example.com' }, id, fetcher));
 }
 assert.equal(calls, 1);
 await assert.rejects(readProduct({ storeUrl: 'https://example.com' }, 42, async () => response(product(43))));
 await assert.rejects(readProduct({ storeUrl: 'https://example.com' }, 42, async () => response({}, 1, false)));
});

test('catalog excludes gallery metadata while retaining option identity and stock limits', () => {
 const {catalogProduct}=require('../api/commerce');
 const raw={...product(42),name:'Toy',type:'variable',categories:[{id:1,name:'5 - 8',slug:'unused',link:'unused'}],images:[{src:'https://example.com/full.jpg',thumbnail:'https://example.com/thumb.jpg',srcset:'unused'.repeat(1000)},{src:'https://example.com/second.jpg'}],brands:[{name:'Brand',link:'unused'}],attributes:[{name:'Color',has_variations:true,terms:[{name:'Blue',slug:'blue',extra:'unused'}]},{name:'Weight',has_variations:false}],variations:[{id:43,attributes:[{name:'Color',value:'blue'}]}],add_to_cart:{maximum:3}};
 const compact=catalogProduct(raw);
 assert.deepEqual(compact.images,[{src:'https://example.com/thumb.jpg'}]);
 assert.deepEqual(compact.categories,[{id:1,name:'5 - 8'}]);
 assert.equal(compact.attributes.length,1);assert.deepEqual(compact.variations,raw.variations);assert.equal(compact.add_to_cart.maximum,3);
 assert.ok(JSON.stringify(compact).length<JSON.stringify(raw).length/5);
});
