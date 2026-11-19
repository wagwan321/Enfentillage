const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../assets/js/commerce.js'), 'utf8');
const live = { id: 99, name: 'New toy', type: 'simple', prices: { price: '350', regular_price: '400', currency_code: 'USD', currency_minor_unit: 1 }, categories: [{ id: 12, name: '3 - 5' }], images: [{ src: 'https://example.com/photo.jpg' }], is_in_stock: true, is_purchasable: true };
async function run(products, { enabled = true, outage = false, details = {}, cart = {} } = {}) {
 const window = { PRODUCTS: [{ id: 1, n: 'Old snapshot', s: true }], localStorage:{getItem:()=>JSON.stringify(cart)} };
 // Plain-text fixture decoder only; HTML sanitization needs browser verification.
 class DOMParser { parseFromString(value) { return { body: { textContent: value }, querySelectorAll: () => [] }; } }
 vm.runInNewContext(source, { window, DOMParser, URL, AbortSignal, fetch: async url => {
  if (outage) throw new Error('offline');
  return { ok: true, json: async () => url.includes('config') ? { enabled } : url.includes('resource=product&') ? {product:details[new URL(url,'https://store.test').searchParams.get('id')]} : { products } };
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
test('variable parents need an explicit choice, and failed reads disable snapshot purchases', async () => {
 const variable = await run([{ ...live, type: 'variable' }]);
 assert.equal(variable.PRODUCTS[0]._canAdd, false);
 const failed = await run([], { outage: true });
 assert.equal(failed.ENF_COMMERCE.failed, true);
 assert.equal(failed.PRODUCTS[0].s, false);
 const invalid = await run([{ ...live, prices: { ...live.prices, currency_code: 'EUR' } }]);
 assert.equal(invalid.ENF_COMMERCE.failed, true);
 assert.equal(invalid.PRODUCTS[0].s, false);
});
const parent = {...live,type:'variable',attributes:[{name:'Color',has_variations:true,terms:[{name:'Blue',slug:'blue'},{name:'Red',slug:'red'}]}],variations:[{id:1001,attributes:[{name:'Color',value:'blue'}]},{id:1002,attributes:[{name:'Color',value:'red'}]}]};
const blue = {...live,id:1001,parent:99,type:'variation',prices:{...live.prices,price:'150',regular_price:'200'},add_to_cart:{maximum:2},images:[{src:'https://example.com/blue.jpg'}]};
test('selected variants use fresh Woo prices, stock, images and quantity limits after page reload', async () => {
 const w = await run([parent],{cart:{1001:1},details:{1001:blue}});
 assert.equal(w.PRODUCTS.length,1);
 assert.equal(w.PRODUCTS[0]._canAdd,false);
 const p=w.ENF_COMMERCE.cartProducts.get(1001);
 assert.equal(p.n,'New toy — Blue'); assert.equal(p.p,15); assert.equal(p.o,20);
 assert.equal(p._parentId,99); assert.equal(p._canAdd,true); assert.equal(p.v,false);
 assert.equal(p._maxQty,2); assert.equal(p.i,'https://example.com/blue.jpg');
});
test('wrong-parent and incomplete variations cannot become cart products', async () => {
 const w=await run([parent],{details:{1001:{...blue,parent:88}}});
 await assert.rejects(()=>w.ENF_COMMERCE.loadVariation(99,1001),/Invalid product option/);
 assert.equal(w.ENF_COMMERCE.cartProducts.size,0);
 await assert.rejects(()=>w.ENF_COMMERCE.loadVariation(99,9999),/contact the store/);
 const wildcard=await run([{...parent,variations:[{id:1001,attributes:[{name:'Color',value:''}]}]}]);
 await assert.rejects(()=>wildcard.ENF_COMMERCE.loadVariation(99,1001),/contact the store/);
});
test('an out-of-stock selected option stays unbuyable without disabling other catalog products',async()=>{
 const w=await run([parent],{details:{1001:{...blue,is_in_stock:false}}});
 const p=await w.ENF_COMMERCE.loadVariation(99,1001);
 assert.equal(p.s,false);assert.equal(w.ENF_COMMERCE.failed,false);
});
test('default-off mode retains the original snapshot', async () => {
 const w = await run([], { enabled: false });
 assert.equal(w.PRODUCTS[0].id, 1);
 assert.equal(w.ENF_COMMERCE.enabled, false);
});
