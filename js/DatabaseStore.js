
function promiseAll( object )
{
	var promises	= [];
	var index		= [];

	for( var i in object )
	{
		index.push( i );
		promises.push( object[ i ] );
	}

	return new Promise((resolve,reject)=>
	{
		Promise.all( promises ).then
		(
		 	(values)=>
			{
				var obj = {};
				for(var i=0;i<values.length;i++)
				{
					obj[ index[ i ] ] = values [ i ];
				}

				resolve( obj );
			},
			(reason)=>
			{
				reject( reason );
			}
		);
	});
}

export default class DatabaseStore
{
	/*
	 	new DatabaseStore({
			name		: "users"
			,version	: 1
			,stores		:{
				user: {
					keyPath	: 'id'
					autoincrement: true
					indexes	:
					[
						{ indexName: "name", keyPath:"name", objectParameters: { uniq : false, multiEntry: false, locale: 'auto'  } }
						,{ indexName: "age", keyPath:"age", objectParameters: { uniq : false, multiEntry: false, locale: 'auto'  } }
						,{ indexName: "curp", keyPath:"age", objectParameters: { uniq : true, multiEntry: false, locale: 'auto'  } }
						,{ indexName: "tagIndex", keyPath:"age", objectParameters: { uniq : false, multiEntry: true , locale: 'auto'  } } //age i thing it must be a array
					]
				}
			}
		});
	 * */
	constructor( schema )
	{
		this.schema = schema;
		this.debug	= false;
		this.database = null;
	}

	static getDefaultSchema()
	{
		return {
			name		: 'default'
			,version	: 1
			,stores		:{
				keyValue :
				{
					keyPath : null
					,autoIncrement : false
				}
			}
		};
	}

	init()
	{
		return new Promise((resolve,reject)=>
		{
			let DBOpenRequest	   = window.indexedDB.open( this.schema.name || 'default', this.schema.version );

			DBOpenRequest.onerror   = ( evt )=>
			{
				if( this.debug )
					console.log( evt );

				reject( evt );
			};

			DBOpenRequest.onupgradeneeded	 = (evt)=>
			{
				if( this.debug )
					console.log('Init creating stores');

				let db = evt.target.result;
				this._createSchema( evt.target.transaction, db );
			};

			DBOpenRequest.onsuccess = (e)=>
			{
				this.database	= e.target.result;
				resolve( e );
			};
		});
	}

	_createSchema( transaction, db )
	{
		let stores 	= db.objectStoreNames;

		for(let storeName in this.schema.stores )
		{
			let store = null;

			if( ! ('indexes' in this.schema.stores[ storeName ]) )
			{
				this.schema.stores[ storeName ].indexes = [];
			}

			if( !db.objectStoreNames.contains( storeName ) )
			{
				if( this.debug )
					console.log('creating store'+storeName);

				let keyPath			= 'keyPath' in this.schema.stores[ storeName ] ? this.schema.stores[ storeName ].keyPath : 'id';
				let autoincrement	= 'autoincrement' in this.schema.stores[storeName] ? this.schema.stores[storeName].autoincrement : true;
				store	= db.createObjectStore( storeName ,{ keyPath: keyPath , autoIncrement: autoincrement } );

				this._createIndexForStore
				(
					store
					,this.schema.stores[ storeName ].indexes
				);
			}
			else
			{
				let store = transaction.objectStore( storeName );

				let toDelete = [];

				for( let j=0;j<store.indexNames.length;j++)
				{
					if( ! this.schema.stores[ storeName ].indexes.some( z=> z.indexName == store.indexNames.item( j )) )
						toDelete.push( store.indexNames.item( j ) );
				}

				while( toDelete.length )
				{
					let z = toDelete.pop();
					store.deleteIndex( z );
				}

				this._createIndexForStore
				(
					store
					,this.schema.stores[ storeName ].indexes
				);
			}
		}

		let dbStoreNames = Array.from( db.objectStoreNames );

		dbStoreNames.forEach((storeName)=>
		{
			if( !(storeName in this.schema.stores) )
			{
				db.deleteObjectStore( storeName );
			}
		});
	}

