import Finger from './DatabaseStore.js';
import PromiseUtil from './PromiseUtils.js';

//import Util from '../depencies/Diabetes/Util.js';

export default class NoteDb
{
	constructor()
	{
		this.database	= new Finger
		({
			name		: 'notes',
			version	: 10,
			stores		:{
				note:
				{
					keyPath	: 'id',
					autoincrement: false,
					indexes	:
					[
						{ indexName: 'title', keyPath: 'title', objectParameters: { uniq: true, multiEntry: false }},
						{ indexName: 'search', keyPath: 'search', objectParameters: { uniq: false, multiEntry: false }},
						{ indexName: 'tags' ,keyPath:'tags'	,objectParameters: { uniq: false ,multiEntry: true} },
						{ indexName: 'updated', keyPath:'updated', objectParameters:{ uniq: false, multiEntry: false}},
						{ indexName: 'access_count', keyPath:'access_count', objectParameters:{ uniq: false, multiEntry: false}},
					]
				},
				note_terms:
				{
					keyPath: 'id',
					autoIncrement: true,
					indexes :
					[
						{ indexName: 'note_id', keyPath: 'note_id', objectParameters : { uniq: false, multiEntry: false }},
						{ indexName: 'term', keyPath: 'term', objectParameters: { uniq: false, multiEntry: false } }
					]
				},
				backup:
				{
					keyPath : 'id',
					autoincrement: false,
					indexes :[ ]
				},
				attachement:
				{
					keyPath	: 'id',
					autoincrement: false,
					indexes	:
					[
						{ indexName: 'filename', keypath: 'filename', objectParameters: {uniq: false, multiEntry: false }},
						{ indexName: 'note_id', keypath: 'filename', objectParameters:{ uniq: false, multiEntry: false}},
						{ indexName: 'updated', keypath: 'updated', objectParameters:{ uniq: false, multiEntry: false}}
					]
				},
				todo:
				{
					keyPath	: 'id',
					autoincrement: false,
					indexes	:
					[
						{ indexName: 'status', keypath: 'status', objectParameters: {uniq: false, multiEntry: false }},
						{ indexName: 'note', keypath: 'note', objectParameters:{ uniq: false, multiEntry: false}},
						{ indexName: 'updated', keypath: 'created', objectParameters:{ uniq: false, multiEntry: false}}
					]
				}
			}
		});
		this.database.debug = true;
	}

	updateAllNotes( notes )
	{
		return this.database.getAll('note',{}).then((notes)=>
		{
			let generator = (note)=>
			{
				return this.saveNote( note.id, note.text, true );
			};
			return PromiseUtil.runSequential( notes, generator );
		});
	}

	init()
	{
		try{
			this.database.debug = true;
			return this.database.init().then(()=>
			{
				return Promise.resolve(true);
				//return this.updateAllNotes();
			});
		}catch(e){console.log( e ); }
	}

	getTermsIndex( term )
	{
		let bigger = term.toLowerCase().codePointAt( 0 );
		let next = String.fromCodePoint( bigger+1 );

		return this.database.getAll('note_terms',{ index : 'term' , '>=': term.toLowerCase(), '<': next }).then(( terms )=>
		{
			terms.sort((a,b)=>
			{
				if( a.term == b.term )
				{
					if( a.position == b.position )
					{
						return 0;
					}

					return a.position > b.position ? 1 : -1;
				}

				return a.term > b.term ? 1 : -1;
			});

			let keys = {};

			let finalResult = terms.filter((a) =>{

				if( a.note_id in keys )
					return false;

				keys[ a.note_id ] = true;
				return true;
			});

			return Promise.resolve( finalResult );
		});
	}

	searchNote( term_string )
	{
		let terms = this.getTerms();

		if( terms.length == 0 )
			return Promise.resolve([]);

		terms.terms.sort( (a,b)=> (a==b)? 0:( a<b?-1:1) );

		if( terms.length > 1 )
		{
			return this.database.getByKey('note',terms.terms,{ index :'terms' }).then((notes)=>
			{
				keys.sort((a,b)=>
				{
					let a_pow 	= 1;
					let b_pow	= 1;
					let a_sum	= 0;
					let b_sum   = 0;

					terms.forEach((i,index)=>
					{
						if( i in a.terms_data )
						{
							a_pow *= 2;
							if( a.terms_data[ i ] < 100)
								a_sum  += 100 - a.terms_data[i];
						}

						if( i in b.terms_data )
						{
							b_pow *= 2;

							if( b.terms_data[ i ] < 100)
								b_sum += 100 -  b.terms_data[i];
						}
					});


					let b_total = b_pow + b_sum;
					let a_total = a_pow + a_sum;

					if( a_pow == b_pow )
						return 0;

					return a_pow > b_pow ? -1 : 1;
				});

				return Promise.resolve( keys );
			});
		}
		else
		{
			return this.database.getAll('notes',{ index :'terms' , '>=':terms[ 0 ], count: 40 }).then((notes)=>
			{
				notes.sort((a,b)=>
				{
					let akeys = Object.keys( a.terms_data );
					let bkeys = Object.keys( b.terms_data );
					let a_term = akeys.some( k=> k.indexOf( terms[ 0 ] ) > -1 );
					let b_term = bkeys.some( k=> k.indexOf( terms[ 0 ] ) > -1 );

					if( a.terms_data[ a_term ] == b.terms_data[ b_term ] )
						return 0;

					return a.terms_data[ a_term ] > b.terms_data[ b_term ] ? 1 : -1;
				});
				return Promise.resolve( notes );
			});
		}
	}

