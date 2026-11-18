<?php
require __DIR__ . '/../wordpress/enfantillage-checkout/cart-validation.php';
class FakeProduct {
    public $type = 'simple'; public $purchasable = true; public $stock = 3; public $individual = false;
    function is_type( $type ) { return $this->type === $type; }
    function is_purchasable() { return $this->purchasable; }
    function is_in_stock() { return $this->stock > 0; }
    function has_enough_stock( $quantity ) { return $this->stock >= $quantity; }
    function is_sold_individually() { return $this->individual; }
}
function check( $condition, $label ) { if ( ! $condition ) { throw new Exception( $label ); } }
$product = new FakeProduct();
$resolver = function ( $id ) use ( $product ) { return 42 === $id ? $product : false; };
$result = enf_checkout_validate_items( array( array( 'id' => 42, 'quantity' => 2, 'price' => 0.01 ) ), $resolver );
check( $result === array( array( 'id' => 42, 'quantity' => 2 ) ), 'Client prices must not be used' );
$invalid = array( null, array(), array( array( 'id' => 42, 'quantity' => 4 ) ), array( array( 'id' => 43, 'quantity' => 1 ) ), array( array( 'id' => 42, 'quantity' => '1' ) ), array( array( 'id' => 42, 'quantity' => -1 ) ), array( array( 'id' => 42, 'quantity' => 1 ), array( 'id' => 42, 'quantity' => 1 ) ) );
foreach ( $invalid as $items ) {
    $rejected = false;
    try { enf_checkout_validate_items( $items, $resolver ); } catch ( InvalidArgumentException $error ) { $rejected = true; }
    check( $rejected, 'Invalid cart accepted' );
}
foreach ( array( 'variable', 'external', 'grouped' ) as $type ) {
    $product->type = $type; $rejected = false;
    try { enf_checkout_validate_items( array( array( 'id' => 42, 'quantity' => 1 ) ), $resolver ); } catch ( InvalidArgumentException $error ) { $rejected = true; }
    check( $rejected, 'Unsupported type accepted' );
}
$product->type = 'simple'; $product->individual = true; $rejected = false;
try { enf_checkout_validate_items( array( array( 'id' => 42, 'quantity' => 2 ) ), $resolver ); } catch ( InvalidArgumentException $error ) { $rejected = true; }
check( $rejected, 'Sold-individually limit bypassed' );
echo "Checkout PHP validation tests passed\n";