	_createIndexForStore( store, indexesArray )
	{
		indexesArray.forEach((index)=>
		{
			if( !store.indexNames.contains( index.indexName ) )
				store.createIndex( index.indexName, index.keyPath, index.objectParameters );
		});
	}


	getStoreNames()
	{
		if( this.database )
			return this.database.objectStoreNames;

		throw 'Database is not initialized';
	}

	addItem( storeName, key, item )
	{
		let generatedId = null;

		if( !this.database.objectStoreNames.contains( storeName ) )
			throw 'Store "'+storeName+' doesn\'t exists';

		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction( [storeName] , 'readwrite' );

			transaction.oncomplete = (evt)=>
			{
				//Never Fires
				if( this.debug )
					console.log('AddItem('+storeName+' key:'+key+' item:'+JSON.stringify( item )+' Transaction complete');

				resolve( generatedId );
			};

			transaction.onerror = (evt)=>
			{
				if( this.debug )
					console.log('AddItem('+storeName+' key:'+key+' item:'+JSON.stringify( item )+' Fails');

				reject( evt );
			};


			let store = transaction.objectStore( storeName );

			try
			{
				let request = key ? store.add( item, key ) : store.add( item );


				request.onsuccess = (evt)=>
				{
					generatedId = evt.target.result;

					if( this.debug )
						console.log('AddItem('+storeName+' key:'+key+' item:'+JSON.stringify( item )+' Request Success', evt );
					//resolve(evt);
				};

				request.onerror = (evt)=>
				{
					if( this.debug )
						console.log('AddItem('+storeName+' key:'+key+' item:'+JSON.stringify( item )+' Request Error ', evt);
				};
			}
			catch(e)
			{
				if( this.debug )
					console.log( e );

				reject( e );
			}

		});
	}

	addItems(storeName, items, insertIgnore)
	{
		if( this.debug )
			console.log('Adding items', items );

		if( !this.database.objectStoreNames.contains( storeName ) )
			return Promise.reject( 'Store "'+storeName+' doesn\'t exists');

		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction( [storeName] , 'readwrite' );

			let addedItems	= [];

			transaction.oncomplete = (evt)=>
			{
				if( this.debug )
					console.log('AddItems('+storeName+'  items:'+JSON.stringify( items )+' transaction Complete');

				resolve( addedItems );
			};

			transaction.onerror = (evt)=>
			{
				if( this.debug )
				{
					console.log('AddItems('+storeName+'  items:'+JSON.stringify( items )+' transaction Success');
				}
				reject( evt );
			};

			let store = transaction.objectStore( storeName );

			let successEvt = (evt)=>
			{
				if( this.debug )
					console.log('AddItems '+storeName+' Request Success', evt );

				addedItems.push( evt.target.result );
			};

			let errorEvt = (evt)=>
			{
				if( insertIgnore )
				{
					evt.preventDefault();
					evt.stopPropagation();
					return;
				}
				if( this.debug )
					console.log('AddItems '+storeName+' Request Fail ', evt );
			};

			items.forEach((k)=>
			{
				let request = store.add( k );
				request.onsuccess = successEvt;
				request.onerror	= errorEvt;
				//console.error( jj );
			});
		});
	}

	clear(...theArgs)
	{
		//let arr = theArgs.length == 1 && Array.isArray( theArgs ) ? theArgs[0] : theArgs;
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction(theArgs , 'readwrite' );
			transaction.oncomplete = (evt)=>
			{
				resolve( evt );
			};

			transaction.onerror = (evt)=>
			{
				reject( evt );
			};

			theArgs.forEach((i)=>
			{
				if( this.debug )
					console.log('Deleting '+i );

				let store = transaction.objectStore( i );
				store.clear();
			});
		});
	}


	count(storeName, options)
	{
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([storeName], 'readonly' );

			transaction.onerror = (evt)=>
			{
				if( this.debug )
					console.log('Error for '+storeName+' '+JSON.stringify( options ), evt );

				reject( evt );
			};

			let store		= transaction.objectStore( storeName );
			let queryObject = this._getQueryObject( storeName, transaction, options );
			let range		= this._getKeyRange( options );

			let request = queryObject.count( range );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};
		});
	}

	getAll(storeName, options )
	{
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([storeName], 'readonly' );

			transaction.onerror = (evt)=>
			{
				if( this.debug )
					console.log('GetAll( storeName: ',storeName,' Options:', JSON.stringify( options ), ' transaction error', evt);

				reject( evt );
			};


			transaction.onsuccess = (evt)=>
			{
				if( this.debug )
					console.log('GetAll( storeName: ',storeName,' Options:', JSON.stringify( options ), ' transaction success');
			};

			let store		= transaction.objectStore( storeName );

			let queryObject = this._getQueryObject( storeName, transaction, options );
			let range		= this._getKeyRange( options );
			let count		= this._getOptionsCount( options );

			let request  = ( range == null && count == 0 )
				  ? queryObject.getAll()
				  : queryObject.getAll( range, count );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};

			request.onerror = ( evt )=>
			{
				let msg = 'msg' in evt ? evt['msg'] : evt;

				if( 'msg' in evt )
					reject('Some errror '+msg );
			};
		});
	}

	getAllKeys(storeName, options )
	{
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([storeName], 'readonly' );

			transaction.onerror = (evt)=>
			{
				reject( evt );
			};

			let store		= transaction.objectStore( storeName );
			let queryObject = this._getQueryObject( storeName, transaction, options );
			let range		= this._getKeyRange( options );
			let count		= this._getOptionsCount( options );

			let request = queryObject.getAllKeys( range, count );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};

			transaction.onsuccess = ()=>
			{
//				resolve( request.result );
			};
		});
	}

	getByKey(storeName, list, opt )
	{
		let orderedKeyList = list.slice(0);
		let options = opt ? opt : {};

		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([storeName], 'readonly' );

			transaction.onerror = (evt)=>
			{
				reject( evt );
			};

			let store		= transaction.objectStore( storeName );
			let queryObject = this._getQueryObject( storeName, transaction, options );
			let range		= this._getKeyRange( options );

			let items		= [];

			var i = 0;
			var cursorReq = queryObject.openCursor( range );

			cursorReq.onsuccess = (event)=>
			{
				var cursor = event.target.result;

				if (!cursor)
				{
					resolve( items ); return;
				}

				var key = cursor.key;

				while (key > orderedKeyList[i])
				{
					// The cursor has passed beyond this key. Check next.
					++i;

					if (i === orderedKeyList.length) {
						// There is no next. Stop searching.
						resolve( items );
						return;
					}
				}

				if (key === orderedKeyList[i]) {
					// The current cursor value should be included and we should continue
					// a single step in case next item has the same key or possibly our
					// next key in orderedKeyList.
					//onfound(cursor.value);
					items.push( cursor.value );
					cursor.continue();
				} else {
					// cursor.key not yet at orderedKeyList[i]. Forward cursor to the next key to hunt for.
					cursor.continue(orderedKeyList[i]);
				}
			};
		});
	}

	customFilter(storeName, options, callbackFilter )
	{
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([ storeName ], 'readwrite' );

			transaction.onerror = (evt)=>
			{
				reject( evt );
			};

			transaction.onsuccess = ( evt )=>
			{
				if( this.debug )
					console.log('opencursor( storeName: ',storeName,' Options:', JSON.stringify( options ), ' transaction success');
				//resolve( evt );
			};

			transaction.oncomplete = ( evt )=>
			{
				if( this.debug )
					console.log('OpenCursor('+storeName+' options:'+JSON.stringify( options )+' Transaction complete');
			};

			let store		= transaction.objectStore( storeName );
			let queryObject = this._getQueryObject( storeName, transaction, options );
			let range		= this._getKeyRange( options );
			let direction	= this._getOptionsDirection( options );

			let request = queryObject.openCursor( range, direction );

			let results		= [];

			request.onsuccess = (evt)=>
			{
				if( evt.target.result )
				{
					if( callbackFilter( evt.target.result.value ) )
						results.push( evt.target.result.value );

					evt.target.result.continue();
				}
				else
				{
					//Maybe call resolve
					resolve( results );
				}
			};
		});
	}

	put( storeName, item )
	{
		return this.putItems(storeName, [item ] );
	}

	putItems( storeName, items )
	{
		return this.updateItems(storeName, items );
	}

	updateItems( storeName, items )
	{
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([storeName], "readwrite" );

			transaction.onerror = (evt)=>
			{
				if( this.debug )
					console.log('PUT '+storeName+' Transactions error', evt );

				reject( evt );
			};

			transaction.onsuccess = (evt)=>
			{
				if( this.debug )
					console.log('PUT '+storeName+' Transactions success', evt );

				//resolve( results );
			};

			let results	 = [];

			transaction.oncomplete = (evt)=>
			{
				if( this.debug )
					console.log('PUT '+storeName+' Transactions complete', evt );

				resolve( results );
			};

			let store		= transaction.objectStore( storeName );


			let evtError	= (evt)=>
			{
				if( this.debug )
					console.error('PUT '+storeName+' Request error ', evt );
			};

			let evtSuccess	= (evt)=>
			{
				if( this.debug )
					console.log('PUT '+storeName+' Request Succes',evt.target.result );

				results.push( evt.target.result );
			};

			for(let i=0;i<items.length;i++)
			{
				try
				{
					let request			= store.put( items[ i ]);
					request.onerror		= evtError;
					request.onsuccess	= evtSuccess;
				}
				catch(e)
				{
					if( this.debug )
						console.log('PUT '+storeName+' Exception thrown '+JSON.stringify( i ),e );
					reject( e );
				}
			}
		});
	}

	get(storeName, key )
	{
		return new Promise((resolve,reject)=>
		{
			if( this.debug )
			{
				console.log("Store name", storeName );
			}

			let transaction = this.database.transaction([storeName], 'readonly' );

			transaction.onsuccess = (evt)=>
			{
				resolve( request.result );
			};

			transaction.onerror = (evt)=>
			{
				reject( evt );
			};

			let store		= transaction.objectStore( storeName );

			let request = store.get( key );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};
		});
	}


	/*
	 * if options is passed resolves to the number of elements deleted
	 */
	deleteByKeyIds(storeName, arrayOfKeyIds )
	{
		let total = 0 ;

		return this.count( storeName,{})
		.then((count)=>
		{
			total = count;
			return new Promise((resolve,reject)=>
			{
				let transaction = this.database.transaction([storeName], 'readwrite' );
				let store = transaction.objectStore( storeName );

				transaction.oncomplete = (evt)=>
				{
					resolve( evt );
				};

				transaction.onerror = (evt)=>
				{
					reject( evt );
				};

				arrayOfKeyIds.forEach((key)=>
				{
					let request = store.delete( key );
				});
			});
		})
		.then(()=>
		{
			return this.count( storeName, {} );
		})
		.then((count)=>
		{
			return Promise.resolve( total - count );
		});
	}
	/*
	 * if options is passed resolves to the number of elements deleted
	 */
	removeAll(storeName, options )
	{
		if( this.debug )
			console.log('RemoveAll Start');

		let total = 0;

		return this.count( storeName, options )
		.then((count)=>
		{
			total = count;

			if( this.debug )
				console.log('RemoveAll to remove', count );

			if( count  === 0 )
				return Promise.resolve( 0 );

			return new Promise((resolve,reject)=>
			{
				let count = 0;

				let transaction = this.database.transaction([storeName], 'readwrite' );

				transaction.oncomplete = (evt)=>
				{
					if( this.debug )
						console.log("RemoveAll complete", evt );
					resolve( 1 );
				};

				transaction.onerror = (evt)=>
				{
					if( this.debug )
						console.log("RemoveAll complete", evt );

					reject( evt );
				};

				let store		= transaction.objectStore( storeName );
				let queryObject = this._getQueryObject( storeName, transaction, options );
				let range		= this._getKeyRange( options );

				if( 'index' in options || range === null )
				{
					let direction	= this._getOptionsDirection( options );
					let request 	= queryObject.openCursor( range );

					request.onerror = (evt)=>
					{
						console.log('cursor error',evt);
					};
					request.onsuccess = (evt)=>
					{
						let cursor = evt.target.result;

						if( cursor )
						{
							cursor.delete();
							cursor.continue();
						}
					};
				}
				else
				{
					store.delete( range );
				}
			});
		})
		.then((x)=>
		{
			if( x === 0 )
				return Promise.resolve( 0 );

			if( this.debug )
				console.log('RemoveAll MAKING A COUNT');

			return this.count( storeName, options );
		})
		.then((count)=>
		{
			if( this.debug )
				console.log("REMOVEALL rech the end", count );

			return Promise.resolve( total - count );
		});
	}

	remove(storeName, key )
	{
		return new Promise((resolve,reject)=>
		{
			let transaction = this.database.transaction([storeName], 'readwrite' );

			transaction.onerror = (evt)=>
			{
				reject( evt );
			};
			transaction.oncomplete = (evt)=>
			{
				resolve( evt );
			};

			let store		= transaction.objectStore( storeName );

			let request = store.delete( key );
		});
	}

	_getOptionsCount( options )
	{
		if( options && 'count' in options )
			return options.count;

		return null;
	}

	_getOptionsDirection(options)
	{
		if( options && 'direction' in options )
			return options.direction;

		return "next";
	}

	_getQueryObject( storeName ,transaction ,options )
	{
		let store		= transaction.objectStore( storeName );
		let queryObject = store;

		if( options && 'index' in options)
		{
			queryObject = store.index( options.index );
		}

		return queryObject;
	}

	/*
	 *	x.countQuery('users','id',{index:'xxxx' '>=' : 3 , '<=' : '5' });
	 */

	_getKeyRange( options )
	{
		if( options === null || options === undefined )
			return null;

		if( '=' in options )
		{
			return IDBKeyRange.only( options['='] );
		}

		let isLowerBoundOpen	= '>' in options;
		let isLowerBound  		= isLowerBoundOpen || '>=' in options;

		let isUpperBoundOpen	= '<' in options;
		let isUpperBound		= isUpperBoundOpen || '<=' in options;


		if( isLowerBound && isUpperBound )
		{
			let lowerBound	= options[ isLowerBoundOpen ?  '>':'>='];
			let upperBound	= options[ isUpperBoundOpen ?  '<':'<='];
			return IDBKeyRange.bound( lowerBound, upperBound, isLowerBoundOpen, isUpperBoundOpen );
		}

		if( isLowerBound )
		{
			let lowerBound	= options[ isLowerBoundOpen ? '>' : '>=' ];
			return IDBKeyRange.lowerBound( lowerBound , isLowerBoundOpen );
		}

		if( isUpperBound )
		{
			let upperBound = options[ isUpperBoundOpen ? '<' : '<=' ];
			return IDBKeyRange.upperBound( upperBound , isUpperBoundOpen );
		}

		return null;
	}

	getAllIndexesCounts( storeName )
	{
		let result = {};
		let transaction = this.database.transaction([storeName], 'readonly' );

		let store		= transaction.objectStore( storeName );

		let names = Array.from( store.indexNames );

		names.forEach( i =>
		{
			result[ i ] = this.count(storeName,{ index: i });
		});

		return promiseAll( result );
	}

	getDatabaseResume()
	{
		let indexCounts	= {};
		let storeCounts = {};

		let names = Array.from( this.database.objectStoreNames );

		names.forEach((name)=>
		{
			indexCounts[ name ] = this.getAllIndexesCounts( name );
			storeCounts[ name ] = this.count(name,{});
		});

		return promiseAll
		({
			 storeCounts: promiseAll( storeCounts )
			,indexCounts: promiseAll( indexCounts )
		})
		.then(( allCounts )=>
		{
			let result = [];
			for(let i in allCounts.storeCounts )
			{
				let item =
				{
					name: i
					,total: allCounts.storeCounts[ i ]
					,indexes: []
				};

				for(let j in allCounts.indexCounts[ i ] )
				{
					item.indexes.push
					({
						name : j
						,count : allCounts.indexCounts[ i ][ j ]
					});
				}

				result.push( item );
			}
			return Promise.resolve( result );
		});
	}

	close()
	{
		this.database.close();
	}

	restoreBackup( json_obj, ignoreErrors )
	{
		let promises = [];
		let keys = Object.keys( json_obj );

		keys.forEach((key)=>
		{
			promises.push( this.addItems( key ,json_obj[ key ], ignoreErrors ) );
		});

		return Promise.all( promises );
	}
}
