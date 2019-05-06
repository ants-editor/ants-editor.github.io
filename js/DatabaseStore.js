import ObjectStore from './ObjectStore.js';
import SchemaBuilder from './SchemaBuilder.js';

export default class DatabaseStore
{
	/*
	/*
	    name : "users"
	    ,version : 1
	    stores:
	    {
	      user : { keyPath: 'id'
	      ,autoincrement: true
	      ,indexes:
	      {
	        'name' : {keypath: 'name', objectParameters: { uniq: false, multientry
	      }
	    }

	 	new DatabaseStore(""{
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

	static builder(db_name,version, store_strings)
	{
			return new DatabaseStore( SchemaBuilder.create(db_name, version, store_strings ) );
	}

	static getDefaultSchema()
	{
		return  SchemaBuilder.create("default",1,{ keyValue: "id"})
	}

	init()
	{
		if( this.debug )
			console.log("Init with schema ",this.schema );
		return new Promise((resolve,reject)=>
		{
			let DBOpenRequest	   = window.indexedDB.open( this.schema.name || 'default', this.schema.version );

			let isAnUpgrade = false;
			DBOpenRequest.onerror   = ( evt )=>
			{
				if( this.debug )
					console.log( evt );

				reject( evt );
			};

			DBOpenRequest.onupgradeneeded	 = (evt)=>
			{
				isAnUpgrade = true;

				if( this.debug )
					console.log('Init creating stores');

				let db = evt.target.result;
				this._createSchema( evt.target.transaction, db );
			};

			DBOpenRequest.onsuccess = (e)=>
			{
				this.database	= e.target.result;
				resolve( isAnUpgrade );
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
				let indexNames = Array.from( store.indexNames );

				for( let j=0;j<store.indexNames.length;j++)
				{
					let i_name = store.indexNames.item( j );
					if( ! this.schema.stores[ storeName ].indexes.some( z=> z.indexName == i_name ) )
						toDelete.push( i_name );
				}

				while( toDelete.length )
				{
					let z = toDelete.pop();
					store.deleteIndex( z );
				}

				this._createIndexForStore( store ,this.schema.stores[ storeName ].indexes );
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

	add( storeName, item, key )
	{
		return this.transaction([storeName], 'readwrite',( stores,transaction )=>
		{
			return stores[ storeName ].add( item, key );
		});
	}

	addAll( storeName, items, insertIgnore)
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[storeName].addAll( items,insertIgnore );
		});
	}
	addAllFast( storeName, items, insertIgnore)
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[storeName].addAllFast( items,insertIgnore );
		});
	}

	clear(...theArgs)
	{
		console.log(theArgs)
		return this.transaction(theArgs,'readwrite',(stores,transaction)=>
		{
			let promises = [];
			theArgs.forEach((i)=> promises.push( stores[i].clear() ));
			return Promise.all( promises );
		});
	}

	count( storeName, options)
	{
		return this.transaction([storeName],'readonly',(stores,transaction)=>
		{
			return stores[ storeName ].count( options );
		},'Count '+storeName );
	}

	getAll( storeName, options )
	{
		return this.transaction([storeName],'readonly',(stores,transaction)=>
		{
			return stores[ storeName ].getAll( options );
		});
	}

	getAllKeys( storeName, options )
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[ storeName ].getAllKeys( options );
		},'getAllKeys '+storeName );
	}

	getByKey( storeName, list, opt )
	{
		return this.transaction([storeName],'readonly',(stores,transaction)=>
		{
			return stores[storeName].getByKey(list,opt );
		},'getByKey '+storeName);
	}

	customFilter(storeName, options, callbackFilter )
	{
		return this.transaction([storeName],'readonly',(stores,transaction)=>
		{
			return stores[storeName].customFilter( options, callbackFilter );
		},'customFilter '+storeName);
	}

	put( storeName, item, key )
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[ storeName ].put( item, key);
		},'put'+storeName );

	}

	putItems( storeName, items )
	{
		return this.updateItems(storeName, items );
	}

	update( storeName, item, key )
	{
		return this.put( storeName, item, key );
	}

	updateAll( storeName, items_array )
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[storeName].updateAll( items_array );
		},'updateItems '+storeName );
	}

	get( storeName, key )
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[ storeName ].get( key );
		},'get '+storeName );
	}


	/*
	 * if options is passed resolves to the number of elements deleted
	 */

