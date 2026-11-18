# WooCommerce integration — preview draft

Preview branch: `codex/woocommerce-connection`. Draft PR: https://github.com/wagwan321/Enfentillage/pull/1 . Nothing merged into main; no DNS, live WordPress or Wizard changes made.

## Catalog

Public Store API catalog and live descriptions are implemented. The named Vercel preview is opt-in enabled by both its Preview environment and exact Git branch. Production remains disabled unless explicitly configured. Failed reads disable purchasing. Pagination rejects incomplete/duplicate responses; public catalog reads require no API key.

The read-only live download returned 1,407 products: 1,389 published in-stock + 18 published backorder in the CSV. The CSV also contains 2,530 published out-of-stock products and one draft outside that default catalog. Storefront categories include WooCommerce categories; curated snapshot category/character hints still require reconciliation.

## Checkout draft

- Confirmed policy: free Lebanon delivery; COD; Whish to **+961 78 881 100**, with payment screenshot and order number sent to the same number; Whish waits for manual verification.
- Replaced the simulated checkout with cart review and payment preference. No fabricated order numbers, customer PII in local storage, local discount promises or fake successful orders.
- `/api/checkout` verifies the WordPress handoff plugin's readiness and policy before enabling Continue. It fails closed if the backend is absent, disabled, unavailable or inconsistent. Production checkout remains opt-in.
- Prepared `wordpress/enfantillage-checkout/`: a separately installed WordPress plugin that validates the entire cart and transfers only product IDs/quantities to WooCommerce. WooCommerce's dedicated classic checkout collects addresses and creates orders with its normal session/nonce/stock checks. No WordPress admin credentials or API keys are embedded in the frontend.
- The plugin is disabled by default and requires an administrator to enable it. Only allowlisted frontend origins may hand off carts. Free shipping and offline gateways are scoped to the handoff session; existing sessions keep their configured shipping/payments.
- Whish orders are on hold; COD orders use processing with an explicit note that payment is due on delivery. Repeated gateway processing must not reduce stock again. Native WooCommerce order receipt validates the order key; receipt links remain accessible after handoff-session expiry.
- No plugin has been uploaded/activated on the live store. Real order creation, native checkout redirects, order emails, shipping and stock behavior have NOT been validated end to end in an actual WooCommerce installation.

## Validation

11 JavaScript tests pass (`node --test tests/*.test.cjs`). PHP syntax checks and isolated PHP 8.2 cart/gateway tests passed. The PHP tests use stubs for WordPress/WooCommerce and are not a staging integration test. Native PHP runners: `php tests/checkout-validation.php` and `php tests/checkout-gateway.php`.

A local browser fixture verified add-to-cart → review, free delivery, Whish instructions and disabled submission when readiness fails. It used a synthetic product, not the client's live order system.

## Before launch

1. Complete/verify website file backup; two SQL downloads passed decompression checks, but a restoration test has not run. Full account archive and home-directory download were still incomplete at the last backup check.
2. Install and test the checkout plugin on a backed-up staging copy first. See its README for test cases. Installing/activating custom WordPress code is a separate server change, not accomplished by pushing the Vercel branch.
3. Finish variable-product option selection; these products remain blocked. Test stock quantities, duplicate submission, failed/cancelled orders, both offline payment choices and client payment confirmation.
4. Handle frontend cart cleanup only after a verified purchase; currently it is retained on handoff to prevent losing it on a failed redirect.
5. Investigate unrelated SEO spam seen on the old WordPress storefront before relying on it for production. Do not copy arbitrary old scripts/HTML.
6. Reconcile static marketing/coupon/cashback claims elsewhere in the site. Checkout no longer advertises those unverified promises.
7. Configure a separate stable WordPress backend hostname, certificate, WordPress/media URLs and callbacks, preserving email and existing integrations. DNS alone is not sufficient. Only then switch the main domain to Vercel after end-to-end tests.
