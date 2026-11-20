<?php
/**
 * Plugin Name: Enfantillage Checkout Handoff
 * Description: An opt-in cart handoff to WooCommerce checkout, 5 $ Lebanon delivery (15 $ with a large item), COD and manually confirmed Whish payments. Disabled until explicitly enabled by an administrator.
 * Version: 0.9.0
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
// One delivery price anywhere in Lebanon (US dollars). The website reads it from the status endpoint.
const ENF_DELIVERY_FEE = 5;
// Large toys (play sets, slides, trampolines, ride-ons, bikes, strollers, big pools...) cost 15 $ to deliver.
// Staff mark them in WooCommerce: Product data > Shipping > Shipping class "Large item" (slug large-item).
// Several large toys in one order still pay 15 $ once.
const ENF_LARGE_DELIVERY_FEE = 15;
const ENF_LARGE_CLASS = 'large-item';
function enf_is_large( $product ) {
    return is_object( $product ) && method_exists( $product, 'get_shipping_class' ) && ENF_LARGE_CLASS === $product->get_shipping_class();
}
// delivery for a list of cart lines (a shipping package's contents, or the cart itself)
function enf_delivery_fee_for( $lines ) {
    foreach ( (array) $lines as $line ) {
        if ( ! empty( $line['data'] ) && enf_is_large( $line['data'] ) ) { return ENF_LARGE_DELIVERY_FEE; }
    }
    return ENF_DELIVERY_FEE;
}
function enf_cart_delivery_fee() {
    return function_exists( 'WC' ) && WC()->cart ? enf_delivery_fee_for( WC()->cart->get_cart() ) : ENF_DELIVERY_FEE;
}
// IDs of the products (and their options) marked "Large item", for the website to show 15 $ beforehand.
function enf_large_product_ids() {
    if ( ! taxonomy_exists( 'product_shipping_class' ) || ! term_exists( ENF_LARGE_CLASS, 'product_shipping_class' ) ) { return array(); }
    $ids = get_posts( array(
        'post_type' => array( 'product', 'product_variation' ), 'post_status' => 'publish', 'fields' => 'ids',
        'posts_per_page' => 3000, 'no_found_rows' => true,
        'tax_query' => array( array( 'taxonomy' => 'product_shipping_class', 'field' => 'slug', 'terms' => ENF_LARGE_CLASS ) ),
    ) );
    return array_values( array_map( 'intval', $ids ) );
}
// Christmas campaign: 20% off everything, applied automatically (no code) until the end of 25 December (Beirut time).
const ENF_DISCOUNT_PCT = 20;
const ENF_DISCOUNT_UNTIL = '2026-12-26 00:00:00';
function enf_discount_active() {
    try { $end = new DateTimeImmutable( ENF_DISCOUNT_UNTIL, new DateTimeZone( 'Asia/Beirut' ) ); }
    catch ( Throwable $error ) { return false; }
    return time() < $end->getTimestamp();
}
// 10% cashback: a voucher to spend in the store, worth 10% of what the customer paid for the toys
// (after the 20% off, delivery not included). Valid until the last day of the campaign.
const ENF_CASHBACK_PCT = 10;
const ENF_CASHBACK_VALID_UNTIL = '25 December 2026';
function enf_cashback_for_order( $order ) {
    $paid = (float) $order->get_subtotal() - (float) $order->get_discount_total();
    foreach ( $order->get_fees() as $fee ) { $paid += (float) $fee->get_total(); }   // the "20% off everything" line is negative
    return max( 0, round( $paid * ENF_CASHBACK_PCT / 100, 1 ) );
}
function enf_cashback_html( $order ) {
    $amount = (float) $order->get_meta( '_enf_cashback' );
    if ( $amount <= 0 ) { return ''; }
    return '<div style="margin:16px 0;padding:16px 18px;border:3px dashed #ffc83d;border-radius:16px;background:#fff8e6;color:#1e2459">'
        . '<p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#e8222b;text-transform:uppercase">Enfantillage cashback voucher</p>'
        . '<p style="margin:0 0 6px;font-size:24px;font-weight:bold">' . wp_kses_post( wc_price( $amount ) ) . ' to spend in our store</p>'
        . '<p style="margin:0;font-size:14px">That&rsquo;s ' . ENF_CASHBACK_PCT . '% of your order. Show this email (order #' . esc_html( $order->get_order_number() ) . ') at Enfantillage, Mazraat Yachouh, to use it on your next purchase. Valid until ' . esc_html( ENF_CASHBACK_VALID_UNTIL ) . '.</p>'
        . '</div>';
}
function enf_cashback_text( $order ) {
    $amount = (float) $order->get_meta( '_enf_cashback' );
    if ( $amount <= 0 ) { return ''; }
    return 'Your cashback voucher: ' . html_entity_decode( wp_strip_all_tags( wc_price( $amount ) ) ) . ' to spend in our store (' . ENF_CASHBACK_PCT . '% of your order). Show this email (order #' . $order->get_order_number() . ') at Enfantillage, Mazraat Yachouh, to use it on your next purchase. Valid until ' . ENF_CASHBACK_VALID_UNTIL . ".\n\n";
}
// Discount per toy, rounded like the store's prices (0.1 $), so it matches the prices shown on the website.
function enf_discount_for( $price ) {
    return round( (float) $price * ENF_DISCOUNT_PCT / 100, 1 );
}
require_once __DIR__ . '/cart-validation.php';
require_once __DIR__ . '/storefront-routing.php';
require_once __DIR__ . '/receipt-validation.php';
require_once __DIR__ . '/checkout-page.php';
add_action( 'before_woocommerce_init', function () {
    if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
    }
} );

function enf_checkout_enabled() {
    return '1' === get_option( 'enf_checkout_enabled', '0' ) && function_exists( 'WC' );
}
function enf_checkout_session() {
    if ( ! enf_checkout_enabled() || ! WC()->session ) { return false; }
    $context = WC()->session->get( 'enf_checkout_context' );
    return is_array( $context ) && isset( $context['expires'], $context['origin'] ) &&
        $context['expires'] > time() && in_array( $context['origin'], enf_checkout_origins(), true );
}
function enf_checkout_origins() {
    return array(
        'https://enfantillage-git-codex-woocommerce-connection-chriselhaddad.vercel.app',
        'https://enfantillagestore.com',
        'https://www.enfantillagestore.com',
    );
}
function enf_checkout_url() { return add_query_arg( 'enf_checkout', '1', home_url( '/' ) ); }
function enf_checkout_is_page() {
    return isset( $_GET['enf_checkout'] ) && '1' === $_GET['enf_checkout'];
}
function enf_checkout_receipt_order() {
    if ( ! function_exists( 'wc_get_order' ) || ! isset( $_GET['order-received'], $_GET['key'] ) ||
        ! is_string( $_GET['order-received'] ) || ! ctype_digit( $_GET['order-received'] ) || ! is_string( $_GET['key'] ) ) { return false; }
    $order = wc_get_order( (int) $_GET['order-received'] );
    return $order && 'yes' === $order->get_meta( '_enf_storefront_checkout' ) &&
        hash_equals( $order->get_order_key(), wp_unslash( $_GET['key'] ) ) ? $order : false;
}

// Activation alone changes no store payment, shipping, domain or WordPress URL settings.
add_action( 'admin_init', function () {
    register_setting( 'enf_checkout', 'enf_checkout_enabled', array(
        'type' => 'string', 'sanitize_callback' => function ( $value ) { return '1' === $value ? '1' : '0'; }, 'default' => '0',
    ) );
    register_setting( 'enf_checkout', 'enf_storefront_enabled', array(
        'type' => 'string', 'sanitize_callback' => function ( $value ) { return '1' === $value ? '1' : '0'; }, 'default' => '0',
    ) );
} );
add_action( 'admin_menu', function () {
    add_submenu_page( 'woocommerce', 'Enfantillage checkout', 'Enfantillage checkout', 'manage_options', 'enf-checkout', function () {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        echo '<div class="wrap"><h1>Enfantillage checkout</h1><p>Cart handoff for the new storefront. Delivery in Lebanon: 5 $, or 15 $ once when the order has a product in the shipping class &ldquo;Large item&rdquo;. Cash on delivery or Whish to +961 78 881 100; customers send a payment screenshot to the same number. Whish requires manual confirmation.</p><p>Enable only after backup and staging tests. Existing store settings and Wizard are not modified.</p><form method="post" action="options.php">';
        settings_fields( 'enf_checkout' );
        echo '<input type="hidden" name="enf_checkout_enabled" value="0"><label><input type="checkbox" name="enf_checkout_enabled" value="1" ' . checked( get_option( 'enf_checkout_enabled', '0' ), '1', false ) . '> Enable new-storefront checkout handoff</label>';
        echo '<hr><p>Launch setup: the new website uses www.enfantillagestore.com. WordPress, its dashboard and software connections keep enfantillagestore.com. Enable the following switch only after the www website is ready.</p><input type="hidden" name="enf_storefront_enabled" value="0"><label><input type="checkbox" name="enf_storefront_enabled" value="1" ' . checked( get_option( 'enf_storefront_enabled', '0' ), '1', false ) . '> Send public shopping pages to the new www website</label>';
        submit_button();
        echo '</form></div>';
    } );
} );

// Public readiness signal contains no keys, orders or customer information.
add_action( 'rest_api_init', function () {
    register_rest_route( 'enfantillage/v1', '/checkout-status', array(
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => function () {
            $response = new WP_REST_Response( array(
                'version' => 2, 'enabled' => enf_checkout_enabled(),
                'currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : null, 'deliveryFee' => ENF_DELIVERY_FEE,
                'largeDeliveryFee' => ENF_LARGE_DELIVERY_FEE, 'largeItems' => enf_large_product_ids(),
                'methods' => array( 'cod', 'whish' ), 'whishNumber' => '+961 78 881 100',
                'discount' => enf_discount_active() ? array( 'pct' => ENF_DISCOUNT_PCT, 'until' => '2026-12-25' ) : null,
            ) );
            $response->header( 'Cache-Control', 'no-store' );
            return $response;
        },
    ) );
    register_rest_route( 'enfantillage/v1', '/receipt', array(
        'methods' => 'POST', 'permission_callback' => '__return_true',
        'callback' => function ( $request ) {
            if ( strlen( $request->get_body() ) > 2048 ) { return new WP_Error( 'enf_receipt', 'Receipt could not be verified.', array( 'status' => 404 ) ); }
            $data = enf_checkout_receipt_data( $request->get_json_params() );
            if ( ! $data ) { return new WP_Error( 'enf_receipt', 'Receipt could not be verified.', array( 'status' => 404 ) ); }
            $response = new WP_REST_Response( $data ); $response->header( 'Cache-Control', 'no-store' );
            return $response;
        },
    ) );
} );

function enf_checkout_handoff() {
    if ( ! enf_checkout_enabled() || ! is_ssl() || 'POST' !== $_SERVER['REQUEST_METHOD'] ) {
        wp_die( 'Checkout handoff is unavailable.', 'Checkout', array( 'response' => 503 ) );
    }
    $origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? $_SERVER['HTTP_ORIGIN'] : '';
    if ( ! in_array( $origin, enf_checkout_origins(), true ) ) {
        wp_die( 'Please start checkout from the Enfantillage website.', 'Checkout', array( 'response' => 403 ) );
    }
    $raw = isset( $_POST['items'] ) && is_string( $_POST['items'] ) ? wp_unslash( $_POST['items'] ) : '';
    $method = isset( $_POST['payment'] ) && is_string( $_POST['payment'] ) ? $_POST['payment'] : '';
    $token = isset( $_POST['cart_token'] ) && is_string( $_POST['cart_token'] ) ? $_POST['cart_token'] : '';
    if ( strlen( $raw ) > 16384 || ! in_array( $method, array( 'cod', 'whish' ), true ) ||
        ! preg_match( '/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $token ) ) {
        wp_die( 'Invalid checkout request.', 'Checkout', array( 'response' => 400 ) );
    }
    try {
        $items = enf_checkout_validate_items( json_decode( $raw, true, 32, JSON_THROW_ON_ERROR ), 'wc_get_product' );
    } catch ( Throwable $error ) {
        wp_die( esc_html( $error instanceof InvalidArgumentException ? $error->getMessage() : 'The cart could not be read.' ), 'Checkout', array( 'response' => 400 ) );
    }
    wc_load_cart();
    $cart = WC()->cart;
    $session = WC()->session;
    $old_items = $cart->get_cart();
    $old_coupons = $cart->get_applied_coupons();
    $old_context = $session->get( 'enf_checkout_context' );
    $old_method = $session->get( 'chosen_payment_method' );
    try {
        $cart->empty_cart( false );
        $session->set( 'enf_checkout_context', array( 'origin' => $origin, 'expires' => time() + 2 * HOUR_IN_SECONDS, 'cart_token' => $token ) );
        foreach ( $items as $item ) {
            $product = wc_get_product( $item['id'] );
            $added = $product && $product->is_type( 'variation' )
                ? $cart->add_to_cart( $product->get_parent_id(), $item['quantity'], $item['id'], $product->get_variation_attributes() )
                : $cart->add_to_cart( $item['id'], $item['quantity'] );
            if ( ! $added ) { throw new RuntimeException( 'Cart validation failed.' ); }
        }
        // Recompute rates instead of reusing an earlier store cart's shipping cache.
        foreach ( array_keys( $session->get_session_data() ) as $key ) {
            if ( 0 === strpos( $key, 'shipping_for_package_' ) ) { $session->__unset( $key ); }
        }
        $session->set( 'chosen_payment_method', 'enf_' . $method );
        $cart->calculate_totals();
        $session->set_customer_session_cookie( true );
    } catch ( Throwable $error ) {
        $session->set( 'enf_checkout_context', $old_context );
        $session->set( 'chosen_payment_method', $old_method );
        $cart->set_cart_contents( $old_items );
        $cart->set_applied_coupons( $old_coupons );
        $cart->calculate_totals();
        wp_die( 'Your existing cart was kept. Please return to the store and review availability.', 'Checkout', array( 'response' => 409 ) );
    }
    nocache_headers();
    wp_safe_redirect( enf_checkout_url(), 303 );
    exit;
}
add_action( 'admin_post_nopriv_enf_checkout_cart', 'enf_checkout_handoff' );
add_action( 'admin_post_enf_checkout_cart', 'enf_checkout_handoff' );

// Only the explicit new-storefront session receives these rates and payment choices.
add_filter( 'woocommerce_package_rates', function ( $rates, $package ) {
    if ( ! enf_checkout_session() ) { return $rates; }
    if ( 'LB' !== ( $package['destination']['country'] ?? '' ) ) { return array(); }
    $fee = enf_delivery_fee_for( $package['contents'] ?? array() );
    $label = ENF_LARGE_DELIVERY_FEE === $fee ? 'Delivery in Lebanon (large item)' : 'Delivery in Lebanon';
    return array( 'enf_delivery' => new WC_Shipping_Rate( 'enf_delivery', $label, $fee, array(), 'enf_delivery' ) );
}, 100, 2 );
add_action( 'woocommerce_after_checkout_validation', function ( $data, $errors ) {
    if ( ! enf_checkout_session() ) { return; }
    $country = ! empty( $data['ship_to_different_address'] ) ? ( $data['shipping_country'] ?? '' ) : ( $data['billing_country'] ?? '' );
    if ( 'LB' !== $country ) { $errors->add( 'enf_country', 'Delivery is available in Lebanon only.' ); }
}, 10, 2 );
add_filter( 'woocommerce_checkout_fields', function ( $fields ) {
    if ( enf_checkout_session() ) {
        $fields['billing']['billing_phone']['required'] = true;
        // Email is required: the order confirmation (and the store's cashback voucher) are sent there.
        $fields['billing']['billing_email']['required'] = true;
        $fields['billing']['billing_email']['label'] = 'Email address';
        // Lebanon has no postcodes in everyday use.
        unset( $fields['billing']['billing_postcode'], $fields['shipping']['shipping_postcode'] );
    }
    return $fields;
} );
// Same for WooCommerce's address rules (the JavaScript form and server validation follow these).
add_filter( 'woocommerce_get_country_locale', function ( $locale ) {
    if ( enf_checkout_session() ) {
        $locale['LB']['postcode'] = array( 'required' => false, 'hidden' => true );
    }
    return $locale;
} );
// Show prices like the website ("75 $", "7.50 $") instead of "75.0 $". Display only: the store's
// saved decimal setting, stored prices and other connected software are not changed.
add_filter( 'wc_price_args', function ( $args ) {
    if ( enf_checkout_session() || enf_checkout_receipt_order() ) { $args['decimals'] = 2; }
    return $args;
} );
add_filter( 'woocommerce_price_trim_zeros', function ( $trim ) {
    return ( enf_checkout_session() || enf_checkout_receipt_order() ) ? true : $trim;
} );
// 20% off everything, no code: each toy is charged at its reduced price, exactly as the website shows it
// (10 $ -> 8 $), so the checkout, thank-you page and emails list what the customer really pays.
// The usual price is kept (crossed out) next to it, with a "You saved" line under the total.
function &enf_base_prices() { static $prices = array(); return $prices; }
function enf_usual_price( $item ) {
    $id = ! empty( $item['variation_id'] ) ? $item['variation_id'] : ( $item['product_id'] ?? 0 );
    $fresh = $id ? wc_get_product( $id ) : null;
    return $fresh ? (float) $fresh->get_price() : 0.0;
}
add_action( 'woocommerce_before_calculate_totals', function ( $cart ) {
    if ( ! enf_checkout_session() || ! enf_discount_active() || ! is_object( $cart ) ) { return; }
    $prices = &enf_base_prices();
    foreach ( $cart->get_cart() as $key => $item ) {
        if ( empty( $item['data'] ) || ! is_object( $item['data'] ) ) { continue; }
        $usual = enf_usual_price( $item );   // always from the product itself, so repeated calculations never stack
        if ( $usual <= 0 ) { continue; }
        $prices[ $key ] = $usual;
        $item['data']->set_price( round( $usual - enf_discount_for( $usual ), 2 ) );
    }
}, 20 );
function enf_cart_saved() {
    if ( ! function_exists( 'WC' ) || ! WC()->cart ) { return 0.0; }
    $prices = &enf_base_prices(); $saved = 0.0;
    foreach ( WC()->cart->get_cart() as $key => $item ) {
        if ( isset( $prices[ $key ] ) && ! empty( $item['data'] ) ) { $saved += ( $prices[ $key ] - (float) $item['data']->get_price() ) * (int) $item['quantity']; }
    }
    return max( 0, round( $saved, 2 ) );
}
add_filter( 'woocommerce_cart_item_subtotal', function ( $subtotal, $item, $key ) {
    $prices = &enf_base_prices();
    if ( ! enf_checkout_session() || ! isset( $prices[ $key ] ) || empty( $item['data'] ) ) { return $subtotal; }
    $usual = $prices[ $key ] * (int) $item['quantity'];
    return $usual > (float) $item['data']->get_price() * (int) $item['quantity'] + 0.001 ? '<del>' . wc_price( $usual ) . '</del> ' . $subtotal : $subtotal;
}, 10, 3 );
add_action( 'woocommerce_review_order_after_order_total', function () {
    $saved = enf_checkout_session() ? enf_cart_saved() : 0;
    if ( $saved > 0 ) { echo '<tr class="enf-saved"><th>You save</th><td>' . wp_kses_post( wc_price( $saved ) ) . '</td></tr>'; }
} );
// keep the usual price on the order line (hidden meta), for the crossed-out price on the receipt and emails
add_action( 'woocommerce_checkout_create_order_line_item', function ( $line, $key, $values, $order ) {
    $prices = &enf_base_prices();
    if ( enf_checkout_session() && isset( $prices[ $key ] ) ) { $line->add_meta_data( '_enf_usual_price', $prices[ $key ], true ); }
}, 10, 4 );
function enf_order_saved( $order ) {
    $saved = 0.0;
    foreach ( $order->get_items() as $line ) {
        $usual = (float) $line->get_meta( '_enf_usual_price' );
        if ( $usual > 0 ) { $saved += $usual * (int) $line->get_quantity() - (float) $line->get_subtotal(); }
    }
    return max( 0, round( $saved, 2 ) );
}
add_filter( 'woocommerce_order_formatted_line_subtotal', function ( $subtotal, $line, $order ) {
    $usual = is_object( $line ) ? (float) $line->get_meta( '_enf_usual_price' ) * (int) $line->get_quantity() : 0;
    return $usual > (float) $line->get_subtotal() + 0.001 ? '<del>' . wc_price( $usual, array( 'currency' => $order->get_currency() ) ) . '</del> ' . $subtotal : $subtotal;
}, 10, 3 );
add_filter( 'woocommerce_get_order_item_totals', function ( $rows, $order ) {
    if ( ! is_object( $order ) || 'yes' !== $order->get_meta( '_enf_storefront_checkout' ) ) { return $rows; }
    $saved = enf_order_saved( $order );
    if ( $saved <= 0 ) { return $rows; }
    $out = array();
    foreach ( $rows as $id => $row ) {
        $out[ $id ] = $row;
        if ( 'order_total' === $id ) { $out['enf_saved'] = array( 'label' => 'You saved:', 'value' => wc_price( $saved, array( 'currency' => $order->get_currency() ) ) . ' (' . ENF_DISCOUNT_PCT . '% off everything)' ); }
    }
    return $out;
}, 20, 2 );
// The old TILLO20 code is retired on the new storefront (the 20% is automatic), so it can't be added on top.
add_filter( 'woocommerce_coupon_is_valid', function ( $valid, $coupon ) {
    if ( enf_checkout_session() && is_object( $coupon ) && 'tillo20' === strtolower( (string) $coupon->get_code() ) ) {
        throw new Exception( enf_discount_active() ? 'No code needed: 20% off everything is already included.' : 'This code has expired.' );
    }
    return $valid;
}, 10, 2 );
// This field belongs only to the new storefront checkout; the existing store form is unchanged.
add_action( 'woocommerce_after_order_notes', function ( $checkout ) {
    if ( ! enf_checkout_session() ) { return; }
    woocommerce_form_field( 'enf_gift_wrap', array( 'type' => 'checkbox', 'label' => 'Wrap my gifts', 'required' => false ), $checkout->get_value( 'enf_gift_wrap' ) );
} );
add_action( 'woocommerce_checkout_create_order', function ( $order ) {
    if ( enf_checkout_session() ) {
        $order->update_meta_data( '_enf_storefront_checkout', 'yes' );
        if ( isset( $_POST['enf_gift_wrap'] ) && '1' === $_POST['enf_gift_wrap'] ) {
            $order->update_meta_data( 'Gift wrapping', 'Requested' );
            $order->set_customer_note( trim( $order->get_customer_note() . "\nGift wrapping requested." ) );
        }
        $order->update_meta_data( '_enf_storefront_origin', WC()->session->get( 'enf_checkout_context' )['origin'] );
        $order->update_meta_data( '_enf_storefront_cart_token', WC()->session->get( 'enf_checkout_context' )['cart_token'] ?? '' );
        if ( enf_discount_active() ) {
            $cashback = enf_cashback_for_order( $order );
            if ( $cashback > 0 ) {
                $order->update_meta_data( '_enf_cashback', $cashback );
                $order->update_meta_data( 'Cashback voucher', wp_strip_all_tags( wc_price( $cashback ) ) . ' to spend in store, valid until ' . ENF_CASHBACK_VALID_UNTIL );
            }
        }
    }
} );
// staff note: the voucher only counts once this order is paid (cash on delivery collected / Whish confirmed)
add_action( 'woocommerce_checkout_order_created', function ( $order ) {
    $amount = (float) $order->get_meta( '_enf_cashback' );
    if ( $amount > 0 ) {
        $order->add_order_note( 'Cashback voucher for the customer: ' . wp_strip_all_tags( wc_price( $amount ) ) . ' (' . ENF_CASHBACK_PCT . '% of the toys), to spend in store until ' . ENF_CASHBACK_VALID_UNTIL . '. Honour it only once this order is paid, and not if it is cancelled.' );
    }
} );
add_filter( 'woocommerce_get_checkout_url', function ( $url ) { return enf_checkout_session() ? enf_checkout_url() : $url; } );
add_filter( 'woocommerce_get_checkout_order_received_url', function ( $url, $order ) {
    if ( 'yes' !== $order->get_meta( '_enf_storefront_checkout' ) ) { return $url; }
    return add_query_arg( array( 'enf_checkout' => '1', 'order-received' => $order->get_id(), 'key' => $order->get_order_key() ), home_url( '/' ) );
}, 10, 2 );
add_filter( 'woocommerce_is_checkout', function ( $checkout ) { return $checkout || ( enf_checkout_is_page() && ( enf_checkout_session() || enf_checkout_receipt_order() ) ); } );

add_action( 'plugins_loaded', function () {
    if ( ! class_exists( 'WC_Payment_Gateway' ) ) { return; }
    abstract class Enf_Offline_Gateway extends WC_Payment_Gateway {
        public function is_available() { return enf_checkout_session(); }
        public function process_payment( $order_id ) {
            $order = wc_get_order( $order_id );
            if ( ! enf_checkout_session() || ! $order || 'yes' !== $order->get_meta( '_enf_storefront_checkout' ) || $order->get_payment_method() !== $this->id ) {
                throw new Exception( 'Please restart checkout from the store.' );
            }
            if ( $order->has_status( array( 'pending', 'failed' ) ) ) {
                $order->update_status( 'enf_whish' === $this->id ? 'on-hold' : 'processing', 'enf_whish' === $this->id ? 'Awaiting manual Whish payment verification. A screenshot alone is not proof of cleared payment.' : 'Cash is due on delivery; no online payment was collected.' );
                wc_reduce_stock_levels( $order_id );
            } elseif ( ! $order->has_status( array( 'on-hold', 'processing', 'completed' ) ) ) {
                throw new Exception( 'This order cannot be submitted again. Please contact the store.' );
            }
            WC()->cart->empty_cart();
            return array( 'result' => 'success', 'redirect' => $this->get_return_url( $order ) );
        }
    }
    class Enf_COD_Gateway extends Enf_Offline_Gateway {
        public function __construct() {
            $this->id = 'enf_cod'; $this->enabled = enf_checkout_enabled() ? 'yes' : 'no'; $this->has_fields = false;
            $this->title = 'Cash on delivery'; $this->method_title = 'Enfantillage cash on delivery';
            $this->description = 'Pay the courier in cash when your toys arrive. No card needed.'; $this->supports = array( 'products' );
            $this->order_button_text = 'Place my order';
        }
    }
    class Enf_Whish_Gateway extends Enf_Offline_Gateway {
        public function __construct() {
            $this->id = 'enf_whish'; $this->enabled = enf_checkout_enabled() ? 'yes' : 'no'; $this->has_fields = false;
            $this->title = 'Whish Money'; $this->method_title = 'Enfantillage manual Whish';
            $this->description = 'After ordering, send the total to +961 78 881 100 from your Whish app, then send the screenshot and your order number to the same number. We confirm the payment and prepare your delivery.';
            $this->order_button_text = 'Place my order';
            $this->supports = array( 'products' );
        }
    }
    add_filter( 'woocommerce_payment_gateways', function ( $gateways ) { $gateways[] = 'Enf_COD_Gateway'; $gateways[] = 'Enf_Whish_Gateway'; return $gateways; } );
    add_filter( 'woocommerce_available_payment_gateways', function ( $gateways ) {
        return enf_checkout_session() ? array_intersect_key( $gateways, array_flip( array( 'enf_cod', 'enf_whish' ) ) ) : $gateways;
    }, 100 );
}, 30 );
function enf_whish_instructions( $order ) {
    if ( ! $order || 'enf_whish' !== $order->get_payment_method() || $order->is_paid() ) { return; }
    echo '<p><strong>Whish payment awaiting confirmation.</strong> Send the order total to <strong>+961 78 881 100</strong>. Send the screenshot and order number to that same number. The store will verify the payment before confirming it.</p>';
}
add_action( 'woocommerce_thankyou_enf_whish', function ( $order_id ) { enf_whish_instructions( wc_get_order( $order_id ) ); } );
add_action( 'woocommerce_thankyou', function ( $order_id ) {
    $order = wc_get_order( $order_id );
    if ( $order && 'yes' === $order->get_meta( '_enf_storefront_checkout' ) ) { echo enf_cashback_html( $order ); }
}, 5 );
add_action( 'woocommerce_email_before_order_table', function ( $order, $sent_to_admin, $plain_text ) {
    if ( $sent_to_admin || ! is_object( $order ) || 'yes' !== $order->get_meta( '_enf_storefront_checkout' ) || $order->has_status( array( 'cancelled', 'failed', 'refunded' ) ) ) { return; }
    echo $plain_text ? enf_cashback_text( $order ) : enf_cashback_html( $order );
}, 5, 3 );
add_action( 'woocommerce_email_before_order_table', function ( $order, $sent_to_admin, $plain_text ) {
    if ( $sent_to_admin || 'enf_whish' !== $order->get_payment_method() || $order->is_paid() ) { return; }
    if ( $plain_text ) { echo "Whish: send the order total to +961 78 881 100, then send the screenshot and order number to the same number. Await manual confirmation.\n"; }
    else { enf_whish_instructions( $order ); }
}, 10, 3 );

// A dedicated classic checkout avoids modifying the client's existing Checkout block/page.
add_action( 'template_redirect', function () {
    if ( ! enf_checkout_is_page() ) { return; }
    $receipt_order = enf_checkout_receipt_order();
    if ( ! enf_checkout_session() && ! $receipt_order ) { wp_die( 'Please start checkout from the Enfantillage storefront.', 'Checkout', array( 'response' => 403 ) ); }
    status_header( 200 ); nocache_headers();
    header( 'X-Robots-Tag: noindex, nofollow' );
    wp_enqueue_script( 'wc-checkout' );
    $context = WC()->session ? WC()->session->get( 'enf_checkout_context' ) : null;
    if ( $receipt_order || ! is_array( $context ) || ! in_array( $context['origin'] ?? '', enf_checkout_origins(), true ) ) {
        $origin = $receipt_order ? $receipt_order->get_meta( '_enf_storefront_origin' ) : '';
        $context = array( 'origin' => in_array( $origin, enf_checkout_origins(), true ) ? $origin : 'https://enfantillagestore.com' );
    }
    $return_url = '';
    if ( $receipt_order ) {
        $proof = array( 'orderId' => $receipt_order->get_id(), 'orderKey' => $receipt_order->get_order_key(), 'cartToken' => (string) $receipt_order->get_meta( '_enf_storefront_cart_token' ) );
        if ( enf_checkout_receipt_data( $proof ) ) { $return_url = $context['origin'] . '/order-confirmed.html#' . http_build_query( $proof, '', '&', PHP_QUERY_RFC3986 ); }
    }
    enf_checkout_page_html( $context, $return_url, $receipt_order );
    exit;
}, 5 );

// The existing apex stays on this server: no WordPress URL or Wizard changes.
// Run after dedicated checkout (priority 5), before canonical redirects (10).
add_action( 'template_redirect', function () {
    if ( '1' !== get_option( 'enf_storefront_enabled', '0' ) || is_admin() || is_preview() || is_feed() || is_404() ||
        ( function_exists( 'is_customize_preview' ) && is_customize_preview() ) ) { return; }
    $type = ''; $id = 0; $search = '';
    if ( is_front_page() ) { $type = 'home'; }
    elseif ( function_exists( 'is_product' ) && is_product() ) { $type = 'product'; $id = get_queried_object_id(); }
    elseif ( function_exists( 'is_product_category' ) && is_product_category() ) { $type = 'category'; $id = get_queried_object_id(); }
    elseif ( function_exists( 'is_shop' ) && is_shop() ) { $type = 'shop'; }
    elseif ( is_search() && 'product' === get_query_var( 'post_type' ) ) { $type = 'search'; $search = get_search_query( false ); }
    $target = enf_storefront_redirect_target( array(
        'method' => $_SERVER['REQUEST_METHOD'] ?? '', 'host' => $_SERVER['HTTP_HOST'] ?? '',
        'query' => wp_unslash( $_GET ), 'type' => $type, 'id' => $id, 'search' => $search,
    ) );
    if ( ! $target ) { return; }
    nocache_headers();
    // Target helper only constructs the fixed, allowlisted www origin.
    wp_redirect( $target, 302, 'Enfantillage storefront' );
    exit;
}, 9 );
