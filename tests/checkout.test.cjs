const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readiness } = require('../api/checkout');
const { cartItems } = require('../assets/js/checkout-cart');
const preview = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/woocommerce-connection' };
const status = { version: 2, enabled: true, currency: 'USD', deliveryFee: 0, methods: ['cod', 'whish'], whishNumber: '+961 78 881 100' };
const response = data => ({ ok: true, json: async () => data });
test('checkout stays off in production, on another branch, and when explicitly disabled', async () => {
 const mustNotFetch = () => { throw new Error('Unexpected upstream request'); };
 for (const env of [{}, { ...preview, VERCEL_ENV: 'production' }, { ...preview, VERCEL_GIT_COMMIT_REF: 'main' }, { ...preview, WOO_ENABLE_CHECKOUT: 'false' }]) {
  assert.equal((await readiness(env, mustNotFetch)).enabled, false);
 }
});
test('handoff requires matching readiness and the configured HTTPS backend', async () => {
 const result = await readiness(preview, async (url, options) => {
  assert.equal(url.href, 'https://enfantillagestore.com/wp-json/enfantillage/v1/checkout-status');
  assert.equal(options.redirect, 'error');
  assert.deepEqual(options.headers, { Accept: 'application/json' });
  return response(status);
 });
 assert.equal(result.handoffUrl, 'https://enfantillagestore.com/wp-admin/admin-post.php');
 assert.equal(result.deliveryFee, 0);
 assert.equal((await readiness(preview, async () => response({ ...status, deliveryFee: 5 }))).deliveryFee, 5);
 for (const change of [{ enabled: false }, { version: 1 }, { deliveryFee: 3 }, { deliveryFee: 7 }, { deliveryFee: '5' }, { currency: 'EUR' }, { methods: ['stripe'] }, { whishNumber: '+96100000000' }]) {
  await assert.rejects(readiness(preview, async () => response({ ...status, ...change })));
 }
 await assert.rejects(readiness(preview, async () => ({ ok: false })));
});
test('handoff sends only product IDs and quantities, never browser prices or customer data', () => {
 const products = new Map([[42, { id: 42, _live: true, _canAdd: true, s: true, v: false, p: 999, n: 'Example' }]]);
 assert.deepEqual(cartItems({ 42: 2 }, products), [{ id: 42, quantity: 2 }]);
 for (const cart of [{ 42: 0 }, { 42: -1 }, { 42: 1.5 }, { 42: '2' }, { 42: 100 }, { 43: 1 }, { '042': 1 }, {}, [], null]) assert.throws(() => cartItems(cart, products));
 for (const change of [{ _live: false }, { s: false }, { _canAdd: false }, { v: true }]) assert.throws(() => cartItems({ 42: 1 }, new Map([[42, { ...products.get(42), ...change }]])));
});
