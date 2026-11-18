# Enfantillage checkout handoff — staging draft

Not installed on the live store. No real order/payment/stock test has run.

The Vercel storefront sends only product IDs, quantities and a payment preference to WooCommerce. A dedicated classic WooCommerce checkout collects addresses, calculates totals and creates the real order. It uses WooCommerce's normal checkout nonce/session and order handling. No administrator/API credentials are embedded in the storefront.

Confirmed policy: free delivery in Lebanon; COD; Whish to +961 78 881 100, with screenshot and order number sent to that same number. Whish orders stay on hold until the store verifies payment. A screenshot does not automatically mark an order paid. COD orders use processing status with a note that cash is due on delivery.

## Install on a backed-up staging copy first

1. Upload the `enfantillage-checkout` folder as a WordPress plugin ZIP and activate it. Activation alone leaves the handoff disabled.
2. Open WooCommerce → Enfantillage checkout and explicitly enable the handoff after reviewing the policy.
3. Confirm the HTTPS status URL `/wp-json/enfantillage/v1/checkout-status` returns enabled=true and the expected policy. The Vercel preview detects readiness; it will not enable the Continue button on an absent/disabled/mismatched backend.
4. Begin in the exact named Vercel preview branch URL; other preview origins are rejected. Production origins are listed in the plugin for the eventual cutover, but production Vercel checkout stays disabled unless explicitly configured.
5. Use approved test customer details and test email recipients, not real customer information. Check the complete path: simple products → handoff → address → free shipping → COD or Whish → real WooCommerce order → native receipt → stock change. Do not transfer real money for testing.
6. Verify failed stock validation keeps the existing WooCommerce cart; foreign origins, unsupported types and invalid quantities are rejected; amounts submitted by a client cannot set prices. Verify existing storefront checkout, shipping and other payment methods are unchanged for sessions without handoff context.
7. Check duplicate submission, failed/cancelled order handling, Whish order held until manual verification, order email instructions, and that no fabricated frontend success is shown.
8. Test on a separate stable backend hostname before changing the main domain's DNS. Preserve media, email, callbacks and existing integrations. Do not change Wizard configuration.

## Limits and launch requirements

- Simple products only at present. Variable products remain blocked; option selection needs a separate implementation and tests.
- Native checkout is served from the WordPress host and uses WooCommerce's own form, not the static site's old simulated form. This avoids a custom order-creation API and custom payment capture.
- Handoff replaces that browser's WooCommerce cart after validating all requested products. Failure restores previous cart contents/coupons. Native WooCommerce checks stock/prices again at order placement.
- The local storefront cart is retained on handoff so a failed redirect does not lose it. Automatic cart clearing after a verified purchase remains to be implemented; test back/forward navigation before launch.
- Handoff uses a two-hour WooCommerce session context and only explicitly allowlisted HTTPS origins. Do not add a wildcard origin.
- Payment/shipping behavior is scoped to that handoff context. Disabling the bridge disables its checkout and new gateways; it does not delete orders or change WordPress/Wizard settings.
- Existing SEO spam on the old storefront still needs investigation. A plugin cannot establish that an existing WordPress installation is trustworthy.
- Backup files and databases must be complete and verified before live migration. Current file download is unfinished; database archive decompression checks passed, but no restore test has run.
