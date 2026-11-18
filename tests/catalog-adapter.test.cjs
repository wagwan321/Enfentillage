const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../assets/js/commerce.js'), 'utf8');
const live = { id: 99, name: 'New toy', type: 'simple', prices: { price: '350', regular_price: '400', currency_code: 'USD', currency_minor_unit: 1 }, categories: [{ id: 12, name: '3 - 5' }], images: [{ src: 'https://example.com/photo.jpg' }], is_in_stock: true, is_purchasable: true };
async function run(products, { enabled = true, outage = false } = {}) {
 const window = { PRODUCTS: [{ id: 1, n: 'Old snapshot', s: true }] };
 // Plain-text fixture decoder only; HTML sanitization needs browser verification.
 class DOMParser { parseFromString(value) { return { body: { textContent: value }, querySelectorAll: () => [] }; } }
 vm.runInNewContext(source, { window, DOMParser, URL, AbortSignal, fetch: async url => {
  if (outage) throw new Error('offline');
  return { ok: true, json: async () => url.includes('config') ? { enabled } : { products } };
 } });
 await window.ENF_COMMERCE.ready;
 return window;
}
test('new Woo products replace the snapshot with live prices, ages and photos', async () => {
 const w = await run([live]);
 assert.equal(w.PRODUCTS.length, 1);
 const p = w.PRODUCTS[0];
 assert.equal(p.id, 99);
 assert.equal(p.p, 35);
 assert.equal(p.o, 40);
 assert.equal(p.a[0], '3-5');
 assert.equal(p.c[0], 'wc-12');
 assert.equal(p.i, 'https://example.com/photo.jpg');
 assert.equal(p._canAdd, true);
});
test('unimplemented variable options are blocked, and failed reads disable snapshot purchases', async () => {
 const variable = await run([{ ...live, type: 'variable' }]);
 assert.equal(variable.PRODUCTS[0]._canAdd, false);
 const failed = await run([], { outage: true });
 assert.equal(failed.ENF_COMMERCE.failed, true);
 assert.equal(failed.PRODUCTS[0].s, false);
 const invalid = await run([{ ...live, prices: { ...live.prices, currency_code: 'EUR' } }]);
 assert.equal(invalid.ENF_COMMERCE.failed, true);
 assert.equal(invalid.PRODUCTS[0].s, false);
});
test('default-off mode retains the original snapshot', async () => {
 const w = await run([], { enabled: false });
 assert.equal(w.PRODUCTS[0].id, 1);
 assert.equal(w.ENF_COMMERCE.enabled, false);
});
