// Verify an order receipt through the configured store. Never return customer details.
const { settings } = require('./commerce');
const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
async function verifyReceipt(input, env = process.env, fetcher = fetch) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !Number.isSafeInteger(input.orderId) || input.orderId < 1 ||
      typeof input.orderKey !== 'string' || !/^wc_order_[A-Za-z0-9]{8,80}$/.test(input.orderKey) ||
      typeof input.cartToken !== 'string' || !tokenPattern.test(input.cartToken)) throw new Error('Invalid receipt');
  const config = settings(env);
  if (!config.enabled) throw new Error('Store unavailable');
  const response = await fetcher(new URL('/wp-json/enfantillage/v1/receipt', config.storeUrl), {
    method:'POST', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(12000), headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({orderId:input.orderId,orderKey:input.orderKey,cartToken:input.cartToken})
  });
  if (!response.ok) throw new Error('Receipt not verified');
  const r = await response.json();
  if (r.verified !== true || r.orderId !== input.orderId || !['processing','on-hold','completed'].includes(r.status) ||
      !['enf_cod','enf_whish'].includes(r.paymentMethod) || r.currency !== 'USD' ||
      typeof r.number !== 'string' || !r.number || r.number.length > 100 || typeof r.total !== 'string' || r.total.length > 32 || !/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(r.total) || !Number.isFinite(Number(r.total)) ||
      !Array.isArray(r.items) || !r.items.length || r.items.length > 100 || r.items.some(i => !Number.isSafeInteger(i.id) || i.id < 1 || !Number.isSafeInteger(i.quantity) || i.quantity < 1) ||
      new Set(r.items.map(i=>i.id)).size !== r.items.length) throw new Error('Invalid receipt response');
  return {verified:true,orderId:r.orderId,number:r.number,status:r.status,paymentMethod:r.paymentMethod,currency:r.currency,total:String(r.total),items:r.items.map(i=>({id:i.id,quantity:i.quantity}))};
}
async function handler(req,res) {
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method !== 'POST') {res.setHeader('Allow','POST');return res.status(405).json({verified:false});}
  try {
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(input || {}).length > 2048) throw new Error('Invalid receipt');
    return res.status(200).json(await verifyReceipt(input));
  } catch {return res.status(400).json({verified:false,error:'We could not verify this order. Your toy box has been kept. Contact the store if you need help.'});}
}
module.exports=handler;
module.exports.verifyReceipt=verifyReceipt;
