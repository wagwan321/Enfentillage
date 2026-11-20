<?php
/**
 * The plugin's own checkout page (delivery & payment, then the thank-you page), in the website's style.
 * Only this page is affected: the client's existing WordPress pages, theme and checkout stay as they are.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

// Pictures (logo, Whish) come from the new website, so they always match it.
const ENF_STOREFRONT_ASSETS = 'https://www.enfantillagestore.com/assets/img/';

function enf_checkout_page_active() {
    return enf_checkout_is_page() && ( enf_checkout_session() || enf_checkout_receipt_order() );
}

// No WordPress admin bar on the customer page (it is only shown to logged-in staff anyway).
add_filter( 'show_admin_bar', function ( $show ) { return enf_checkout_is_page() ? false : $show; } );

// Theme and plugin stylesheets are made for the old shop; this page brings its own design.
// WooCommerce's scripts (and the country picker's own stylesheet) are kept so the form works as before.
function enf_checkout_drop_styles() {
    if ( ! enf_checkout_page_active() ) { return; }
    $keep = array( 'select2' );
    foreach ( wp_styles()->queue as $handle ) {
        if ( ! in_array( $handle, $keep, true ) ) { wp_dequeue_style( $handle ); }
    }
}
add_action( 'wp_print_styles', 'enf_checkout_drop_styles', 9999 );
add_action( 'wp_print_footer_scripts', 'enf_checkout_drop_styles', 1 );

// Friendlier wording on this page only.
add_filter( 'gettext', function ( $translation, $text, $domain ) {
    if ( 'woocommerce' !== $domain || ! enf_checkout_is_page() ) { return $translation; }
    $words = array(
        'Billing details'               => 'Your delivery details',
        'Ship to a different address?'  => 'Deliver to a different address?',
        'Additional information'        => 'Anything we should know?',
        'Thank you. Your order has been received.' => 'Your order is in. We will be in touch about the delivery.',
    );
    return $words[ $text ] ?? $translation;
}, 10, 3 );

// A few reassuring words under the order button.
add_action( 'woocommerce_review_order_after_submit', function () {
    if ( ! enf_checkout_session() ) { return; }
    echo '<ul class="enf-reassure"><li>Nothing is charged online</li><li>Pay on delivery or by Whish</li><li>Delivery anywhere in Lebanon</li></ul>';
} );

// "Delivery" rather than "Shipping" above the 5 $ line.
add_filter( 'woocommerce_shipping_package_name', function ( $name ) { return enf_checkout_session() ? 'Delivery' : $name; } );

// Same word on the thank-you page and in the order emails of website orders.
add_filter( 'woocommerce_get_order_item_totals', function ( $rows, $order ) {
    if ( isset( $rows['shipping'] ) && is_object( $order ) && 'yes' === $order->get_meta( '_enf_storefront_checkout' ) ) { $rows['shipping']['label'] = 'Delivery:'; }
    return $rows;
}, 10, 2 );

// No coupon box while 20% off everything is automatic.
add_filter( 'woocommerce_coupons_enabled', function ( $enabled ) {
    return ( enf_checkout_session() && enf_discount_active() ) ? false : $enabled;
} );

// A small picture of each toy in the order summary.
add_filter( 'woocommerce_cart_item_name', function ( $name, $item, $key ) {
    if ( ! enf_checkout_session() || ! ( is_checkout() || wp_doing_ajax() ) || empty( $item['data'] ) || ! is_object( $item['data'] ) ) { return $name; }
    return '<span class="enf-thumb">' . $item['data']->get_image( array( 104, 104 ) ) . '</span><span>' . $name . '</span>';
}, 10, 3 );

// Logos on the payment cards.
function enf_payment_icon( $gateway_id ) {
    if ( 'enf_whish' === $gateway_id ) {
        return '<span class="enf-pay-ico"><img src="' . esc_url( ENF_STOREFRONT_ASSETS . 'pay/whish-money.svg' ) . '" alt="Whish Money" width="124" height="28"></span>';
    }
    return '<span class="enf-pay-ico"><svg viewBox="0 0 48 32" width="44" height="30" aria-hidden="true"><rect x="2" y="4" width="44" height="24" rx="4" fill="#3db54a"/><rect x="6" y="8" width="36" height="16" rx="2" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/><circle cx="24" cy="16" r="5.5" fill="#fff"/><text x="24" y="19.6" font-size="9" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" fill="#3db54a">$</text></svg></span>';
}
add_filter( 'woocommerce_gateway_icon', function ( $icon, $id ) {
    return in_array( $id, array( 'enf_cod', 'enf_whish' ), true ) && enf_checkout_session() ? enf_payment_icon( $id ) : $icon;
}, 10, 2 );

function enf_checkout_page_html( $context, $return_url, $receipt_order ) {
    // the apex address is WordPress itself; links back always go to the new website
    $site  = 'https://enfantillagestore.com' === $context['origin'] ? 'https://www.enfantillagestore.com' : $context['origin'];
    $shop  = $return_url ?: $site . '/shop.html';
    $done  = (bool) $receipt_order;
    $css   = (string) @file_get_contents( __DIR__ . '/checkout-style.css' );
    $lock  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
    ?><!doctype html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo( 'charset' ); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#25318c">
<title><?php echo $done ? 'Thank you — Enfantillage' : 'Delivery &amp; payment — Enfantillage'; ?></title>
<link rel="icon" href="<?php echo esc_url( ENF_STOREFRONT_ASSETS . 'icons/favicon-48.png' ); ?>">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&amp;family=Nunito:wght@600;700;800;900&amp;display=swap" rel="stylesheet">
<?php wp_head(); ?>
<style id="enf-checkout-style"><?php echo $css; // static file shipped with the plugin ?></style>
</head><body class="woocommerce woocommerce-checkout enf-co-body">
<header class="enf-top"><div class="enf-wrap">
  <a class="enf-logo" href="<?php echo esc_url( $site . '/' ); ?>"><img src="<?php echo esc_url( ENF_STOREFRONT_ASSETS . 'logo.png' ); ?>" alt="Enfantillage" width="700" height="400"></a>
  <span class="enf-secure"><?php echo $lock; ?> Secure checkout</span>
  <a class="enf-back" href="<?php echo esc_url( $shop ); ?>">← <?php echo $done ? 'Back to Enfantillage' : 'Back to the shop'; ?></a>
</div></header>
<main class="enf-co enf-wrap">
  <ol class="enf-steps" aria-label="Checkout steps">
    <li class="is-done"><b>✓</b>Toy box</li>
    <li class="<?php echo $done ? 'is-done' : 'is-on'; ?>"><b><?php echo $done ? '✓' : '2'; ?></b>Delivery &amp; payment</li>
    <li class="<?php echo $done ? 'is-on' : ''; ?>"><b>3</b>Done</li>
  </ol>
  <h1><?php echo $done ? 'Thank you for your order!' : 'Delivery &amp; payment'; ?></h1>
  <?php if ( ! $done ) { ?>
  <ul class="enf-perks">
    <?php if ( enf_discount_active() ) { ?><li class="is-red"><i>-<?php echo (int) ENF_DISCOUNT_PCT; ?>%</i>Already taken off everything</li><?php } ?>
    <?php $enf_fee = enf_cart_delivery_fee(); ?>
    <li class="is-blue"><i><?php echo (int) $enf_fee; ?> $</i><?php echo ENF_LARGE_DELIVERY_FEE === $enf_fee ? 'Delivery for large toys, anywhere in Lebanon' : 'Delivery anywhere in Lebanon'; ?></li>
    <?php if ( enf_discount_active() ) { ?><li class="is-green"><i>+<?php echo (int) ENF_CASHBACK_PCT; ?>%</i>Back as a store voucher</li><?php } ?>
  </ul>
  <?php } ?>
  <?php echo do_shortcode( '[woocommerce_checkout]' ); ?>
  <?php if ( $return_url ) { ?><a class="enf-return" href="<?php echo esc_url( $return_url ); ?>">Back to Enfantillage →</a><?php } ?>
</main>
<footer class="enf-foot">Enfantillage · Mazraat Yachouh · Toys delivered anywhere in Lebanon</footer>
<?php wp_footer(); ?></body></html><?php
}
