const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/voucher-qr');
const {qrMatrix,qrPng,voucherUrl,reedSolomon}=handler;
function fakeRes(){const r={headers:{},code:0,body:null,status(c){r.code=c;return r;},setHeader(k,v){r.headers[k.toLowerCase()]=v;},send(b){r.body=b;return r;},end(){return r;}};return r;}
test('error correction matches the published QR example (HELLO WORLD, 1-M)',()=>{
 assert.deepEqual(reedSolomon([32,91,11,120,209,114,220,77,67,64,236,17,236,17,236,17],10),[196,35,39,119,235,215,231,226,93,23]);
});
test('voucher QR codes only ever point at the store voucher page with a well-formed code',()=>{
 assert.equal(voucherUrl('56396-K7XM3PQ9RT'),'https://enfantillagestore.com/?enfv=56396-K7XM3PQ9RT');
 for(const bad of [undefined,'', '56396','0-K7XM3PQ9RT','56396-K7XM3PQ9R','56396-k7xm3pq9rt','56396-K7XM3PQ9RO','56396-K7XM3PQ9RT&x=1','https://evil.test',['56396-K7XM3PQ9RT']])
  assert.throws(()=>voucherUrl(bad),/Invalid voucher code/);
});
test('QR size grows with the text and has finder patterns in three corners',()=>{
 const m=qrMatrix(voucherUrl('56396-K7XM3PQ9RT'));
 assert.equal(m.length,33);   // version 4
 for(const [r,c] of [[0,0],[0,m.length-7],[m.length-7,0]]){assert.equal(m[r][c],1);assert.equal(m[r+1][c+1],0);assert.equal(m[r+3][c+3],1);}
 assert.equal(qrMatrix('hi').length,21);
 assert.equal(qrMatrix('x'.repeat(200)).length,57);
 assert.throws(()=>qrMatrix('x'.repeat(300)),/too long/);
});
test('the endpoint returns a cacheable PNG, and nothing for bad codes or other methods',()=>{
 const ok=fakeRes();handler({method:'GET',query:{code:'56396-K7XM3PQ9RT'}},ok);
 assert.equal(ok.code,200);assert.equal(ok.headers['content-type'],'image/png');assert.match(ok.headers['cache-control'],/immutable/);
 assert.deepEqual([...ok.body.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.deepEqual(ok.body,qrPng(voucherUrl('56396-K7XM3PQ9RT')));
 const bad=fakeRes();handler({method:'GET',query:{code:'hello'}},bad);assert.equal(bad.code,400);assert.equal(bad.headers['cache-control'],'no-store');
 const post=fakeRes();handler({method:'POST',query:{code:'56396-K7XM3PQ9RT'}},post);assert.equal(post.code,405);
});
