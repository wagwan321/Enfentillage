(function () {
  'use strict';
  const fragment=new URLSearchParams(location.hash.slice(1));
  const proof={orderId:Number(fragment.get('orderId')),orderKey:fragment.get('orderKey'),cartToken:fragment.get('cartToken')};
  // Receipt credentials remain in memory, never in server URLs or local storage.
  history.replaceState(null,'',location.pathname+location.search);
  const title=document.getElementById('receiptTitle'),message=document.getElementById('receiptMessage');
  const payment=document.getElementById('receiptPayment'),cartMessage=document.getElementById('receiptCart'),retry=document.getElementById('receiptRetry');
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback;}catch{return fallback;}};
  const verify=async()=>{
    retry.hidden=true;
    try {
      const response=await fetch('/api/receipt',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000),body:JSON.stringify(proof)});
      if (!response.ok) throw new Error('Not verified');
      const receipt=await response.json();
      if (receipt.verified !== true || receipt.orderId !== proof.orderId) throw new Error('Not verified');
      title.textContent='Order received';
      message.textContent='Your order number is '+receipt.number+'. Total: '+Number(receipt.total).toFixed(2)+' USD.';
      payment.textContent=receipt.paymentMethod==='enf_whish'
        ? 'Whish payment is awaiting confirmation. Send the total to +961 78 881 100, then send the screenshot and order number to the same number. The store will verify payment.'
        : 'Pay the courier in cash when your order arrives.';
      const pending=read('enf_handoff',null),cart=read('enf_cart',{});
      if (window.ENF_CHECKOUT.clearPurchased(cart,pending,receipt,proof.cartToken)) {
        localStorage.setItem('enf_cart','{}'); cartMessage.textContent='Your purchased items have been removed from your toy box.';
      } else {cartMessage.textContent=Object.keys(cart).length ? 'Your toy box was kept because it changed during checkout, or this receipt is older.' : 'Your toy box is empty.';}
      if (pending?.token===proof.cartToken) localStorage.removeItem('enf_handoff');
    } catch {
      title.textContent='Check your receipt';
      message.textContent='We could not verify this receipt. Your toy box has been kept. Try again, reopen the receipt from the store checkout, or contact the store.';
      retry.hidden=false;
    }
  };
  retry.addEventListener('click',verify); verify();
})();
