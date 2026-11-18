# WooCommerce connection — draft branch, not deployed

This branch begins the integration. It is not ready for production or domain cutover.

## Prepared

- Public Store API catalog reader in api/commerce.js; opt-in via WOO_ENABLE_CATALOG=true and WOO_STORE_URL (HTTPS origin).
- Bounded pagination, complete-response validation, timeout handling, no forwarding of cookies/credentials, 60-second CDN caching.
- Browser adapter replaces the snapshot's product names, prices, images, ages, availability and brand values with WooCommerce data before page initialization.
- New products appear in the catalog; actual WooCommerce categories appear in the shop's Store categories filter. Existing curated category/character assignments are retained as presentation hints for existing products; these hints still require reconciliation against current taxonomy.
- API failure disables purchase buttons. Only simple products can be added in this initial draft. Variable products require a real options selector and are blocked from adding.
- Removed the ability to display a fake successful order: checkout keeps the cart and directs customers to call until a real order path has been implemented and tested.
- No API key is needed for public product reads. No WordPress or Wizard changes made.

## Still required

1. Full hosting files/database backup (product CSV is already saved separately).
2. Hosting login is verified, but cPanel backup pages render blank. After a full backup, configure a stable backend hostname/certificate and safely migrate WordPress URLs, media and callbacks. Do not move main-domain DNS to Vercel first.
3. Investigate the spam content on the existing WordPress site before trusting it as a production backend.
4. Implement and test customer cart handoff to native WooCommerce checkout, or a complete Store API checkout with compatible payment integration. No orders/payments have been tested.
5. Complete variation selection and stock quantity validation. Live product descriptions now use the single-product Store API, rendered as escaped text; browser verification is still required.
6. Reconcile snapshot catalog/category hints and static marketing: the existing site advertises a 20% coupon, cashback, fixed delivery prices and Whish. These claims have not been verified against WooCommerce (which currently shows Stripe active and MontyPay inactive). Remove or validate them before launch.
7. Live default Store API catalog returned 1,407 products (1,347 simple, 60 variable) in 11.8 seconds on 18 November. Export reconciliation: 1,389 published in-stock + 18 published backorder = 1,407; 2,530 published out-of-stock products and one draft are outside this default catalog. Confirm whether the new site should also display out-of-stock products before changing this behavior.
8. Deploy only to a verified preview of the correct Vercel project; test end to end before production cutover.

## Validation

Run: node --test tests/*.test.cjs

Seven tests cover opt-in configuration, invalid store URLs/IDs, pagination completeness, duplicate rejection, failure handling, new-product adaptation, currency units and not forwarding credentials. Live catalog and two single-product read checks passed. Syntax checks passed for edited JavaScript. Browser UI and full checkout tests are pending.

The connected Vercel tool account does not expose this project; the correct project is accessible in the browser. Shell GitHub authentication lacks write access, so pushing the draft is blocked. The correct repository is https://github.com/wagwan321/Enfentillage . Local branch: codex/woocommerce-connection. No push, deployment or DNS change has been made.
