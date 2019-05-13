(function ( $ ) {

	wpclUtils = {
		chunk       : function ( _array, _chunkMaxSize ) {

			var arrayOut  = [],
				i         = 0,
				arraySize = _array.length;

			if ( _chunkMaxSize < 1 ) {
				console.error( '[ObcUtils.chunk] Array chunk must be at leats 1' );
				return arrayOut;
			}

			while ( i < arraySize ) {
				arrayOut.push( _array.slice( i, i += _chunkMaxSize ) );
			}

			return arrayOut;
		},
		arrayUnique : function ( _array ) {
			var unique = [];
			for ( var i = 0; i < _array.length; i++ ) {
				if ( unique.indexOf( _array[ i ] ) === -1 ) {
					unique.push( _array[ i ] );
				}
			}
			return unique;
		}
	};


	wpclOrdersTable = {
		init : function () {
			var _this = wpclOrdersTable;

			_this.orderChunkSize = 50; // how many orders per AJAX call

			_this.$tableContainer = $( '#wc-product-customer-list-meta-box' );

			// Do we even have the meta box on this page?
			if ( _this.$tableContainer.length < 0 ) {
				// console.log( 'no tables container' );
				return false;
			}

			_this.$dataTable    = _this.$tableContainer.find( '#wpcl-list-table' );
			_this.$extraActions = _this.$tableContainer.find( '.wpcl-extra-action' );
			_this.$extraActions.hide();

			// Check if we have some the necessary config data supplied wpcl_enqueue_scripts()
			if ( typeof wpcl_script_vars === 'undefined' ) {
				console.error( '[wc-product-customer-list-pro] an error occured while trying to get the variables for the DataTables' );
				return false;
			}


			// No related order items, nothing else to do
			if ( typeof WPCL_ORDERS === 'undefined' ) {
				// console.log( 'no orders' );
				return false;
			}


			// We want to only launch this once the metabox comes into view
			var metaBox  = document.querySelector( '#wc-product-customer-list-meta-box' ),
				observer = new IntersectionObserver( function ( entries ) {
					$.each( entries, function ( i, entry ) {
						if ( entry.intersectionRatio > 0 ) {

							// Our main thing
							_this.processAllOrderItems();

							// no use in watching if it's in view anymore, after the first time
							observer.disconnect()
						}
					} );
				} );
			observer.observe( metaBox );


		},

		processAllOrderItems : function () {
			var _this = wpclOrdersTable;

			// console.log( 'About to process orders' );


			_this.needColumns      = true;
			_this.currentProductId = wpcl_script_vars.productId;

			// We're taking all our orders and making groups to send to the REST API
			// One at a time is wayyy too slow
			_this.orderIdBatches    = wpclUtils.chunk( WPCL_ORDERS, _this.orderChunkSize );
			_this.currentChunkIndex = 0;
			_this.numChunks         = _this.orderIdBatches.length;

			_this.data    = [];
			_this.columns = [];
			_this.emails  = [];
			_this.total   = 0;

			_this.$progressContainer = $( '<div class="progress-bar">\n' +
				'<span class="result">' + wpcl_script_vars.trans.processing_orders + '0%' + '</span>' +
				'  <span class="bar">' +
				'    <span class="progress"></span>' +
				'  </span>' +
				'</div>' ).insertBefore( _this.$dataTable );

			_this.$progressBar = _this.$progressContainer.find( '.progress' );
			_this.$result      = _this.$progressContainer.find( '.result' );


			_this.startTime = new Date();

			_this.getOrderItemInfo( _this.currentOrderIndex );


		},

		getOrderItemInfo : function () {
			var _this = wpclOrdersTable;

			// console.log( 'Processing order ', _this.orderIdBatches[ _this.currentChunkIndex ] );

			$.ajax( {
				url        : wpcl_script_vars.rest_urls.order_item_info,
				method     : 'POST',
				data       : {
					orders       : JSON.stringify( _this.orderIdBatches[ _this.currentChunkIndex ] ), // WP REST API doesn't accept multi-dimensional params
					product_id   : _this.currentProductId,
					need_columns : _this.needColumns,
				},
				beforeSend : function ( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', wpcl_script_vars.rest_nonce );
				}
			} ).done( function ( _data ) {
				// console.log( _data );


				// Yay! It worked
				if ( typeof _data.success !== 'undefined' && _data.success === true ) {

					// Compile the data
					if ( typeof _data.data !== 'undefined' && _data.data.length > 0 ) {

						for ( var i = 0; i < _data.data.length; i++ ) {
							_this.data.push( _data.data[ i ] );
						}

					}

					// Compile the columns during the first reception of data
					if ( _this.needColumns && typeof _data.columns !== 'undefined' ) {

						$.each( _data.columns, function ( data, title ) {
							_this.columns.push( {
								'data'  : data,
								'title' : title
							} )
						} );

						_this.needColumns = false;
					}


					// Add the emails to our global email array
					if ( typeof _data.email_list !== 'undefined' && _data.email_list.length > 0 ) {
						_this.emails = _this.emails.concat( _data.email_list );
					}

					if ( typeof _data.product_count !== 'undefined' ) {
						_this.total += _data.product_count;
					}
				}


				_this.currentChunkIndex++;
				if ( _this.currentChunkIndex < _this.numChunks ) {


					// call itself with the next item in the index
					_this.getOrderItemInfo();

					// Adjust
					var percentage = ((_this.currentChunkIndex) / _this.numChunks * 100);
					_this.$progressBar.css( {
						width : percentage + '%'
					} );

					_this.$result.text(
						wpcl_script_vars.trans.processing_orders +
						// (_this.currentChunkIndex + 1) + '/' + (_this.lastChunkIndex + 1) + '  ' +
						(Math.round( percentage * 100 ) / 100) + '%'
					);
				} else {

					// Adjust the progress bar
					_this.$progressBar.css( { width : '100%' } );
					_this.$result.text( '100%' );


					// Compile the list of unique emails
					if ( _this.emails.length > 0 ) {
						_this.emails = wpclUtils.arrayUnique( _this.emails );

						_this.$tableContainer.find( '.wpcl-btn-mail-to-all' ).attr( 'href', 'mailto:?bcc=' + _this.emails.join( ',' ) );
					}

					_this.$extraActions.find( '.total' ).find( '.product-count' ).text( _this.total );


					var endTime = new Date();
					var seconds = (endTime.getTime() - _this.startTime.getTime()) / 1000;

					console.log(
						' [wc-product-customer-list-pro] %cAJAX operation took about ' +
						'%c' + seconds + ' seconds. ',
						'background: #222; color: #fff',
						'background: #222; color: #bada55'
					);


					_this.$progressContainer.slideUp();

					// we have all our info. Time to setup the datables
					_this.setupDataTables();
				}
			} );

		},

		setupDataTables : function () {
			var _this = wpclOrdersTable;

			var productSKU           = wpcl_script_vars.productSku;
			var productTitle         = wpcl_script_vars.productTitle;
			var pdfOrientation       = wpcl_script_vars.pdfOrientation;
			var pdfPageSize          = wpcl_script_vars.pdfPagesize;
			var fileName             = productTitle.replace( /[^a-z0-9\s]/gi, '' ).replace( /[_\s]/g, '-' );
			var columnOrderIndex     = parseInt( wpcl_script_vars.columnOrderIndex );
			var columnOrderDirection = wpcl_script_vars.columnOrderDirection;

			var optionStateSave = false;
			if ( wpcl_script_vars.stateSave === 'yes' ) {
				optionStateSave = true;
			}

			var pdfTitle = productTitle + 'ss';
			if ( wpcl_script_vars.titleSku === 'yes' ) {
				pdfTitle = productTitle + ' (' + productSKU + ')';
			}


			var table = _this.$dataTable.DataTable( {

				data    : _this.data,
				columns : _this.columns,

				columnDefs : [
					//{ targets: [0], visible: false},
					//{ targets: '_all', visible: true }
				],
				colReorder : true,
				stateSave  : optionStateSave,
				//stateLoadParams: function (settings, data) {  data.columns['0'].visible = false; },
				order      : [ [ columnOrderIndex, columnOrderDirection ] ],
				select     : true,
				lengthMenu : [ [ 10, 25, 50, -1 ], [ 10, 25, 50, wpcl_script_vars.lengthMenuAll ] ],
				dom        : 'Blfrtip',
				buttons    : [
					{
						extend : 'copy',
						text   : wpcl_script_vars.copybtn,
					},
					{
						extend    : 'print',
						title     : productTitle,
						text      : wpcl_script_vars.printbtn,
						customize : function ( win ) {
							$( win.document.body )
								.css( 'background-color', '#fff' )
								.css( 'padding', '1px' );

							$( win.document.body ).find( 'table' )
								.addClass( 'compact' )
								.css( 'font-size', 'inherit' )
								.css( 'border', '0px' )
								.css( 'border-collapse', 'collapse' );

							$( win.document.body ).find( 'table th' )
								.css( 'padding', '5px 8px 8px' )
								.css( 'background-color', '#f1f1f1' )
								.css( 'border-bottom', '0px' );

							$( win.document.body ).find( 'table td' )
								.css( 'border', '1px solid #dfdfdf' )
								.css( 'padding', '8px' );

							$( win.document.body ).find( 'table tr:nth-child(even)' )
								.css( 'background-color', '#f9f9f9' );
						}
					},
					{
						extend : 'excelHtml5',
						title  : fileName
					},
					{
						extend : 'csvHtml5',
						title  : fileName
					},
					{
						extend      : 'pdfHtml5',
						title       : pdfTitle,
						orientation : pdfOrientation,
						pageSize    : pdfPageSize,
						filename    : fileName,
						customize   : function ( doc ) {
							doc.styles.tableHeader.fillColor   = '#f1f1f1';
							doc.styles.tableHeader.color       = '#000';
							doc.styles.tableBodyEven.fillColor = '#f9f9f9';
							doc.styles.tableBodyOdd.fillColor  = '#fff';
						}
					},
					{
						text   : wpcl_script_vars.resetColumn,
						action : function ( e, dt, node, config ) {
							table.colReorder.reset();
							table.state.clear();
							window.location.reload();
						}
					}
				],
				pagingType : 'full',
				scrollX    : true,
				language   : {
					'search'      : wpcl_script_vars.search,
					'emptyTable'  : wpcl_script_vars.emptyTable,
					'zeroRecords' : wpcl_script_vars.zeroRecords,
					'tableinfo'   : wpcl_script_vars.tableinfo,
					'lengthMenu'  : wpcl_script_vars.lengthMenu,
					'info'        : wpcl_script_vars.info,
					paginate      : {
						first    : '«',
						previous : '‹',
						next     : '›',
						last     : '»'
					},
					buttons       : {
						copyTitle   : wpcl_script_vars.copyTitle,
						copySuccess : {
							_ : wpcl_script_vars.copySuccessMultiple,
							1 : wpcl_script_vars.copySuccessSingle,
						}
					},
					aria          : {
						paginate : {
							first    : wpcl_script_vars.paginateFirst,
							previous : wpcl_script_vars.paginatePrevious,
							next     : wpcl_script_vars.paginateNext,
							last     : wpcl_script_vars.paginateLast,
						}
					}
				},

				// add a data-email attribute with the order email
				createdRow : function ( row, data, dataIndex ) {
					$( row ).attr( 'data-email', data.wpcl_billing_email_raw );
				}
			} );


			_this.$extraActions.show();

			// Update email list on row selection

			var $emailSelected = $( '.wpcl-btn-email-selected' );
			$emailSelected.on( 'click', function ( event ) {

				var href = $( event.currentTarget ).attr( 'href' );

				if ( href.indexOf( "mailto" ) === -1 ) {
					console.log( 'No rows seem to be selected' );
					return false;
				} else {
					return true;
				}


			} );
			table.on( 'select', function ( e, dt, type, indexes ) {
				var emails   = $.map( table.rows( '.selected' ).nodes(), function ( item ) {
					return $( item ).data( 'email' );
				} );
				var emailBcc = emails.join( "," );
				$emailSelected.attr( 'href', 'mailto:?bcc=' + emailBcc );
				if ( emailBcc ) {
					$emailSelected.removeAttr( 'disabled' );
				}
			} );

			// Update email list on row deselection
			table.on( 'deselect', function ( e, dt, type, indexes ) {
				var emails   = $.map( table.rows( '.selected' ).nodes(), function ( item ) {
					return $( item ).data( 'email' );
				} );
				var emailBcc = emails.join( "," );
				$emailSelected.attr( 'href', 'mailto:?bcc=' + emailBcc );
				if ( emailBcc ) {
					$emailSelected.removeAttr( 'disabled' );
				} else {
					$emailSelected.attr( 'disabled', 'true' );
					$emailSelected.attr( 'href', '#' );
				}
			} );
		}
	};


	$( function () {
		wpclOrdersTable.init();
	} );


})( jQuery );
