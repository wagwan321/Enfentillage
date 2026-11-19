const {test}=require('node:test');
const assert=require('node:assert/strict');
const {verifyReceipt}=require('../api/receipt');
const {clearPurchased}=require('../assets/js/checkout-cart');
const env={WOO_ENABLE_CATALOG:'true',WOO_STORE_URL:'https://enfantillagestore.com'};
const proof={orderId:42,orderKey:'wc_order_test12345678',cartToken:'a1234567-b123-4123-8123-a12345678901'};
const receipt={verified:true,orderId:42,number:'42',status:'on-hold',paymentMethod:'enf_whish',currency:'USD',total:'20.00',items:[{id:1001,quantity:2}]};
test('receipt verification posts secrets only to the fixed store and returns no customer fields',async()=>{
 const result=await verifyReceipt({...proof,storeUrl:'https://attacker.test'},env,async(url,options)=>{
  assert.equal(url.href,'https://enfantillagestore.com/wp-json/enfantillage/v1/receipt');
  assert.equal(url.search,'');assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
  assert.deepEqual(JSON.parse(options.body),proof);assert.equal(options.headers.Cookie,undefined);assert.equal(options.headers.Authorization,undefined);
  return {ok:true,json:async()=>({...receipt,billing:{email:'private@example.invalid'},customer_id:123})};
 });
 assert.deepEqual(result,receipt);
});
test('bad proofs, failed verification and unsupported order states cannot confirm an order',async()=>{
 const noFetch=()=>{throw new Error('Unexpected fetch');};
 for(const input of [{...proof,orderId:'42'},{...proof,orderKey:'bad'},{...proof,cartToken:''},{...proof,cartToken:'not-a-token'}]) await assert.rejects(()=>verifyReceipt(input,env,noFetch),/Invalid receipt/);
 for(const bad of [{...receipt,verified:false},{...receipt,status:'cancelled'},{...receipt,orderId:43},{...receipt,total:''},{...receipt,items:[{id:1001,quantity:2},{id:1001,quantity:2}]}])
  await assert.rejects(()=>verifyReceipt(proof,env,async()=>({ok:true,json:async()=>bad})),/Invalid receipt response/);
 await assert.rejects(()=>verifyReceipt(proof,env,async()=>({ok:false})),/not verified/);
});
test('only a recent matching receipt clears an unchanged cart; newer or edited carts survive',()=>{
 const pending={token:proof.cartToken,cart:{1001:2},createdAt:1000};
 assert.equal(clearPurchased({1001:2},pending,receipt,proof.cartToken,2000),true);
 for(const [cart,p,r,t,n] of [
  [{1001:3},pending,receipt,proof.cartToken,2000],
  [{1001:2,55:1},pending,receipt,proof.cartToken,2000],
  [{1001:2},{...pending,token:'newer-order'},receipt,proof.cartToken,2000],
  [{1001:2},pending,{...receipt,verified:false},proof.cartToken,2000],
  [{1001:2},pending,{...receipt,status:'failed'},proof.cartToken,2000],
  [{1001:2},pending,{...receipt,items:[{id:1001,quantity:1}]},proof.cartToken,2000],
  [{1001:2},pending,receipt,proof.cartToken,7202000],
  [{1001:2},pending,receipt,proof.cartToken,500],
 ]) assert.equal(clearPurchased(cart,p,r,t,n),false);
});
