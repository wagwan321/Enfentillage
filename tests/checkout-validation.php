<?php
require __DIR__ . '/../wordpress/enfantillage-checkout/cart-validation.php';
class FakeProduct {
    public $type = 'simple'; public $purchasable = true; public $stock = 3; public $individual = false; public $status = 'publish'; public $attributes = array( 'attribute_color' => 'blue' );
    function is_type( $type ) { return $this->type === $type; }
    function is_purchasable() { return $this->purchasable; }
    function is_in_stock() { return $this->stock > 0; }
    function has_enough_stock( $quantity ) { return $this->stock >= $quantity; }
    function is_sold_individually() { return $this->individual; }
    function get_status() { return $this->status; }
    function get_parent_id() { return 100; }
    function get_variation_attributes() { return $this->attributes; }
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
$parent = new FakeProduct(); $parent->type = 'variable';
$product->type = 'variation'; $product->individual = false;
$resolve_variation = function ( $id ) use ( $product, $parent ) { return 42 === $id ? $product : ( 100 === $id ? $parent : false ); };
check( enf_checkout_validate_items( array( array( 'id' => 42, 'quantity' => 2 ) ), $resolve_variation ) === array( array( 'id' => 42, 'quantity' => 2 ) ), 'Explicit variation rejected' );
foreach ( array( 'parent-private', 'parent-stock', 'wildcard', 'variation-private' ) as $case ) {
    $parent->status = 'parent-private' === $case ? 'private' : 'publish';
    $parent->stock = 'parent-stock' === $case ? 0 : 3;
    $product->attributes = array( 'attribute_color' => 'wildcard' === $case ? '' : 'blue' );
    $product->status = 'variation-private' === $case ? 'private' : 'publish';
    $rejected = false;
    try { enf_checkout_validate_items( array( array( 'id' => 42, 'quantity' => 1 ) ), $resolve_variation ); } catch ( InvalidArgumentException $error ) { $rejected = true; }
    check( $rejected, 'Unavailable/incomplete variation accepted: ' . $case );
}
echo "Checkout PHP validation tests passed\n";
