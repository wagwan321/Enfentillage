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
verify( isset( $free['enf_free_delivery'] ) && $free['enf_free_delivery']->cost === 0, 'Free Lebanon delivery missing' );
verify( array() === $filters['woocommerce_package_rates'][0]( array(), array( 'destination' => array( 'country' => 'US' ) ) ), 'International free shipping allowed' );
$_GET = array( 'order-received' => '1', 'key' => 'test_order_key' );
verify( enf_checkout_receipt_order() === $order, 'Receipt key verification failed' );
$_GET['key'] = 'wrong'; verify( false === enf_checkout_receipt_order(), 'Invalid receipt key accepted' );
$enabled = '0'; $existing = array( 'old_rate' => 'preserve' );
verify( $existing === $filters['woocommerce_package_rates'][0]( $existing, array() ), 'Existing shipping rates changed while disabled' );
echo "Checkout gateway contract tests passed\n";
