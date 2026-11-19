<?php
// No WordPress writes: validate the complete cart before replacing a session cart.
function enf_checkout_validate_items( $items, $resolver ) {
    if ( ! is_array( $items ) || ! array_is_list( $items ) || count( $items ) < 1 || count( $items ) > 30 ) {
        throw new InvalidArgumentException( 'Please use between 1 and 30 different products.' );
    }
    $validated = array();
    $seen = array();
    foreach ( $items as $item ) {
        if ( ! is_array( $item ) || ! isset( $item['id'], $item['quantity'] ) ||
            ! is_int( $item['id'] ) || $item['id'] < 1 || ! is_int( $item['quantity'] ) ||
            $item['quantity'] < 1 || $item['quantity'] > 99 || isset( $seen[ $item['id'] ] ) ) {
            throw new InvalidArgumentException( 'The cart contains an invalid product or quantity.' );
        }
        $product = call_user_func( $resolver, $item['id'] );
        $supported = $product && $product->is_type( 'simple' );
        if ( $product && $product->is_type( 'variation' ) ) {
            $parent = call_user_func( $resolver, $product->get_parent_id() );
            $attributes = $product->get_variation_attributes();
            // Explicit variations have a unique ID for each complete choice.
            // "Any option" variations require a different cart contract and stay blocked.
            $supported = $parent && $parent->is_type( 'variable' ) && 'publish' === $parent->get_status() &&
                $parent->is_purchasable() && $parent->is_in_stock() && count( $attributes ) > 0 && ! in_array( '', $attributes, true );
        }
        if ( ! $supported || 'publish' !== $product->get_status() || ! $product->is_purchasable() ||
            ! $product->is_in_stock() || ! $product->has_enough_stock( $item['quantity'] ) ||
            ( $product->is_sold_individually() && $item['quantity'] !== 1 ) ) {
            throw new InvalidArgumentException( 'A product is unavailable or has insufficient stock. Please review your cart.' );
        }
        $seen[ $item['id'] ] = true;
        // Ignore all client names/prices/discounts: WooCommerce loads its own product and totals.
        $validated[] = array( 'id' => $item['id'], 'quantity' => $item['quantity'] );
    }
    return $validated;
}
