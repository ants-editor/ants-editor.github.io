import Finger from './DatabaseStore.js';
import PromiseUtil from './PromiseUtils.js';

//import Util from '../depencies/Diabetes/Util.js';

export default class NoteDb
{
	constructor()
	{
		this.database	= Finger.builder('notes',20,{
			'note':'id,title,search,*tags,updated,access_count',
			'note_terms':'++id,note_id,term',
			'backup':'id'
		});

		this.database.debug = false;
	}

	updateAllNotes( notes )
	{
		return  this.database.transaction(['note','note_terms'],'readwrite',(stores,txt)=>
		{
			return stores.note_terms.clear().then(()=>
			{
				return this.database.getAll('note');
			})
			.then((notes)=>
			{
				let promises = [];
				notes.forEach(i=>promises.push(this.updateNoteStore(stores,i,i.text)));
				return Promise.all( promises );
			});
		});
	}

	syncNotes(notes)
	{
		return this.database.transaction(['note','note_terms'],'readwrite',(stores,txt)=>
		{
			let promises = [];
			notes.forEach((note)=>
			{
				if( this.debug )
					console.log('Sync info for note',note.id );
				promises.push(stores.note.get(note.id).then((n)=>
				{
					if( n )
					{
						let date = new Date( note.updated );
						if( date > n.updated )
						{
							if( this.debug )
								console.log('Updating note',n.id );

							return this.updateNoteStore(stores,n, note.text );
						}

						if( this.debug )
							console.log("nothing to do", n.id );
						return Promise.resolve( 1 );
					}
					else
					{
						if( this.debug )
							console.log('Saving note', note.id );
						return this.updateNoteStore( stores,note, note.text );
						//return this.saveNote( note.id, note.text, true );
					}
				}));
			});

			if( this.debug )
				console.log("Updating", promises.length, "notes" );

			return Promise.all( promises );
		});
	}

	init()
	{
		try{
			return this.database.init().then((isUpgrade)=>
			{
				if( isUpgrade )
					return this.updateAllNotes();
				return Promise.resolve(true);
			});
		}catch(e){console.log( e ); }
	}

