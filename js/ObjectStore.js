import OptionsUtils from './OptionsUtils.js';

export default class ObjectStore
{
	constructor(idbStore)
	{
		this.store = idbStore;
		this.debug = false;
		this.name = idbStore.name;
	}

	add( item, key )
	{
		return new Promise((resolve,reject)=>{
			let request = key ? this.store.add( item, key ) : this.store.add( item );

			request.onsuccess = (evt)=>
			{
				if( this.debug )
					console.log('AddItem('+this.name+' key:'+key+' item:'+JSON.stringify( item )+' Request Success', evt );

				resolve( evt.target.result );
			};

			request.onerror = (evt)=>
			{
				if( this.debug )
					console.log('AddItem('+this.name+' key:'+key+' item:'+JSON.stringify( item )+' Request Error ', evt);

				reject( evt );
			};
		});
	}

	addAll(items,insertIgnore)
	{
		let count = items.length;
		return new Promise((resolve,reject)=>
		{
			let added_items = [];

			let error_handler = (evt)=>
			{
				if( insertIgnore )
				{
					evt.preventDefault();
					evt.stopPropagation();
					count--;
					if( count == 0 )
						resolve( added_items );
					return;

				}
				reject(evt);

				if( this.debug )
					console.log('AddItems '+this.name+' Request Fail ', evt );
			};

			items.forEach((i)=>
			{
				let request = this.store.add( i );
				request.onerror = error_handler;
				request.onsuccess = (generated_id)=>
				{
					added_items.push( request.result );
					count--;
					if( count == 0 )
						resolve( added_items );
				};
			});
		});
	}

	addAllFast( items, insertIgnore )
	{
		if( !insertIgnore )
		{
			items.forEach( i => this.store.add( i ) );
			return Promise.resolve();
		}

		let error_handler = (evt)=>
		{
			evt.preventDefault();
			evt.stopPropagation();
		};

		items.forEach((i)=>
		{
			let request =	this.store.add( i );
			request.onerror = error_handler;
		});

		return Promise.resolve();
	}

	clear()
	{
		return new Promise((resolve,reject)=>
		{
				let request = this.store.clear();
				request.onsuccess = resolve;
				request.onerror = reject;
		});
	}

	count(options)
	{
		return new Promise((resolve,reject)=>
		{
			let queryObject = options && 'index' in options
				? this.store.index( options.index )
				: this.store;

			let range		= OptionsUtils.getKeyRange( options );
			let request = queryObject.count( range );

			request.onerror = reject;
			request.onsuccess = (evt)=>
			{
				resolve( request.result );
			};
		});
	}

