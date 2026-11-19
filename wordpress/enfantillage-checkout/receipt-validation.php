<?php
function enf_checkout_receipt_data( $input ) {
    if ( ! is_array( $input ) || ! is_int( $input['orderId'] ?? null ) || $input['orderId'] < 1 ||
        ! is_string( $input['orderKey'] ?? null ) || ! preg_match( '/^wc_order_[A-Za-z0-9]{8,80}$/D', $input['orderKey'] ) ||
        ! is_string( $input['cartToken'] ?? null ) || ! preg_match( '/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D', $input['cartToken'] ) ||
        ! function_exists( 'wc_get_order' ) ) { return false; }
    $order = wc_get_order( $input['orderId'] );
    if ( ! $order || 'yes' !== $order->get_meta( '_enf_storefront_checkout' ) ||
        ! hash_equals( $order->get_order_key(), $input['orderKey'] ) ||
        ! hash_equals( (string) $order->get_meta( '_enf_storefront_cart_token' ), $input['cartToken'] ) ||
        ! $order->has_status( array( 'processing', 'on-hold', 'completed' ) ) ||
        ! in_array( $order->get_payment_method(), array( 'enf_cod', 'enf_whish' ), true ) ) { return false; }
    $items = array();
    foreach ( $order->get_items() as $line ) {
        $id = $line->get_variation_id() ?: $line->get_product_id();
        $items[ $id ] = ( $items[ $id ] ?? 0 ) + $line->get_quantity();
    }
    return array( 'verified' => true, 'orderId' => $order->get_id(), 'number' => (string) $order->get_order_number(),
        'status' => $order->get_status(), 'paymentMethod' => $order->get_payment_method(),
        'currency' => $order->get_currency(), 'total' => $order->get_total(),
        'items' => array_map( function ( $id ) use ( $items ) { return array( 'id' => (int) $id, 'quantity' => (int) $items[ $id ] ); }, array_keys( $items ) ) );
}
