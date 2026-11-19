# Enfantillage checkout handoff — staging draft

Live connector 0.2.0 is installed with checkout and public storefront redirects OFF. This folder contains the 0.3.0 update, which adds explicit product options, verified receipt return and gift wrapping. Native order/stock/receipt checks passed on isolated WordPress 7.0.9 / WooCommerce 11.3.0 using synthetic data; production browser handoff and live compatibility remain to be tested.

The Vercel storefront sends only product IDs, quantities, an opaque cart token and a payment preference to WooCommerce. A dedicated classic WooCommerce checkout collects addresses, calculates totals and creates the real order. It uses WooCommerce's normal checkout nonce/session and order handling. No administrator/API credentials are embedded in the storefront.

Confirmed policy (0.4.0): 5 $ delivery anywhere in Lebanon; COD; Whish to +961 78 881 100, with screenshot and order number sent to that same number. Whish orders stay on hold until the store verifies payment. A screenshot does not automatically mark an order paid. COD orders use processing status with a note that cash is due on delivery.

## Install on a backed-up staging copy first

1. Upload the `enfantillage-checkout` folder as a WordPress plugin ZIP and activate it. Activation alone leaves the handoff disabled.
2. Open WooCommerce → Enfantillage checkout and explicitly enable the handoff after reviewing the policy.
3. Confirm the HTTPS status URL `/wp-json/enfantillage/v1/checkout-status` returns enabled=true and the expected policy. The Vercel preview detects readiness; it will not enable the Continue button on an absent/disabled/mismatched backend.
4. Begin in the exact named Vercel preview branch URL; other preview origins are rejected. Production origins are listed in the plugin for the eventual cutover, but production Vercel checkout stays disabled unless explicitly configured.
5. Use approved test customer details and test email recipients, not real customer information. Check the complete path: simple products → handoff → address → free shipping → COD or Whish → real WooCommerce order → native receipt → stock change. Do not transfer real money for testing.
6. Verify failed stock validation keeps the existing WooCommerce cart; foreign origins, unsupported types and invalid quantities are rejected; amounts submitted by a client cannot set prices. Verify existing storefront checkout, shipping and other payment methods are unchanged for sessions without handoff context.
7. Check duplicate submission, failed/cancelled order handling, Whish order held until manual verification, order email instructions, and that no fabricated frontend success is shown.
8. Keep WordPress on enfantillagestore.com. The new storefront uses www.enfantillagestore.com. After final testing, change only www DNS to the verified Vercel target and enable public storefront redirects. Keep the apex DNS, WordPress URLs, media, email and software callback addresses intact. Do not change Wizard configuration.

## Limits and launch requirements

- Simple products and published, explicitly selected variations are supported. Wildcard/incomplete/ambiguous variations are blocked. Fresh variant identity, price, stock and quantity limits are reloaded from WooCommerce; the backend validates them again.
- Native checkout is served from the WordPress host and uses WooCommerce's own form, not the static site's old simulated form. This avoids a custom order-creation API and custom payment capture.
- Handoff replaces that browser's WooCommerce cart after validating all requested products. Failure restores previous cart contents/coupons. Native WooCommerce checks stock/prices again at order placement.
- The local cart stays on handoff. The native receipt links back using a fragment containing the order key and cart token. A same-origin API verifies the proof server-to-server and returns only order summary/IDs/quantities. Only a matching, unchanged cart within two hours is cleared; edited/newer carts stay. Order credentials are removed from the address bar and never saved in local storage.
- Handoff uses a two-hour WooCommerce session context and only explicitly allowlisted HTTPS origins. Do not add a wildcard origin.
- Payment/shipping behavior is scoped to that handoff context. Disabling the bridge disables its checkout and new gateways; it does not delete orders or change WordPress/Wizard settings.
- Existing SEO spam on the old storefront still needs investigation. A plugin cannot establish that an existing WordPress installation is trustworthy.
- Backup files and databases must be complete and verified before live migration. The user reports the friend completed the requested downloads. Database archive decompression checks passed; the friend’s file archive and a restore have not been independently verified.

## Public storefront redirects (since 0.2.0)

WooCommerce → Enfantillage checkout has a separate checkbox to send recognized public shopping pages to www. It defaults OFF and is independent of checkout readiness. Installation does not enable either feature. Keep it OFF until www serves the tested Vercel production deployment with valid HTTPS. Disabling it restores the legacy shopping routes without changing WordPress URLs, order data or DNS.

The redirect never accepts an arbitrary destination from the browser. Unknown requests and all POST requests stay on WordPress. Marketing query parameters are retained; order/session/callback parameters are excluded. Existing customers can continue accessing their native account and checkout pages.

