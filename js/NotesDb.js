import Finger from './DatabaseStore.js';

//import Util from '../depencies/Diabetes/Util.js';

export default class NoteDb
{
	constructor()
	{
		this.database	= new Finger
		({
			name		: 'notes',
			version	: 7,
			stores		:{
				note:
				{
					keyPath	: 'id',
					autoincrement: false,
					indexes	:
					[
						{ indexName: 'filename', keyPath: 'filename', objectParameters: { uniq: true, multiEntry: false }},
						{ indexName: 'search', keyPath: 'search', objectParameters: { uniq: false, multiEntry: false }},
						{ indexName: 'tags' ,keyPath:'tags'	,objectParameters: { uniq: false ,multiEntry: true} },
						{ indexName: 'updated', keyPath:'updated', objectParameters:{ uniq: false, multiEntry: false}}
					]
				},
				attachement:
				{
					keyPath	: 'id',
					autoincrement: false,
					indexes	:
					[
						{ indexName: 'filename', keypath: 'filename', objectParameters: {uniq: true, multiEntry: false }},
						{ indexName: 'note_id', keypath: 'filename', objectParameters:{ uniq: false, multiEntry: false}},
						{ indexName: 'updated', keypath: 'created', objectParameters:{ uniq: false, multiEntry: false}}
					]
				}
			}
		});
		this.database.debug = true;
	}

	init()
	{
		try{
			this.database.debug = true;
		return this.database.init();
		}catch(e){console.log( e ); }
	}

	getNotes(start, limit)
	{
		//return this.database.getAll('note',{ start: start, count: 20 });
		return this.database.customFilter('note', { index: 'updated',direction: "prev", count: 20 }, i=> true);
	}

	getNote(note_id)
	{
		return this.database.get('note',parseInt( note_id ));
	}

	addNewNote(text, tags)
	{
		if( text.trim() === "" )
			return Promise.resolve(0);

		//let title = text.trim().split('\n')[0];
		let title = text.trim().replace(/#/g,' ').split('\n')[0].trim();

		return this.database.addItem('note',null,{id: Date.now(), text: text, tags: tags, title: title, search: title.toLowerCase(), updated: new Date()});
	}

	search(name)
	{
		if( name === "" )
			return this.database.getAll('note',{ count: 20});

		return this.database.getAll('note',{ index: 'search', '>=': name, count: 20});
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

			let title = text.trim().replace(/#/g,' ').split('\n')[0].trim();

			let obj = { id: parseInt(id), text: text, title: title, search: title.toLowerCase(), is_markdown: is_markdown, updated: new Date()};

			return this.database.put('note', obj );
		});
	}

	deleteNote(id)
	{
		return this.database.remove('note', parseInt(id ) );
	}

	close()
	{
		this.database.close();
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

        	var blob = new Blob([typeof object === 'string' ? notes : JSON.stringify( object, null, 2)], {type :  ctype });
        	let objectURL = URL.createObjectURL( blob );
        	return resolve( objectURL );
		});
	}
}
