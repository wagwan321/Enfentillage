/* Shared checkout contract: no prices or customer information are submitted in the handoff. */
(function (root) {
  function cartItems(cart, byId) {
    if (!cart || typeof cart !== 'object' || Array.isArray(cart)) throw new Error('Please review your cart.');
    const entries = Object.entries(cart);
    if (!entries.length || entries.length > 30) throw new Error('Please choose between 1 and 30 different products.');
    return entries.map(([id, quantity]) => {
      const product = byId.get(Number(id));
      if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99 || !product || !product._live || !product.s || !product._canAdd || product.v) throw new Error('A product or quantity needs checking. Please review your cart.');
      return { id: Number(id), quantity };
    });
  }
  const api = { cartItems };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ENF_CHECKOUT = api;
})(typeof window !== 'undefined' ? window : {});
