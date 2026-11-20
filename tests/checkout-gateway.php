<?php
// Isolated gateway contract tests; not a substitute for testing in WooCommerce.
define( 'ABSPATH', __DIR__ ); define( 'HOUR_IN_SECONDS', 3600 );
$hooks = array(); $filters = array(); $enabled = '1'; $stock_reductions = 0;
function add_action( $name, $callback, ...$rest ) { global $hooks; $hooks[ $name ][] = $callback; }
function add_filter( $name, $callback, ...$rest ) { global $filters; $filters[ $name ][] = $callback; }
function wp_unslash( $value ) { return $value; }
class WC_Shipping_Rate { public $cost; function __construct( $id, $label, $cost, ...$rest ) { $this->cost = $cost; } }
function get_option( $name, $default = null ) { global $enabled; return $enabled; }
class WC_Payment_Gateway {
    public $id, $enabled, $has_fields, $title, $method_title, $description, $supports;
    function get_return_url( $order ) { return 'https://example.com/receipt'; }
}
class FakeSession {
    function get( $key ) { return array( 'origin' => 'https://enfantillage-git-codex-woocommerce-connection-chriselhaddad.vercel.app', 'expires' => time() + 60 ); }
}
class FakeCart { public $cleared = 0; function empty_cart() { ++$this->cleared; } }
$wc = (object) array( 'session' => new FakeSession(), 'cart' => new FakeCart() );
function WC() { global $wc; return $wc; }
class TestOrder {
    public $status = 'pending'; public $method = 'enf_whish'; public $source = 'yes';
    function get_meta( $key ) { return $this->source; }
    function get_payment_method() { return $this->method; }
    function get_order_key() { return 'test_order_key'; }
    function has_status( $statuses ) { return in_array( $this->status, (array) $statuses, true ); }
    function update_status( $status, $note ) { $this->status = $status; }
}
$order = new TestOrder();
function wc_get_order( $id ) { global $order; return 1 === $id ? $order : false; }
function wc_reduce_stock_levels( $id ) { global $stock_reductions; ++$stock_reductions; }
require __DIR__ . '/../wordpress/enfantillage-checkout/enfantillage-checkout.php';
foreach ( $hooks['plugins_loaded'] as $callback ) { $callback(); }
function verify( $condition, $message ) { if ( ! $condition ) { throw new Exception( $message ); } }
$whish = new Enf_Whish_Gateway();
verify( $whish->process_payment( 1 )['result'] === 'success', 'Whish checkout failed' );
verify( $order->status === 'on-hold', 'Whish was incorrectly marked paid' );
verify( $stock_reductions === 1, 'Whish stock reduction missing' );
$whish->process_payment( 1 );
verify( $stock_reductions === 1, 'Repeated submission reduced stock again' );
$order->status = 'cancelled'; $rejected = false;
try { $whish->process_payment( 1 ); } catch ( Exception $error ) { $rejected = true; }
verify( $rejected && $stock_reductions === 1, 'Cancelled order was processed again' );
$order->status = 'pending'; $order->method = 'enf_cod';
$cod = new Enf_COD_Gateway(); $cod->process_payment( 1 );
verify( $order->status === 'processing' && $stock_reductions === 2, 'COD flow failed' );
$order->method = 'enf_whish'; $order->status = 'pending'; $order->source = 'no'; $rejected = false;
try { $whish->process_payment( 1 ); } catch ( Exception $error ) { $rejected = true; }
verify( $rejected, 'Unrelated store order was accepted' );
$enabled = '0'; verify( ! $whish->is_available() && ! $cod->is_available(), 'Disabled bridge remains available' );
$enabled = '1'; $order->source = 'yes';
$free = $filters['woocommerce_package_rates'][0]( array(), array( 'destination' => array( 'country' => 'LB' ) ) );
verify( isset( $free['enf_delivery'] ) && $free['enf_delivery']->cost === 5, '5 $ Lebanon delivery missing' );
verify( array() === $filters['woocommerce_package_rates'][0]( array(), array( 'destination' => array( 'country' => 'US' ) ) ), 'International shipping allowed' );
// a large toy (shipping class "Large item") makes delivery 15 $, once, however many large toys there are
class ShipProduct { public $class; function __construct( $c ) { $this->class = $c; } function get_shipping_class() { return $this->class; } }
$mixed = array( 'destination' => array( 'country' => 'LB' ), 'contents' => array(
    array( 'data' => new ShipProduct( '' ) ), array( 'data' => new ShipProduct( 'large-item' ) ), array( 'data' => new ShipProduct( 'large-item' ) ) ) );
$large = $filters['woocommerce_package_rates'][0]( array(), $mixed );
verify( $large['enf_delivery']->cost === 15, 'Large item delivery is not 15 $' );
$small = $filters['woocommerce_package_rates'][0]( array(), array( 'destination' => array( 'country' => 'LB' ), 'contents' => array( array( 'data' => new ShipProduct( '' ) ) ) ) );
verify( $small['enf_delivery']->cost === 5, 'Small items no longer 5 $' );
$_GET = array( 'order-received' => '1', 'key' => 'test_order_key' );
verify( enf_checkout_receipt_order() === $order, 'Receipt key verification failed' );
$_GET['key'] = 'wrong'; verify( false === enf_checkout_receipt_order(), 'Invalid receipt key accepted' );
$enabled = '0'; $existing = array( 'old_rate' => 'preserve' );
verify( $existing === $filters['woocommerce_package_rates'][0]( $existing, array() ), 'Existing shipping rates changed while disabled' );
// automatic 20% (until 25 December): each toy is charged at its reduced price, rounded like the website
$enabled = '1';
class FakeProduct { public $price; function __construct( $p ) { $this->price = $p; } function get_price() { return $this->price; } function set_price( $p ) { $this->price = $p; } }
$catalog = array( 7 => 12.9, 8 => 400 );
function wc_get_product( $id ) { global $catalog; return isset( $catalog[ $id ] ) ? new FakeProduct( $catalog[ $id ] ) : false; }
class PriceCart { public $items; function __construct( $items ) { $this->items = $items; } function get_cart() { return $this->items; } }
$cart = new PriceCart( array(
    'a' => array( 'product_id' => 7, 'data' => new FakeProduct( 12.9 ), 'quantity' => 2 ),
    'b' => array( 'product_id' => 8, 'data' => new FakeProduct( 400 ), 'quantity' => 1 ),
) );
$hooks['woocommerce_before_calculate_totals'][0]( $cart );
$hooks['woocommerce_before_calculate_totals'][0]( $cart );   // WooCommerce recalculates often: must not stack
if ( enf_discount_active() ) {
    verify( abs( $cart->items['a']['data']->get_price() - 10.3 ) < 0.001 && abs( $cart->items['b']['data']->get_price() - 320 ) < 0.001, '20% price wrong or applied twice' );
} else {
    verify( abs( $cart->items['b']['data']->get_price() - 400 ) < 0.001, 'Discount still applied after 25 December' );
}
class FakeCoupon { function get_code() { return 'TILLO20'; } }
$blocked = false;
try { $filters['woocommerce_coupon_is_valid'][0]( true, new FakeCoupon() ); } catch ( Exception $error ) { $blocked = true; }
verify( $blocked, 'TILLO20 can still be stacked on the automatic discount' );
echo "Checkout gateway contract tests passed\n";