	get( key )
	{
		return new Promise((resolve,reject)=>
		{
			if( this.debug )
			{
				console.log("Store name", this.name );
			}

			let request = this.store.get( key );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};
		});
	}

	getAll( options,customFilter )
	{
		if( customFilter )
			return this.getAllWithCustomFilter(options,customFilter);

		return new Promise((resolve,reject)=>
		{
			let queryObject = options && 'index' in options
				? this.store.index( options.index )
				: this.store;

			let range		= OptionsUtils.getKeyRange( options );
			let count		= OptionsUtils.getCount( options );

			let request	= ( range == null && count == 0 )
					? queryObject.getAll()
					: queryObject.getAll( range, count );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};

			request.onerror = reject;
		});
	}

	getAllPrimaryKeys(options,customFilter)
	{
		if( customFilter )
			this.getAllPrimaryKeysWithCustomFilter( options, customFilter );
		return new Promise((resolve,reject)=>
		{


		});
	}

	getAllWithCustomFilter( options, callbackFilter )
	{
		return new Promise((resolve,reject)=>
		{
			let queryObject = options && 'index' in options
				? this.store.index( options.index )
				: this.store;

			let range		= OptionsUtils.getKeyRange( options );
			let direction	= OptionsUtils.getDirection( options );
			let request		= queryObject.openCursor( range, direction );

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

	getAllIndexesCounts()
	{
		return new Promise((resolve,reject)=>
		{
			let result 	= {};
			let names 	= Array.from( this.store.indexNames );

			if( names.length == 0 )
			{
				resolve(result);
				return;
			}

			let counter = names.length;
			if( this.debug )
				console.log('Get all index count for '+this.name );
			names.forEach( i =>
			{
				let index = this.store.index( i );
				let request = index.count();
				request.onerror = reject;
				request.onsuccess = (evt)=>
				{
					if( this.debug )
						console.log('Success Count for '+i );
					result[ i ] = request.result;
					counter--;
					if( counter == 0 )
						resolve( result );
				};
			});
		});
	}

	getAllKeys(options)
	{
		return new Promise((resolve,reject)=>
		{
			let queryObject = options && 'index' in options
				? this.store.index( options.index )
				: this.store;

			let range		= OptionsUtils.getKeyRange( options );
			let count		= OptionsUtils.getCount( options );

			let request	= ( range == null && count == 0 )
					? queryObject.getAllKeys()
					: queryObject.getAllKeys( range, count );

			request.onsuccess = ()=>
			{
				resolve( request.result );
			};

			request.onerror = reject;
		});
	}

	getBackup()
	{
		return new Promise((resolve,reject)=>
		{
			let result 	= [];
			let store	= transaction.objectStore( storeName );
			let request = store.openCursor();

			request.onerror = reject;
			request.onsuccess = (evt)=>
			{
				if( evt.target.result )
				{
					result.push(	evt.target.result.value );
					evt.target.result.continue();
				}
				else
				{
					//Maybe call resolve
					resolve( result );
				}
			};
		});
	}

	remove( key )
	{
		return new Promise((resolve,reject)=>
		{
			let request = this.store.delete( key );
			request.onsuccess = resolve;
			request.onerror = reject;
		});
	}

	/*
	 * if options is passed resolves to the number of elements deleted
	 */
	removeAll( options )
	{
		if( options && 'index' in options )
		{
			return this.removeByIndex( options );
		}

		return new Promise((resolve,reject)=>
		{
			let range		= OptionsUtils.getKeyRange( options );
			let request = this.store.delete( range );
			request.onsuccess = (evt)=>{
					resolve(request); //TODO Check how many deleted
			};
			request.onerror = reject;
		});
	}

	removeByIndex(options)
	{
		return new Promise((resolve,reject)=>
		{
			let index = this.store.index( options.index );
			let range = OptionsUtils.getKeyRange( options );
			let request = index.openCursor(range);
			let count = 0;

			request.onsuccess = (evt)=>
			{
				let cursor = evt.target.result;
				if( cursor )
				{
					cursor.delete();
					count++;
					cursor.continue();
				}
				else
				{
					resolve( count );
				}
			};
			request.onerror = reject;
		});
	}

	removeByKeyList(list, opt )
	{
		let orderedKeyList = list.slice(0);
		let options = opt ? opt : {};

		return new Promise((resolve,reject)=>
		{
			let queryObject = options && 'index' in options
				? this.store.index( option.index )
				: this.store;

			let count 	= 0;
			let range		= OptionsUtils.getKeyRange( options );
			let items		= [];
			let i 			= 0;
			let cursorReq = queryObject.openCursor( range );

			cursorReq.onsuccess = (event)=>
			{
				var cursor = event.target.result;

				if (!cursor)
				{
					resolve( count );
					return;
				}

				while (key > orderedKeyList[i])
				{
					++i;
					if (i === orderedKeyList.length)
					{
						resolve( count );
						return;
					}
				}
				if (key === orderedKeyList[i])
				{
					count++;
					cursor.delete();
					cursor.continue();
				}
				else
				{
					cursor.continue(orderedKeyList[i]);
				}
			};
		});
	}

	removeByKeyIds2(arrayOfKeyIds )
	{
		return new Promise((resolve,reject)=>
		{
			let total = arrayOfKeyIds.length;
			let count = 0;
			let success = ()=>{
				count++;
				total--;
				if( total == 0 )
					resolve( count );
			};
			let error = (evt)=>
			{
				evt.prefentDefault();
				evt.stopPropagation();
				if( total == 0 )
					resolve( count );
			};

			arrayOfKeyIds.forEach((key)=>
			{
				let request = store.delete( key );
				request.success = success;
				request.onerror = error;
			});
		});
	}

	getByKeyIndex(list,opt)
	{
		let orderedKeyList = list.slice(0);
		let options = opt ? opt : {};

		return new Promise((resolve,reject)=>
		{
			let queryObject = options && 'index' in options
				? this.store.index( option.index )
				: this.store;

			let range		= OptionsUtils.getKeyRange( options );
			let items		= [];

			var i = 0;
			var cursorReq = queryObject == this.store
				? this.store.openCursor( range )
				: queryObject.openKeyCursor();

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

	put( item, key )
	{
		return new Promise((resolve,reject)=>
		{
			let request = key ? this.store.put( item, key ) : this.store.put( item );

			request.onsuccess = (evt)=>
			{
				if( this.debug )
					console.log('Put Item('+this.name+' key:'+key+' item:'+JSON.stringify( item )+' Request Success', evt );
				resolve(evt.target.result);
			};

			request.onerror = (evt)=>
			{
				if( this.debug )
					console.log('Put Item('+this.name+' key:'+key+' item:'+JSON.stringify( item )+' Request Error ', evt);

				reject( evt );
			};
		});
	}
	/*
	updateItems(items)
	{
		return new Promise((resolve,reject)=>
		{
			let counter = items.length;
			let handler = (evt)=>{
				counter--;
				if( counter == 0 )
					resolve();
			};
			//console.log('Updating', items)
			items.forEach((i)=>{
			let request = this.store.put(i);
				request.onsuccess = handler;
				request.onerror = reject;
			});
		});
	}
	*/

	update( item, key )
	{
		return new Promise((resolve,reject)=>
		{
			let request = key === undefined ? this.store.put( item ) : this.store.put( item,key);
			request.success = resolve;
			request.success = reject;
		});
	}
	updateAll(items)
	{
		let promises = [];
		items.forEach(i=>{
			promises.push(new Promise((resolve,reject)=>
			{
				let request = this.store.put( i );
				request.onsuccess = resolve;
				request.onerror = reject;
			}));
		});
		return Promise.all( promises );
	}
}
