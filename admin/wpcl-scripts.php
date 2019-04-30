<?php
/**
 * @package WC_Product_Customer_List
 * @version 2.8.1
 */

if ( ! function_exists( 'wpcl_enqueue_scripts' ) ) {
	function wpcl_enqueue_scripts( $hook ) {
		global $post;
		if ( 'post.php' != $hook || 'product' != get_post_type( $post ) ) {
			return;
		}
		$product_sku = wc_get_product( $post->ID )->get_sku();

		$css_timestamp = date( "YmdHis", filemtime( plugin_dir_path( __FILE__ ) . 'assets/admin.css' ) );
		wp_register_style( 'wpcl-admin-css', plugin_dir_url( __FILE__ ) . 'assets/admin.css', false, $css_timestamp );

		wp_register_style( 'wpcl-datatables-css', plugin_dir_url( __FILE__ ) . 'assets/vendor/datatables.min.css', false, '1.10.18' );
		wp_register_style( 'wpcl-datatables-buttons-css', plugin_dir_url( __FILE__ ) . 'assets/vendor/buttons.dataTables.min.css', false, '1.2.2' );
		wp_register_style( 'wpcl-datatables-select-css', plugin_dir_url( __FILE__ ) . 'assets/vendor/select.dataTables.min.css', false, '1.2.2' );

		wp_register_script( 'wpcl-datatables-js', plugin_dir_url( __FILE__ ) . 'assets/vendor/datatables.min.js', true, '1.10.18' );
		wp_register_script( 'wpcl-datatables-buttons-js', plugin_dir_url( __FILE__ ) . 'assets/vendor/dataTables.buttons.min.js', true, '1.2.2' );
		wp_register_script( 'wpcl-datatables-buttons-flash', plugin_dir_url( __FILE__ ) . 'assets/vendor/buttons.flash.min.js', true, '1.2.2' );
		wp_register_script( 'wpcl-datatables-print', plugin_dir_url( __FILE__ ) . 'assets/vendor/buttons.print.min.js', true, '1.2.2' );
		wp_register_script( 'wpcl-datatables-jszip', plugin_dir_url( __FILE__ ) . 'assets/vendor/jszip.min.js', true, '2.5.0' );
		wp_register_script( 'wpcl-datatables-pdfmake', plugin_dir_url( __FILE__ ) . 'assets/pdfmake/pdfmake.min.js', true, '0.1.20' );
		wp_register_script( 'wpcl-datatables-vfs-fonts', plugin_dir_url( __FILE__ ) . 'assets/vendor/vfs_fonts.js', true, '0.1.20' );
		wp_register_script( 'wpcl-datatables-buttons-html', plugin_dir_url( __FILE__ ) . 'assets/vendor/buttons.html5.min.js', true, '1.2.2' );
		//wp_register_script( 'wpcl-datatables-buttons-print', 'https://cdn.datatables.net/buttons/1.2.2/js/buttons.print.min.js', true, '1.2.2' );
		wp_register_script( 'wpcl-datatables-colreorder', plugin_dir_url( __FILE__ ) . 'assets/vendor/dataTables.colReorder.min.js', true, '1.3.2' );
		wp_register_script( 'wpcl-datatables-select', plugin_dir_url( __FILE__ ) . 'assets/vendor/dataTables.select.min.js', true, '1.2.2' );

		$js_timestamp = date( "YmdHis", filemtime( plugin_dir_path( __FILE__ ) . 'assets/admin.js' ) );
		wp_register_script( 'wpcl-script', plugin_dir_url( __FILE__ ) . 'assets/admin.js', true, $js_timestamp );

		wp_enqueue_style( 'wpcl-admin-css' );
		wp_enqueue_style( 'wpcl-datatables-css' );
		wp_enqueue_style( 'wpcl-datatables-buttons-css' );
		wp_enqueue_style( 'wpcl-datatables-select-css' );

		wp_enqueue_script( 'wpcl-datatables-js' );
		wp_enqueue_script( 'wpcl-datatables-buttons-js' );
		wp_enqueue_script( 'wpcl-datatables-buttons-flash' );
		wp_enqueue_script( 'wpcl-datatables-print' );
		wp_enqueue_script( 'wpcl-datatables-jszip' );
		wp_enqueue_script( 'wpcl-datatables-pdfmake' );
		wp_enqueue_script( 'wpcl-datatables-vfs-fonts' );
		wp_enqueue_script( 'wpcl-datatables-buttons-html' );
		//wp_enqueue_script( 'wpcl-datatables-buttons-print');
		wp_enqueue_script( 'wpcl-datatables-colreorder' );
		wp_enqueue_script( 'wpcl-datatables-select' );
		wp_enqueue_script( 'wpcl-script' );

		wp_localize_script( 'wpcl-script', 'wpcl_script_vars', array(
			'copybtn'              => __( 'Copy', 'wc-product-customer-list' ),
			'printbtn'             => __( 'Print', 'wc-product-customer-list' ),
			'search'               => __( 'Search', 'wc-product-customer-list' ),
			'emptyTable'           => __( 'This product currently has no customers', 'wc-product-customer-list' ),
			'zeroRecords'          => __( 'No orders match your search', 'wc-product-customer-list' ),
			'tableinfo'            => __( 'Showing _START_ to _END_ out of _TOTAL_ orders', 'wc-product-customer-list' ),
			'lengthMenu'           => __( 'Show _MENU_ orders', 'wc-product-customer-list' ),
			'copyTitle'            => __( 'Copy to clipboard', 'wc-product-customer-list' ),
			'copySuccessMultiple'  => __( 'Copied %d rows', 'wc-product-customer-list' ),
			'copySuccessSingle'    => __( 'Copied 1 row', 'wc-product-customer-list' ),
			'paginateFirst'        => __( 'First', 'wc-product-customer-list' ),
			'paginatePrevious'     => __( 'Previous', 'wc-product-customer-list' ),
			'paginateNext'         => __( 'Next', 'wc-product-customer-list' ),
			'paginateLast'         => __( 'Last', 'wc-product-customer-list' ),
			'productTitle'         => get_the_title(),
			'pdfPagesize'          => get_option( 'wpcl_export_pdf_pagesize', 'LETTER' ),
			'pdfOrientation'       => get_option( 'wpcl_export_pdf_orientation', 'portrait' ),
			'resetColumn'          => __( 'Reset column order', 'wc-product-customer-list' ),
			'lengthMenuAll'        => __( 'All', 'wc-product-customer-list' ),
			'info'                 => __( 'Showing _START_ to _END_ of _TOTAL_ entries', 'wc-product-customer-list' ),
			'columnOrderIndex'     => get_option( 'wpcl_column_order_index', 0 ),
			'columnOrderDirection' => get_option( 'wpcl_column_order_direction', 'asc' ),
			'stateSave'            => get_option( 'wpcl_state_save', 'yes' ),
			'titleSku'             => get_option( 'wpcl_export_pdf_sku', 'no' ),
			'productSku'           => $product_sku,
			'productId'            => $post->ID,
			'trans'                => array(
				'processing_orders' => __( 'Processing Orders: ', 'wc-product-customer-list' ),
			),
			'rest_urls'            => array(
				'order_item_info' => get_rest_url( null, Wpcl_Api::get_rest_url( 'order-items' ) ),
			),
			'rest_nonce'           => wp_create_nonce( 'wp_rest' ),
		) );
	}

	add_action( 'admin_enqueue_scripts', 'wpcl_enqueue_scripts' );
}