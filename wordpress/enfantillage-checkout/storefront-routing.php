<?php
// Fixed destinations only. Unrecognized requests stay with WordPress.
function enf_storefront_redirect_target( $request ) {
    if ( ! in_array( $request['method'] ?? '', array( 'GET', 'HEAD' ), true ) ||
        ! in_array( strtolower( $request['host'] ?? '' ), array( 'enfantillagestore.com', 'enfantillagestore.com:443' ), true ) ) {
        return '';
    }
    $type = $request['type'] ?? '';
    $query = $request['query'] ?? array();
    if ( ! is_array( $query ) ) { return ''; }
    $tracking = array( 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'gclid', 'fbclid', 'msclkid' );
    $selectors = 'product' === $type ? array( 'product', 'p', 'post_type' ) :
        ( 'category' === $type ? array( 'product_cat' ) : ( 'search' === $type ? array( 's', 'post_type' ) : array() ) );
    $preserve = array();
    foreach ( $query as $key => $value ) {
        // Includes every checkout/admin/callback query, not only known plugin names.
        if ( ! is_string( $value ) || strlen( $value ) > 1024 ||
            ! in_array( $key, array_merge( $tracking, $selectors ), true ) ) { return ''; }
        if ( in_array( $key, $tracking, true ) ) { $preserve[ $key ] = $value; }
    }
    $params = array();
    if ( 'home' === $type ) { $path = '/'; }
    elseif ( 'shop' === $type ) { $path = '/shop.html'; }
    elseif ( in_array( $type, array( 'product', 'category' ), true ) && is_int( $request['id'] ?? null ) && $request['id'] > 0 ) {
        $path = 'product' === $type ? '/product.html' : '/shop.html';
        $params = 'product' === $type ? array( 'id' => $request['id'] ) : array( 'cat' => 'wc-' . $request['id'] );
    } elseif ( 'search' === $type && is_string( $request['search'] ?? null ) && strlen( $request['search'] ) <= 512 ) {
        $path = '/shop.html'; $params = array( 'q' => $request['search'] );
    } else { return ''; }
    $params = array_merge( $params, $preserve );
    return 'https://www.enfantillagestore.com' . $path .
        ( $params ? '?' . http_build_query( $params, '', '&', PHP_QUERY_RFC3986 ) : '' );
}
