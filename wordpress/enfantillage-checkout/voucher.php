<?php
/**
 * Cashback voucher QR code: each voucher has its own code, shown as a QR code in the customer's emails.
 * Staff scan it with a phone signed in to WordPress (shop manager or administrator) and tap "Accept":
 * it then works only once, and the WooCommerce order gets a note saying when and by whom it was used.
 * Opening the link never uses the voucher by itself (only the staff button does), so email link checkers
 * and customers opening their own QR code change nothing.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

// The QR picture is drawn by the new website (api/voucher-qr.js); it only ever encodes ENF_VOUCHER_URL + code.
const ENF_VOUCHER_QR = 'https://www.enfantillagestore.com/api/voucher-qr?code=';
const ENF_VOUCHER_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I/L: easy to read and type

function enf_voucher_new_secret() {
    $secret = '';
    for ( $i = 0; $i < 10; $i++ ) { $secret .= ENF_VOUCHER_LETTERS[ random_int( 0, strlen( ENF_VOUCHER_LETTERS ) - 1 ) ]; }
    return $secret;
}
function enf_voucher_url( $code ) { return add_query_arg( 'enfv', rawurlencode( $code ), home_url( '/' ) ); }

// "56396-K7XM3PQ9RT": the order ID, then a random secret saved on the order.
// Orders from before the QR code get their secret the first time the voucher is shown.
function enf_voucher_code( $order ) {
    if ( ! is_object( $order ) || (float) $order->get_meta( '_enf_cashback' ) <= 0 ) { return ''; }
    $secret = (string) $order->get_meta( '_enf_voucher_secret' );
    if ( ! preg_match( '/^[A-HJ-NP-Z2-9]{10}$/', $secret ) ) {
        if ( ! $order->get_id() ) { return ''; }
        $secret = enf_voucher_new_secret();
        $order->update_meta_data( '_enf_voucher_secret', $secret );
        $order->save_meta_data();
    }
    return $order->get_id() . '-' . $secret;
}

// Finds the order for a scanned or typed code; null when the code is wrong.
function enf_voucher_order( $raw ) {
    $code = strtoupper( preg_replace( '/\s+/', '', (string) $raw ) );
    if ( ! preg_match( '/^([1-9]\d{0,9})-?([A-HJ-NP-Z2-9-]{10,14})$/', $code, $m ) ) { return null; }
    $secret = str_replace( '-', '', $m[2] );
    if ( 10 !== strlen( $secret ) ) { return null; }
    $order = wc_get_order( (int) $m[1] );
    if ( ! $order || is_a( $order, 'WC_Order_Refund' ) || (float) $order->get_meta( '_enf_cashback' ) <= 0 ) { return null; }
    $saved = (string) $order->get_meta( '_enf_voucher_secret' );
    return '' !== $saved && hash_equals( $saved, $secret ) ? $order : null;
}

function enf_voucher_used( $order ) {
    $at = (int) $order->get_meta( '_enf_voucher_used' );
    if ( ! $at ) { $at = (int) get_option( 'enf_voucher_used_' . $order->get_id(), 0 ); }
    return $at ? array( 'at' => $at, 'by' => (string) $order->get_meta( '_enf_voucher_used_by' ) ) : null;
}

// ready (paid), unpaid (accept only if staff know it was paid), used, cancelled, expired
function enf_voucher_state( $order ) {
    if ( enf_voucher_used( $order ) ) { return 'used'; }
    if ( $order->has_status( array( 'cancelled', 'refunded', 'failed', 'trash' ) ) ) { return 'cancelled'; }
    if ( ! enf_discount_active() ) { return 'expired'; }
    return $order->has_status( 'completed' ) ? 'ready' : 'unpaid';
}

function enf_voucher_money( $amount ) { return html_entity_decode( wp_strip_all_tags( wc_price( $amount ) ), ENT_QUOTES, 'UTF-8' ); }

// QR code + code, inside the voucher box of the emails and the thank-you page
function enf_voucher_qr_html( $order ) {
    $code = enf_voucher_code( $order );
    if ( ! $code ) { return ''; }
    $used = enf_voucher_used( $order );
    if ( $used ) {
        return '<p style="margin:10px 0 0;font-size:14px;font-weight:bold;color:#e8222b">This voucher was used in store on ' . esc_html( wp_date( 'j F Y', $used['at'] ) ) . '.</p>';
    }
    return '<p style="margin:14px 0 0;text-align:center"><img src="' . esc_url( ENF_VOUCHER_QR . rawurlencode( $code ) ) . '" width="180" height="180" alt="Voucher QR code" style="display:inline-block;width:180px;height:180px;border:0;border-radius:10px;background:#ffffff"></p>'
        . '<p style="margin:6px 0 0;text-align:center;font-size:13px;color:#1e2459">Voucher code: <b style="letter-spacing:1px">' . esc_html( $code ) . '</b><br>We scan it at the till. It can be used once.</p>';
}
function enf_voucher_qr_text( $order ) {
    $code = enf_voucher_code( $order );
    if ( ! $code || enf_voucher_used( $order ) ) { return ''; }
    return 'Voucher code: ' . $code . ' (it can be used once). Your QR code: ' . enf_voucher_url( $code ) . "\n\n";
}

// ---- the page the QR code opens: https://enfantillagestore.com/?enfv=CODE ----
function enf_voucher_staff() { return is_user_logged_in() && ( current_user_can( 'edit_shop_orders' ) || current_user_can( 'manage_woocommerce' ) ); }

function enf_voucher_page( $title, $html, $status = 200 ) {
    status_header( $status );
    nocache_headers();
    header( 'X-Robots-Tag: noindex, nofollow' );
    header( 'Referrer-Policy: no-referrer' );
    ?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#25318c">
<title><?php echo esc_html( $title ); ?> — Enfantillage</title>
<link rel="icon" href="<?php echo esc_url( ENF_STOREFRONT_ASSETS . 'icons/favicon-48.png' ); ?>">
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f6ff;color:#1e2459;font:600 16px/1.45 Nunito,"Segoe UI",Roboto,Arial,sans-serif}
.v-top{background:#25318c;padding:12px 16px;text-align:center}.v-top img{height:44px;width:auto}
.v-main{max-width:460px;margin:0 auto;padding:20px 16px 40px}
.v-card{background:#fff;border-radius:20px;padding:20px;box-shadow:0 6px 24px rgba(30,36,89,.1);margin-bottom:16px}
.v-kicker{margin:0;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#e8222b}
.v-amount{margin:2px 0 4px;font-size:44px;font-weight:900;line-height:1.1}
.v-state{border-radius:16px;padding:16px 18px;margin:0 0 16px;font-size:17px}.v-state b{display:block;font-size:24px;line-height:1.2;margin-bottom:4px}
.is-ok{background:#e3f7e6;color:#17692a}.is-warn{background:#fff3cc;color:#6b4a00}.is-bad{background:#ffe1e2;color:#a3141b}
dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 14px;margin:12px 0 0;font-size:15px}dt{color:#5a618f}dd{margin:0;font-weight:800;overflow-wrap:anywhere}
button,.v-btn{display:block;width:100%;border:0;border-radius:999px;background:#3db54a;color:#fff;font-family:inherit;font-weight:900;font-size:19px;line-height:1.2;padding:16px 20px;cursor:pointer;text-align:center;text-decoration:none}
button.is-caution{background:#c98a00}
.v-small{font-size:14px;color:#5a618f;text-align:center}.v-small a{color:#25318c}
form.v-find{display:flex;gap:8px}form.v-find input{flex:1;min-width:0;font-family:inherit;font-weight:800;font-size:17px;padding:12px 14px;border:2px solid #c9cdf0;border-radius:12px;text-transform:uppercase}
form.v-find button{width:auto;padding:12px 18px;font-size:16px;background:#25318c}
</style></head><body>
<header class="v-top"><img src="<?php echo esc_url( ENF_STOREFRONT_ASSETS . 'logo.png' ); ?>" alt="Enfantillage" width="77" height="44"></header>
<main class="v-main"><?php echo $html; // built from escaped parts below ?></main>
</body></html><?php
    exit;
}

function enf_voucher_find_form( $value = '' ) {
    return '<div class="v-card"><p class="v-kicker">Type a voucher code</p><form class="v-find" method="get" action="' . esc_url( home_url( '/' ) ) . '">'
        . '<input name="enfv" value="' . esc_attr( $value ) . '" placeholder="56396-K7XM3PQ9RT" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Voucher code">'
        . '<button type="submit">Check</button></form></div>';
}

function enf_voucher_details( $order, $amount ) {
    $name = trim( $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() );
    $created = $order->get_date_created();
    return '<dl>'
        . '<dt>Order</dt><dd><a href="' . esc_url( $order->get_edit_order_url() ) . '">#' . esc_html( $order->get_order_number() ) . '</a> · ' . esc_html( wc_get_order_status_name( $order->get_status() ) ) . '</dd>'
        . ( $name ? '<dt>Customer</dt><dd>' . esc_html( $name ) . '</dd>' : '' )
        . ( $order->get_billing_phone() ? '<dt>Phone</dt><dd>' . esc_html( $order->get_billing_phone() ) . '</dd>' : '' )
        . ( $created ? '<dt>Ordered</dt><dd>' . esc_html( wp_date( 'j M Y', $created->getTimestamp() ) ) . '</dd>' : '' )
        . '<dt>Valid until</dt><dd>' . esc_html( ENF_CASHBACK_VALID_UNTIL ) . '</dd>'
        . '</dl>';
}

function enf_voucher_accept( $order ) {
    global $wpdb;
    // the first acceptance wins, even if two phones tap at the same moment (unique option name)
    $won = $wpdb->query( $wpdb->prepare( "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'no')", 'enf_voucher_used_' . $order->get_id(), (string) time() ) );
    if ( 1 !== (int) $won ) { return false; }
    wp_cache_delete( 'notoptions', 'options' );
    $who = wp_get_current_user()->display_name;
    $amount = (float) $order->get_meta( '_enf_cashback' );
    $order->update_meta_data( '_enf_voucher_used', time() );
    $order->update_meta_data( '_enf_voucher_used_by', $who );
    $order->update_meta_data( 'Cashback voucher', enf_voucher_money( $amount ) . ' to spend in store: USED on ' . wp_date( 'j M Y, H:i' ) . ' (accepted by ' . $who . ')' );
    $order->add_order_note( 'Cashback voucher used in store: ' . enf_voucher_money( $amount ) . ' taken off a purchase on ' . wp_date( 'j M Y, H:i' ) . ', accepted by ' . $who . ' (QR code scanned). It cannot be used again.', 0, true );
    $order->save();
    return true;
}

add_action( 'template_redirect', function () {
    if ( ! isset( $_GET['enfv'] ) || ! function_exists( 'wc_get_order' ) ) { return; }
    if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
    do_action( 'litespeed_control_set_nocache', 'Enfantillage voucher' );
    $raw   = sanitize_text_field( wp_unslash( $_GET['enfv'] ) );
    $staff = enf_voucher_staff();
    $login = '<p class="v-small">Enfantillage staff: <a href="' . esc_url( wp_login_url( enf_voucher_url( $raw ) ) ) . '">sign in</a> to accept this voucher.</p>';

    if ( '' === $raw ) {
        if ( ! $staff ) { enf_voucher_page( 'Voucher', '<div class="v-card"><p class="v-kicker">Enfantillage voucher</p><p>Scan the QR code in your voucher email.</p></div>' . $login ); }
        enf_voucher_page( 'Check a voucher', enf_voucher_find_form() );
    }
    $order = enf_voucher_order( $raw );
    if ( ! $order ) {
        $html = '<div class="v-state is-bad"><b>Voucher not found</b>Check the code and try again.</div>';
        enf_voucher_page( 'Voucher not found', $staff ? $html . enf_voucher_find_form( $raw ) : $html . $login, 404 );
    }
    $code   = enf_voucher_code( $order );
    $amount = (float) $order->get_meta( '_enf_cashback' );
    $money  = enf_voucher_money( $amount );

    // staff tapped "Accept"
    if ( 'POST' === ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) {
        if ( ! $staff || ! isset( $_POST['_enfnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_enfnonce'] ) ), 'enf_voucher_' . $order->get_id() ) ) {
            enf_voucher_page( 'Voucher', '<div class="v-state is-bad"><b>Not accepted</b>Please scan the QR code again.</div>' . ( $staff ? '' : $login ), 403 );
        }
        if ( in_array( enf_voucher_state( $order ), array( 'ready', 'unpaid' ), true ) ) { enf_voucher_accept( $order ); }
        wp_safe_redirect( add_query_arg( array( 'enfv' => rawurlencode( $code ), 'done' => '1' ), home_url( '/' ) ) );
        exit;
    }

    $state = enf_voucher_state( $order );
    $used  = enf_voucher_used( $order );
    $head  = '<div class="v-card"><p class="v-kicker">Cashback voucher</p><p class="v-amount">' . esc_html( $money ) . '</p>';

    if ( ! $staff ) {
        $messages = array(
            'ready'     => array( 'is-ok', 'Ready to use', 'Show this QR code at Enfantillage, Mazraat Yachouh. It can be used once, until ' . ENF_CASHBACK_VALID_UNTIL . '.' ),
            'unpaid'    => array( 'is-ok', 'Ready to use', 'Show this QR code at Enfantillage, Mazraat Yachouh. It can be used once, until ' . ENF_CASHBACK_VALID_UNTIL . ', once your order is paid.' ),
            'used'      => array( 'is-bad', 'Already used', $used ? 'This voucher was used on ' . wp_date( 'j F Y', $used['at'] ) . '.' : 'This voucher was used.' ),
            'cancelled' => array( 'is-bad', 'Not valid', 'The order for this voucher was cancelled.' ),
            'expired'   => array( 'is-bad', 'Expired', 'This voucher could be used until ' . ENF_CASHBACK_VALID_UNTIL . '.' ),
        );
        [ $tone, $title, $text ] = $messages[ $state ];
        enf_voucher_page( 'Your voucher', $head . '</div><div class="v-state ' . $tone . '"><b>' . esc_html( $title ) . '</b>' . esc_html( $text ) . '</div>' . $login );
    }

    $details = enf_voucher_details( $order, $amount ) . '</div>';
    if ( 'used' === $state ) {
        $fresh = $used && ! empty( $_GET['done'] ) && time() - $used['at'] < 900;
        $when  = $used ? wp_date( 'j M Y, H:i', $used['at'] ) . ( $used['by'] ? ' by ' . $used['by'] : '' ) : '';
        $box   = $fresh
            ? '<div class="v-state is-ok"><b>✓ Accepted</b>Take ' . esc_html( $money ) . ' off this purchase. The voucher is now used and saved on order #' . esc_html( $order->get_order_number() ) . '.</div>'
            : '<div class="v-state is-bad"><b>✕ Already used</b>Used on ' . esc_html( $when ) . '. Do not accept it again.</div>';
        enf_voucher_page( $fresh ? 'Voucher accepted' : 'Voucher already used', $box . $head . $details . enf_voucher_find_form() );
    }
    if ( 'cancelled' === $state || 'expired' === $state ) {
        $box = 'expired' === $state
            ? '<div class="v-state is-bad"><b>✕ Expired</b>This voucher was valid until ' . esc_html( ENF_CASHBACK_VALID_UNTIL ) . '.</div>'
            : '<div class="v-state is-bad"><b>✕ Not valid</b>Order #' . esc_html( $order->get_order_number() ) . ' is ' . esc_html( strtolower( wc_get_order_status_name( $order->get_status() ) ) ) . '.</div>';
        enf_voucher_page( 'Voucher not valid', $box . $head . $details . enf_voucher_find_form() );
    }
    $box = 'ready' === $state
        ? '<div class="v-state is-ok"><b>Ready to use</b>Order #' . esc_html( $order->get_order_number() ) . ' is completed.</div>'
        : '<div class="v-state is-warn"><b>Check the order first</b>Order #' . esc_html( $order->get_order_number() ) . ' is still &ldquo;' . esc_html( wc_get_order_status_name( $order->get_status() ) ) . '&rdquo;. Accept the voucher only if this order was paid and delivered.</div>';
    $form = '<form method="post" action="' . esc_url( enf_voucher_url( $code ) ) . '">' . '<input type="hidden" name="_enfnonce" value="' . esc_attr( wp_create_nonce( 'enf_voucher_' . $order->get_id() ) ) . '">'
        . '<button type="submit" class="' . ( 'ready' === $state ? '' : 'is-caution' ) . '">Accept: take ' . esc_html( $money ) . ' off</button></form>'
        . '<p class="v-small">After you tap, the voucher cannot be used again.</p>';
    enf_voucher_page( 'Accept voucher', $box . $head . $details . $form );
}, 0 );