	getTermsIndex( note_terms_store, term )
	{
		let tlower = term.toLowerCase();

		let bigger = tlower.toLowerCase().codePointAt( tlower.length -1 );
		let next = String.fromCodePoint( bigger+1 );
		let biggerString = tlower.substring(0, tlower.length-1 )+next;

		return note_terms_store.getAll({ index : 'term' , '>=': term.toLowerCase(), '<': biggerString }).then(( terms )=>
		{
			terms.sort((a,b)=>
			{
				if( a.position == b.position )
				{
					if( a.term == b.term )
					{
						return 0;
					}

					return a.term > b.term ? 1 : -1;
				}

				return a.position > b.position ? 1 : -1;
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
			return this.database.getAll('note',{ index :'terms' , '>=':terms[ 0 ], count: 40 }).then((notes)=>
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
		return this.database.getAll('note', { index: 'access_count',direction: "prev", count: 100 }, i=>true);
	}

	getAttachments(note_id)
	{

	}

	getNote( note_id, to_process )
	{
		if( to_process )
			return this.database.get('note',parseInt( note_id ));

		return this.database.transaction(['note'],'readwrite',(stores,txt)=>
		{
			return stores.note.get( parseInt( note_id ) ).then((note)=>
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
					stores.note.put( note ).catch((e)=>{ console.error('Error on updating note counter'); });
					return Promise.resolve( note );
				}

				return Promise.reject('Note with id ',note_id,' Wasn\'t found');
			});
		});
	}

	addNewNote(text, tags)
	{
		if( text.trim() === "" )
			return Promise.resolve(0);

		let obj = this.getNoteFromText( text );
		obj.id = Date.now();

		let terms  = this.getTerms( text );
		terms.meta_data.forEach( i=>i.note_id = obj.id );

		return this.database.transaction(['note','note_terms'],'readwrite',(stores,txt)=>
		{
			return Promise.all([
				stores.note.add( obj ),
				stores.note_terms.addAllFast( terms.meta_data )
			]);
		});
	}

	getNoteFromText( text )
	{
		let is_markdown = false;

		if( /^#+ /mg.test( text ) || /^==/mg.test( text ) )
			is_markdown = true;

		let access_count = 1;

		if( note && 'access_count' in note )
			access_count = note.access_count + 1;

		let title = text.trim().replace(/#/g,' ').split('\n')[0].trim();
		let obj = {
			text			: text
			,title			: title
			,search			: title.toLowerCase()
			,updated		: new Date()
			,is_markdown	: is_markdown
			,access_count	: 1
		};
		return obj;
	}

	updateNoteStore(stores, oldNote, text )
	{
		if( oldNote && 'text' in oldNote && oldNote.text.trim() === text )
			return Promise.resolve();

		let new_note	= this.getNoteFromText( text );
		new_note.id		= oldNote.id;

		if( 'access_count' in oldNote )
			new_note.access_count = oldNote.access_count;

		let p = Promise.resolve();

		return stores.note_terms.removeAll({ index: 'note_id','=':oldNote.id })
		.then(()=>
		{
			let terms = this.getTerms( text );
			terms.meta_data.forEach( i=>i.note_id = oldNote.id );

			console.log('Adding terms',terms.meta_data);

			return Promise.all([
				stores.note.put( new_note ),
				stores.note_terms.addAllFast(terms.meta_data )
			]);
		});
	}

	/*force if note does not exists it fails, if not exits does'n fail */
	saveNote( id, text )
	{
		return this.database.transaction(['note','note_terms'],'readwrite',(stores,txt)=>
		{
			return stores.note.get( parseInt( id ) ).then((note)=>
			{
				if( note )
				{
					if(note.text.trim() != text.trim() )
					{
						return this.updateNoteStore(stores,note,text );
					}
					return Promise.resolve( true );
				}
				return this.updateNoteStore(stores,{id:parseInt( id )}, text );
			});
		});
	}

	search( name )
	{
		return this.database.transaction(['note','note_terms'],'readonly',(stores,txt)=>
		{
			return this.getTermsIndex( stores.note_terms, name ).then((terms)=>
			{
				console.log( terms );
				let ids = terms.map( i => i.note_id );
				ids.sort();

				return stores.note.getByKeyIndex( ids ).then((notes)=>
				{
					console.log('Notes found',notes.length, ids );
					let indexes = {};
					terms.forEach( (i,index) => indexes[ i.note_id ] ={ index: index, term: i });
					let term_notes = [];

					notes.forEach((i)=>{
					    term_notes.push({ note: i, term: indexes[i.id ].term });
					});

					term_notes.sort(( a,b ) =>
					{
						if( indexes[ a.note.id ].index == indexes[ b.note.id ].index )
							return 0;

						return indexes[ a.note.id ].index > indexes[ b.note.id ].index ? 1 : -1;
					});

					return Promise.resolve( term_notes );
				});
			});
		});
	}


	getTerms( string )
	{
		let terms = [];
		let termDict = {};
		let meta_data = [];

		let allTerms = string.toLowerCase().split(/[\b;:,\\\/\-+{}\[\]\s\.`|?="*~<>]+/g);

		//let allTerms = string.toLowerCase().split(/\b/g);

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
	  	let note_id = parseInt( id );
		return this.database.transaction(['note','note_terms'],'readwrite',(stores,txt)=>
		{
			return Promise.all
			([
				stores.note.remove( note_id ),
				stores.note_terms.removeAll({ 'index':'note_id', '=': note_id })
			]);
		});
	}

	close()
	{
		this.database.close();
	}


	getAllTitles()
	{
		return this.database.getAllKeys('note',{ index :'title' }).then((keys)=>
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
				if( 'search' in n )
					delete n.search;

				if( 'title' in n )
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