## 0.3.0 validation and offers

Readiness contract is version 2; frontend checkout stays disabled against older connectors. Seventeen JS tests and four PHP validation suites pass. Isolated native WordPress 7.0.9 / WooCommerce 11.3.0 tests passed for guest variable-product COD/Whish orders, USD totals/free shipping, stock reduction/retry safety, denied foreign origins, excess-stock rollback, receipt proof verification after session expiry and cancelled-order rejection. Browser checks passed option selection, saved variant rehydration, verified cart clearing and edited-cart preservation. Live compatibility remains a separate launch check.

The client confirmed TILLO20 (20% off), 10% in-store cashback, gift wrapping and 30-day exchanges. Gift wrapping is saved in the native order metadata and customer note. Native coupon validation is used; configure and verify TILLO20 in the dashboard before launch (it was absent during the read-only check). The cashback voucher is displayed and stored only in that browser for manual in-store redemption; it is not an email subscription or automatic credit ledger. Do not imply an email was sent or centrally recorded.

## 0.4.0 (20 November 2026)

- Delivery is 5 $ in Lebanon (was free). The status endpoint reports `deliveryFee: 5`; the website accepts 0 (older plugin) or 5 and shows what the plugin reports.
- Email is required at checkout (order confirmation; cashback voucher). The postcode field is removed for the new-storefront checkout only.
- Prices on the new-storefront checkout and its receipts show like the website ("75 $", "7.50 $"). Display only: the store's decimal setting and stored prices are unchanged.
- Install: WordPress → Plugins → Add New → Upload Plugin → `enfantillage-checkout-0.4.0.zip` → "Replace current with uploaded". Settings and the checkout switch are kept.

## 0.5.0 (20 November 2026)

- 20% off everything, automatically (no code), on the new-storefront checkout until the end of 25 December 2026 (Beirut time): one "20% off everything" discount line, rounded per toy to 0.1 $ like the website's prices.
- The old TILLO20 code is refused on the new-storefront checkout (it can't be stacked; after 25 December it says it has expired). It can also be deleted or expired in Marketing → Coupons.
- The status endpoint reports `discount: { pct: 20, until: '2026-12-25' }` while it runs. The website only lowers its prices when it sees this, so before the upload it keeps the TILLO20 wording.
- Includes 0.4.0: 5 $ delivery, no postcode, email required, "75 $" price display.
- Install: Plugins → Add New → Upload Plugin → `enfantillage-checkout-0.5.0.zip` → "Replace current with uploaded".

## 0.6.0 (20 November 2026)

- 10% cashback voucher on new-storefront orders placed until the end of 25 December 2026: 10% of what the customer paid for the toys (after the 20% off, delivery not included), rounded to 0.1 $. Saved on the order ("Cashback voucher"), with a staff note: honour it only once the order is paid, not if cancelled.
- Shown on the WooCommerce thank-you page and at the top of the customer order emails (not for cancelled/failed/refunded orders): "X $ to spend in our store … Show this email (order #…) at Enfantillage, Mazraat Yachouh … Valid until 25 December 2026."
- Includes 0.5.0 and 0.4.0. Install `enfantillage-checkout-0.6.0.zip` with "Replace current with uploaded".

## 0.7.0 (19 November 2026)
- New design for the plugin's own checkout page (delivery & payment, and the thank-you page), matching www.enfantillagestore.com: logo bar, steps, offer pills, details card on the left, order summary with toy pictures on the right, payment cards with the cash and Whish logos, big green "Place my order" button.
- New files: `checkout-page.php` (template, icons, wording) and `checkout-style.css` (printed inline on that page only).
- On this page only, theme and plugin stylesheets are switched off and other plugins' pop-ups at the end of the page are hidden. WooCommerce's scripts and the country picker keep working. No other WordPress page changes.
- No coupon box while the automatic 20% runs; "Shipping" reads "Delivery".
- How to install: wp-admin cannot upload plugins on this site, so copy the files over `wp-content/plugins/enfantillage-checkout/` in cPanel's File Manager (or Fileman API). Backup of 0.3.0: `~/enf-backup-2026-11-19/`.

## 0.8.0 (19 November 2026)
- The automatic 20% is now applied to each toy's price at checkout (10 $ becomes 8 $), exactly as the website shows it, instead of a separate "-20%" line. The usual price is shown crossed out, with a "You save / You saved" line under the total on the checkout page, the thank-you page and the order emails.
- The usual price is kept on each order line as hidden meta `_enf_usual_price`; the cashback voucher still works out to 10% of what was paid.