	deleteByKeyIds(storeName, arrayOfKeyIds )
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[ storeName ].deleteByKeyIds( arrayOfKeyIds );
		},'deleteByKeyIds '+storeName );
	}

	/*
	 * if options is passed resolves to the number of elements deleted
	 */

	removeAll(storeName, options )
	{
		return this.transaction([storeName],'readwrite',(stores,transaction)=>
		{
			return stores[ storeName ].removeAll( options );
		},'removeAll '+storeName );
	}

	remove(storeName, key )
	{
		return this.transaction([storeName], 'readwrite',(stores,transaction)=>
		{
			return stores[storeName].remove( key );
		},'remove '+storeName);
	}

	getAllIndexesCounts( storeName )
	{
		return this.transaction([storeName], 'readonly',(stores,transaction)=>
		{
			return stores[storeName].getAllIndexesCounts();
		},'getAllIndexesCounts '+storeName);
	}

	getDatabaseResume()
	{
		let names = Array.from( this.database.objectStoreNames );
		return this.transaction(names,'readonly',(stores,transaction)=>
		{
			let result = {};
			let promises = [];
			Object.values( stores ).forEach(( store )=>{
				let obj = { name: store.name };
				result[ store.name ]=  obj;

				promises.push
				(
					store.getAllIndexesCounts().then(( result )=>{ obj.indexes = result; return result; })
					,store.count().then((result)=>{ obj.total = result; return result; })
				);
			});

			return Promise.all( promises ).then(()=> result);
		});
	}

	close()
	{
		this.	database.close();
	}

	restoreBackup( json_obj, ignoreErrors )
	{
		let names = Array.from( this.database.objectStoreNames );
		return this.transaction(names,'readwrite',(stores,transaction)=>
		{
			let promises = [];
			let keys = Object.keys( json_obj );

			keys.forEach((i)=>
			{
				if( i in stores )
					promise.push( stores.addAllFast( json_obj[ i ], ignoreErrors ).then(()=>true));
			});

			return Promise.all( promises );
		});
	}

	__serialize(obj)
	{
		if( obj instanceof Blob )
		{
			return new Promise((resolve,reject)=>
			{
				var reader = new FileReader();
 				reader.readAsDataURL(blob);
 				reader.onloadend = function() {
 				    resolve({ type: "blob" , data: reader.result });
 				};
			});
		}

		return Promise.resolve( obj );
	}

	createBackup()
	{
		let names = Array.from( this.database.objectStoreNames );
		return this.transaction(names,'readonly',(stores,transaction)=>
		{
			let result = {};
			let promises = [];
			Object.values( stores ).forEach(( store )=>{
				promises.push
				(
					store.getBackup().then(( store_result )=>{
						result[ store.name ]  = store_result;
						return true;
					})
				);
			});
			return Promise.all( promises ).then(()=>result);
		});
	}

	transaction(store_names,mode,callback,txt_name)
	{
		store_names.forEach((i)=>{
			if( !this.database.objectStoreNames.contains( i ) )
				throw 'Store "'+i+' doesn\'t exists';
		});

		let txt = this.database.transaction( store_names, mode );

		let promise_txt = new Promise((resolve,reject)=>
		{
			txt.onerror = (evt)=>
			{
				if( this.debug )
					console.log('Transaction '+(txt_name ? txt_name : mode )+': error', evt );

				if( 'stack' in evt )
					console.log( evt.stack );


				reject( evt );
			};

			txt.oncomplete = (evt)=>
			{
				if( this.debug )
					console.log('Transaction '+(txt_name ? txt_name : mode )+': complete', evt );
				resolve();
			};
		});

		let stores = { };

		store_names.forEach((i)=>
		{
			stores[ i ] = new ObjectStore( txt.objectStore( i ) );
			stores[ i ].debug = this.debug;
		});

		let result = callback( stores,txt );

		return Promise.all([ result, promise_txt ]).then( r=>r[0] );
	}
}
