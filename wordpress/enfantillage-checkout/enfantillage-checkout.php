<?php
/**
 * Plugin Name: Enfantillage Checkout Handoff
 * Description: An opt-in cart handoff to WooCommerce checkout, free Lebanon delivery, COD and manually confirmed Whish payments. Disabled until explicitly enabled by an administrator.
 * Version: 0.1.0
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }
require_once __DIR__ . '/cart-validation.php';
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
} );
add_action( 'admin_menu', function () {
    add_submenu_page( 'woocommerce', 'Enfantillage checkout', 'Enfantillage checkout', 'manage_options', 'enf-checkout', function () {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        echo '<div class="wrap"><h1>Enfantillage checkout</h1><p>Cart handoff for the new storefront. Free delivery in Lebanon. Cash on delivery or Whish to +961 78 881 100; customers send a payment screenshot to the same number. Whish requires manual confirmation.</p><p>Enable only after backup and staging tests. Existing store settings and Wizard are not modified.</p><form method="post" action="options.php">';
        settings_fields( 'enf_checkout' );
        echo '<input type="hidden" name="enf_checkout_enabled" value="0"><label><input type="checkbox" name="enf_checkout_enabled" value="1" ' . checked( get_option( 'enf_checkout_enabled', '0' ), '1', false ) . '> Enable new-storefront checkout handoff</label>';
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
                'version' => 1, 'enabled' => enf_checkout_enabled(),
                'currency' => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : null, 'deliveryFee' => 0,
                'methods' => array( 'cod', 'whish' ), 'whishNumber' => '+961 78 881 100',
            ) );
            $response->header( 'Cache-Control', 'no-store' );
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
    if ( strlen( $raw ) > 16384 || ! in_array( $method, array( 'cod', 'whish' ), true ) ) {
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
        $session->set( 'enf_checkout_context', array( 'origin' => $origin, 'expires' => time() + 2 * HOUR_IN_SECONDS ) );
        foreach ( $items as $item ) {
            if ( ! $cart->add_to_cart( $item['id'], $item['quantity'] ) ) { throw new RuntimeException( 'Cart validation failed.' ); }
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
    return array( 'enf_free_delivery' => new WC_Shipping_Rate( 'enf_free_delivery', 'Free delivery', 0, array(), 'enf_free_delivery' ) );
}, 100, 2 );
add_action( 'woocommerce_after_checkout_validation', function ( $data, $errors ) {
    if ( ! enf_checkout_session() ) { return; }
    $country = ! empty( $data['ship_to_different_address'] ) ? ( $data['shipping_country'] ?? '' ) : ( $data['billing_country'] ?? '' );
    if ( 'LB' !== $country ) { $errors->add( 'enf_country', 'Delivery is available in Lebanon only.' ); }
}, 10, 2 );
add_filter( 'woocommerce_checkout_fields', function ( $fields ) {
    if ( enf_checkout_session() ) {
        $fields['billing']['billing_phone']['required'] = true;
        $fields['billing']['billing_email']['required'] = false;
    }
    return $fields;
} );
add_action( 'woocommerce_checkout_create_order', function ( $order ) {
    if ( enf_checkout_session() ) {
        $order->update_meta_data( '_enf_storefront_checkout', 'yes' );
        $order->update_meta_data( '_enf_storefront_origin', WC()->session->get( 'enf_checkout_context' )['origin'] );
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
            $this->description = 'Pay the courier in cash when your order arrives.'; $this->supports = array( 'products' );
        }
    }
    class Enf_Whish_Gateway extends Enf_Offline_Gateway {
        public function __construct() {
            $this->id = 'enf_whish'; $this->enabled = enf_checkout_enabled() ? 'yes' : 'no'; $this->has_fields = false;
            $this->title = 'Whish Money'; $this->method_title = 'Enfantillage manual Whish';
            $this->description = 'After placing your order, send the confirmed total to +961 78 881 100 and send the payment screenshot to the same number. Your payment will be checked manually.';
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
    if ( ! is_array( $context ) || ! in_array( $context['origin'] ?? '', enf_checkout_origins(), true ) ) {
        $origin = $receipt_order ? $receipt_order->get_meta( '_enf_storefront_origin' ) : '';
        $context = array( 'origin' => in_array( $origin, enf_checkout_origins(), true ) ? $origin : 'https://enfantillagestore.com' );
    }
    ?><!doctype html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo( 'charset' ); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Checkout — Enfantillage</title><?php wp_head(); ?><style>body{margin:0;background:#f5f6fb;color:#20254d;font-family:Arial,sans-serif}.enf-checkout{max-width:1080px;margin:auto;padding:24px}.enf-checkout header{margin-bottom:24px}.enf-checkout a{color:#25318c}.enf-checkout input,.enf-checkout select,.enf-checkout textarea{max-width:100%;padding:10px}.enf-checkout button{padding:14px 22px;cursor:pointer}.enf-checkout .woocommerce-error{color:#a51229}</style></head><body class="woocommerce woocommerce-checkout"><main class="enf-checkout"><header><a href="<?php echo esc_url( $context['origin'] . '/shop.html' ); ?>">← Back to Enfantillage</a><h1>Delivery and payment</h1><p>Free delivery in Lebanon. Choose cash on delivery or Whish with manual payment confirmation.</p></header><?php echo do_shortcode( '[woocommerce_checkout]' ); ?></main><?php wp_footer(); ?></body></html><?php
    exit;
}, 5 );
