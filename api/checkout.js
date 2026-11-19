// Readiness only: carts are posted by the browser directly to the WooCommerce session.
const { settings } = require('./commerce');
const POLICY = Object.freeze({ currency: 'USD', deliveryFee: 3, methods: ['cod', 'whish'], whishNumber: '+961 78 881 100' });
// The WordPress plugin reports the delivery price it charges; 0 is the older plugin (free delivery).
const DELIVERY_FEES = [0, 3];
async function readiness(env = process.env, fetcher = fetch) {
  const catalog = settings(env);
  const preview = env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'codex/woocommerce-connection';
  const allowed = env.WOO_ENABLE_CHECKOUT === 'true' || (preview && env.WOO_ENABLE_CHECKOUT !== 'false');
  if (!catalog.enabled || !allowed) return { enabled: false, ...POLICY };
  const response = await fetcher(new URL('/wp-json/enfantillage/v1/checkout-status', catalog.storeUrl), {
    redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Checkout is not ready');
  const status = await response.json();
  if (status.version !== 2 || status.enabled !== true || status.currency !== POLICY.currency || !DELIVERY_FEES.includes(status.deliveryFee) || status.whishNumber !== POLICY.whishNumber || !Array.isArray(status.methods) || status.methods.length !== 2 || !POLICY.methods.every(m => status.methods.includes(m))) throw new Error('Checkout configuration mismatch');
  return { enabled: true, ...POLICY, deliveryFee: status.deliveryFee, handoffUrl: new URL('/wp-admin/admin-post.php', catalog.storeUrl).href };
}
async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try { return res.status(200).json(await readiness()); }
  catch { return res.status(503).json({ enabled: false, ...POLICY, error: 'Checkout is being connected. Your cart has been kept.' }); }
}
module.exports = handler;
module.exports.readiness = readiness;