	getNotes(start, limit)
	{
		//return this.database.getAll('note',{ start: start, count: 20 });
		return this.database.customFilter('note', { index: 'access_count',direction: "prev", count: 100 }, i=> true);
	}

	getAttachments(note_id)
	{

	}

	getNote( note_id, to_process )
	{
		if( to_process )
			return this.database.get('note',parseInt( note_id ));
		else
			return this.database.get('note',parseInt( note_id ) ).then((note)=>
			{
				if( note )
			{
				if( 'access_count' in note )
				{
					note.access_count++;
				}
				else
				{
					note.access_count = 1;
				}

				this.database.put('note', note ).catch((e)=>{ console.log( e ); });
				}

				return Promise.resolve( note );
			});
	}

	addNewNote(text, tags)
	{
		if( text.trim() === "" )
			return Promise.resolve(0);

		//let title = text.trim().split('\n')[0];
		let title = text.trim().replace(/#/g,' ').split('\n')[0].trim();

		let is_markdown = false;

		if( /^#+ /mg.test( text ) || /^==/mg.test( text ) )
			is_markdown = true;

		let obj = {
			id		: Date.now(),
			text	: text,
			title	: title,
			search	: title.toLowerCase(),
			tags	: tags,
			updated	: new Date(),
			is_markdown		: is_markdown,
			//terms_data		: terms.data,
			access_count	: 1
		};
		return this.database.addItem('note',null, obj ).then((new_note)=>
	{
			let terms = this.getTerms( text );
			terms.meta_data.forEach(i=>i.note_id = new_note.id );
			return this.database.addItems( 'note_terms',  terms.meta_data ).then(()=>
			{
				return new_note;
			});
		});
	}

	saveNote(id, text, force )
	{
		let promise = Promise.resolve( null );

		if( !force )
			promise = this.getNote( id );

		return promise.then((note)=>
		{
			if( note && note.text ==  text )
				return Promise.resolve(0);

			if( text.trim() === "" )
				return Promise.resolve(0);

			let is_markdown = false;

			if( /^#+ /mg.test( text ) || /^==/mg.test( text ) )
				is_markdown = true;

			let access_count = 1;

			if( note && 'access_count' in note )
				access_count = note.access_count + 1;

			let title = text.trim().replace(/#/g,' ').split('\n')[0].trim();
			let obj = {
				id		: parseInt(id),
				text	: text,
				title	: title,
				search	: title.toLowerCase(),
				updated	: new Date(),
				is_markdown	: is_markdown,
				access_count	: access_count
			};

			return this.database.put('note', obj ).then((result)=>
			{
				return this.database.removeAll('note_terms',{ index: 'note_id','=': obj.id });
			})
			.then(()=>
			{
				let terms = this.getTerms( text );
				terms.meta_data.forEach((i)=>i.note_id = obj.id);
				return this.database.addItems( 'note_terms', terms.meta_data );
		});
		});
	}

	search(name)
	{
		//if( name === "" )
		//	return this.database.getAll('note',{ count: 20});

		return this.getTermsIndex( name ).then((terms)=>{

			console.log( terms );
			let ids = terms.map( i => i.note_id );
			ids.sort();
			return this.database.getByKey('note',ids).then((notes)=>
			{
				let indexes = {};
				terms.forEach( (i,index) => indexes[ i.note_id ] = index );
				notes.sort(( a,b ) =>
				{
					return indexes[ a.id ] > indexes[ b.id ] ? 1 : -1;
				});
				return Promise.resolve( notes );
			});
		});
	}

	getTerms( string )
	{
		let terms = [];
		let termDict = {};
		let meta_data = [];
		let allTerms = string.toLowerCase().split(/[;:,\\\/\-+{}\[\]\s\.`|?=]+/g);

		allTerms.forEach((word)=>
		{
			if( word == '' )
				return;

			if( /^#+$/.test( word ) )
				return;

			if( word in termDict )
				return;

			meta_data.push({ term : word, position: terms.length });
			terms.push( word );
			termDict[ word ] = true;
		});

		return { terms: terms, meta_data: meta_data };
	}

	deleteNote(id)
	{
		return this.database.remove('note', parseInt(id ) );
	}

	close()
	{
		this.database.close();
	}


	getAllTitles()
	{
		return this.database.getAllKeys('notes',{ index :'title' }).then((keys)=>
		{
			keys.sort((a,b)=>
			{
				if( a.length == b.length )
					return 0;

				return a.length > b.length ? -1 : 1;
			});

			return Promise.resolve( keys );
		});
	}

	getBackup()
	{
		return this.database.getAll('note').then((notes)=>
		{
			notes.forEach((n)=>
			{
				delete n.search;
				delete n.title;
			});

			return Promise.resolve({ notes:  notes });
		});
	}

	getBackupJson()
	{
		return this.getBackup().then((notes)=>
		{
			return Promise.resolve(JSON.stringify( notes ) );
		});
	}

	getBackupUrl()
	{
		return this.getBackupJson().then((notesJson)=>
		{
			return this.getDownloadHref( notesJson, 'application/json');
		});
	}

	getDownloadHref( object, contentType )
    {
		return  new Promise((resolve,reject)=>
		{
			let ctype = contentType ? contentType : 'application/json';

        	var blob = new Blob([typeof object === "string" ? object : JSON.stringify( object, null, 2)], {type :  ctype });
        	let objectURL = URL.createObjectURL( blob );
        	return resolve( objectURL );
		});
	}

	setBackupPreferences( id, obj )
	{
		return this.database.put('backup',{ id: id, object: obj });
	}
	getBackupPreferences( id )
	{
		return this.database.get('backup', id ).then( preferences => preferences ? preferences.object: undefined );
	}
}
