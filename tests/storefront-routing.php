<?php
require __DIR__ . '/../wordpress/enfantillage-checkout/storefront-routing.php';
function expect_route( $request, $expected ) {
    $actual = enf_storefront_redirect_target( array_merge( array(
        'method' => 'GET', 'host' => 'enfantillagestore.com', 'query' => array(), 'type' => 'home',
    ), $request ) );
    if ( $actual !== $expected ) { throw new Exception( json_encode( array( $request, $actual, $expected ) ) ); }
}
$www = 'https://www.enfantillagestore.com';
expect_route( array(), $www . '/' );
expect_route( array( 'type' => 'shop', 'method' => 'HEAD' ), $www . '/shop.html' );
expect_route( array( 'type' => 'product', 'id' => 54287, 'query' => array( 'p' => '54287', 'post_type' => 'product' ) ), $www . '/product.html?id=54287' );
expect_route( array( 'type' => 'category', 'id' => 917 ), $www . '/shop.html?cat=wc-917' );
expect_route( array( 'type' => 'search', 'search' => 'dolls & toys', 'query' => array( 's' => 'dolls & toys', 'post_type' => 'product' ) ), $www . '/shop.html?q=dolls%20%26%20toys' );
expect_route( array( 'query' => array( 'utm_source' => 'newsletter' ) ), $www . '/?utm_source=newsletter' );
foreach ( array( 'enf_checkout', 'wc-ajax', 'wc-api', 'rest_route', 'add-to-cart', 'order-received', 'key', 'some_future_callback', '_wpnonce', 'preview' ) as $key ) {
    expect_route( array( 'query' => array( $key => '1' ) ), '' );
}
foreach ( array( 'POST', 'PUT', 'DELETE', 'OPTIONS' ) as $method ) { expect_route( array( 'method' => $method ), '' ); }
foreach ( array( 'www.enfantillagestore.com', 'enfantillagestore.com:2083', 'enfantillagestore.com.attacker.test', 'attacker.test' ) as $host ) {
    expect_route( array( 'host' => $host ), '' );
}
foreach ( array( 'admin', 'account', 'checkout', 'unknown', '' ) as $type ) { expect_route( array( 'type' => $type ), '' ); }
expect_route( array( 'type' => 'product', 'id' => -1 ), '' );
expect_route( array( 'type' => 'product', 'id' => '42' ), '' );
expect_route( array( 'query' => array( 'utm_source' => array( 'unexpected' ) ) ), '' );
expect_route( array( 'query' => array( 'redirect_to' => 'https://attacker.test' ) ), '' );
echo "Storefront routing preserves backend callbacks and prevents redirect loops\n";
