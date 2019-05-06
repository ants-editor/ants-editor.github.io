/*	new DatabaseStore(""{
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
						,{ indexName: "tags", keyPath:"tags", objectParameters: { uniq : false, multiEntry: true , locale: 'auto'  } } //age i thing it must be a array
					]
				}
			}
		});

		SchemaBuilder.create({
			user : "++id,name,age,curp,*tags"
	})
*/
export default class SchemaBuilder
{
	static create(db_name, version, obj)
	{
		let stores ={};
		for(let i in obj)
		{
			let objStore = { indexes:[] };
			let name = i;
			stores[ i ]= objStore;

			let indexes = obj[i].split(',');
			indexes.forEach((i,index)=>
			{
				let is_auto_increment = i.indexOf('++') == 0;
				let is_multi_entry		= i.indexOf('*') == 0;
				let is_compound				= i.indexOf("[") == 0;
				let is_uniq						= i.indexOf("&") == 0;

				let name = i.replace(/^\[/,'')
						.replace(/]$/,'')
						.replace(/^\+\+/,'')
						.replace(/^\*/,'')
						.replace(/^&/,'');

				console.log( name );

				if( index == 0 )
				{
					objStore.keyPath = name;
					objStore.autoIncrement = is_auto_increment;
				}
				else
				{
						objStore.indexes.push({
							indexName: name,
							keyPath: name.replace(/\+/,','),
							objectParameters:{ uniq: is_uniq, multiEntry: is_multi_entry, locale: 'auto'}
						});
				}
			})
		}
		return{
			name: db_name,
			version: version,
			stores: stores
		}
	}
}
