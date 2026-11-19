<?php
require __DIR__ . '/../wordpress/enfantillage-checkout/receipt-validation.php';
class ReceiptLine { function get_variation_id() { return 1001; } function get_product_id() { return 99; } function get_quantity() { return 2; } }
class ReceiptOrder {
    public $status = 'on-hold'; public $token = 'a1234567-b123-4123-8123-a12345678901';
    function get_meta( $key ) { return '_enf_storefront_checkout' === $key ? 'yes' : $this->token; }
    function get_order_key() { return 'wc_order_test12345678'; }
    function has_status( $list ) { return in_array( $this->status, $list, true ); }
    function get_status() { return $this->status; }
    function get_payment_method() { return 'enf_whish'; }
    function get_items() { return array( new ReceiptLine() ); }
    function get_id() { return 42; } function get_order_number() { return 'TEST-42'; }
    function get_currency() { return 'USD'; } function get_total() { return '20.00'; }
}
$order = new ReceiptOrder();
function wc_get_order( $id ) { global $order; return 42 === $id ? $order : false; }
function receipt_check( $ok, $message ) { if ( ! $ok ) { throw new Exception( $message ); } }
$proof = array( 'orderId' => 42, 'orderKey' => 'wc_order_test12345678', 'cartToken' => $order->token );
$result = enf_checkout_receipt_data( $proof );
receipt_check( $result['verified'] && $result['items'] === array( array( 'id' => 1001, 'quantity' => 2 ) ), 'Native variation receipt invalid' );
receipt_check( ! isset( $result['billing'] ) && ! isset( $result['customer_id'] ), 'Customer data exposed' );
foreach ( array( 'orderId' => 43, 'orderKey' => 'wc_order_wrong12345678', 'cartToken' => 'b1234567-b123-4123-8123-a12345678901' ) as $key => $value ) {
    receipt_check( false === enf_checkout_receipt_data( array_merge( $proof, array( $key => $value ) ) ), 'Invalid receipt proof accepted' );
}
$order->status = 'cancelled'; receipt_check( false === enf_checkout_receipt_data( $proof ), 'Cancelled order accepted' );
$order->status = 'on-hold'; $order->token = ''; receipt_check( false === enf_checkout_receipt_data( $proof ), 'Untracked order accepted' );
echo "Receipt verification requires matching order key/token and excludes customer details\n";
