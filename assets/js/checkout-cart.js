/* Shared checkout contract: no prices or customer information are submitted in the handoff. */
(function (root) {
  function cartItems(cart, byId) {
    if (!cart || typeof cart !== 'object' || Array.isArray(cart)) throw new Error('Please review your cart.');
    const entries = Object.entries(cart);
    if (!entries.length || entries.length > 30) throw new Error('Please choose between 1 and 30 different products.');
    return entries.map(([id, quantity]) => {
      const product = byId.get(Number(id));
      if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || (product && quantity > (product._maxQty || 99)) || !product || !product._live || !product.s || !product._canAdd || product.v) throw new Error('A product or quantity needs checking. Please review your cart.');
      return { id: Number(id), quantity };
    });
  }
  function clearPurchased(cart, pending, receipt, cartToken, now = Date.now()) {
    if (!receipt || receipt.verified !== true || !['processing','on-hold','completed'].includes(receipt.status) || !pending || pending.token !== cartToken ||
        !Number.isFinite(pending.createdAt) || now < pending.createdAt || now - pending.createdAt > 2*60*60*1000) return false;
    const normalize = value => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const entries=Object.entries(value);
      if (!entries.length || entries.some(([id,q])=>!/^[1-9]\d*$/.test(id)||!Number.isSafeInteger(Number(id))||!Number.isInteger(q)||q<1)) return null;
      return JSON.stringify(entries.sort((a,b)=>Number(a[0])-Number(b[0])));
    };
    const purchased={};
    if (!Array.isArray(receipt.items)) return false;
    for (const item of receipt.items) {
      if (!Number.isSafeInteger(item.id)||item.id<1||!Number.isInteger(item.quantity)||item.quantity<1||purchased[item.id]) return false;
      purchased[item.id]=item.quantity;
    }
    const saved=normalize(pending.cart);
    return saved !== null && normalize(cart) === saved && normalize(purchased) === saved;
  }
  const api = { cartItems, clearPurchased };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ENF_CHECKOUT = api;
})(typeof window !== 'undefined' ? window : {});
