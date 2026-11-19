# WooCommerce integration — preview draft

Preview branch: `codex/woocommerce-connection`. Draft PR: https://github.com/wagwan321/Enfentillage/pull/1 . Nothing merged into main. The checkout connector is installed and activated on WordPress with its checkout switch OFF. No DNS or Wizard changes have been made.

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
- The plugin is installed and activated on the live store; the public readiness endpoint confirms enabled=false. Production remains closed to this handoff. Live-client order creation and email delivery have not been tested.

## Validation

11 JavaScript tests pass (`node --test tests/*.test.cjs`). PHP syntax checks and isolated PHP 8.2 cart/gateway tests passed. The PHP tests use stubs for WordPress/WooCommerce and are not a staging integration test. Native PHP runners: `php tests/checkout-validation.php` and `php tests/checkout-gateway.php`.

A local browser fixture verified add-to-cart → review, free delivery, Whish instructions and disabled submission when readiness fails. It used a synthetic product, not the client's live order system.

## Before launch

1. Complete/verify website file backup; two SQL downloads passed decompression checks, but a restoration test has not run. The user reports the friend completed the three requested downloads; filenames, sizes and home-directory archive integrity have not been independently verified.
2. Complete checkout integration tests and then a controlled production smoke test. The live connector is installed but remains OFF. See its README for test cases. Installing/activating custom WordPress code is a separate server change, not accomplished by pushing the Vercel branch.
3. Finish variable-product option selection; these products remain blocked. Test stock quantities, duplicate submission, failed/cancelled orders, both offline payment choices and client payment confirmation.
4. Handle frontend cart cleanup only after a verified purchase; currently it is retained on handoff to prevent losing it on a failed redirect.
5. Investigate unrelated SEO spam seen on the old WordPress storefront before relying on it for production. Do not copy arbitrary old scripts/HTML.
6. Reconcile static marketing/coupon/cashback claims elsewhere in the site. Checkout no longer advertises those unverified promises.
7. Use the existing apex for WordPress and www for Vercel, as detailed below. Do not change WordPress URLs or the apex A record. Cut over www only after all launch requirements pass.

## Access verified 19 November 2026

Chris’s Vercel connector now accesses the correct project. The preview configuration endpoint enables the catalog; its checkout endpoint returns 503 enabled=false while WordPress checkout is OFF. No Vercel environment variables are currently configured. Current public catalog: 1,407 products, including 60 variable parents with 161 variations; variable purchases are safely blocked until option selection is implemented.

## Native checkout integration checks — 19 November 2026

A fresh isolated WordPress 7.0.9 / WooCommerce 11.3.0 installation passed guest native checkout for COD and Whish: $20 total, $0 delivery, correct processing/on-hold status, correct receipt and manual Whish instructions. Stock decreased 10 → 8 → 6; retrying gateway processing did not reduce it twice. Receipts worked after clearing the handoff context. Only synthetic data was used and test email was suppressed. Cross-origin browser handoff, production TLS/cookies, client plugin compatibility and actual email delivery remain unverified.

## Hosting without WHM — prepared 19 November 2026

The new storefront will use `https://www.enfantillagestore.com`. WordPress retains `https://enfantillagestore.com`, including `/wp-admin/`, `/wp-json/`, media and the dedicated checkout. The public REST index confirms both WordPress URL and Home are already the apex. A new backend subdomain and WHM settings are unnecessary for this architecture.

Connector 0.2.0 adds a separate, default-OFF `enf_storefront_enabled` switch. When enabled, only recognized public home/shop/product/category/product-search GET or HEAD requests on the apex redirect to their www equivalents. Product and category IDs map to the static site's actual routes. Unknown query parameters, POSTs, previews, feeds, 404s, admin/account/checkout routes and callbacks stay on WordPress. Redirect destinations have a fixed www origin; www requests never redirect back to themselves. Redirects use non-cacheable 302 responses for initial launch.

Live DNS is currently apex A 57.129.68.111 proxied, www CNAME apex proxied. At cutover, change only www to Vercel's verified project-specific target, using DNS-only mode, and verify www TLS. Keep the apex, email records and WordPress Home/Site URL intact. Do not use a blanket Cloudflare root-to-www redirect: it could capture software callbacks or checkout requests.

The local draft is not the installed version. Live remains connector 0.1.0 with checkout OFF. Installing 0.2.0, enabling redirects, enabling checkout and the www DNS cutover are distinct actions. No launch is implied by packaging the update.
