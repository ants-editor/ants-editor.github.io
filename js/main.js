import Notes from './NotesDb.js';
import Navigation from './sauna/js/Navigation.js';
import Util from './Util.js';
import Note from './Note.js';
import GoogleDrive from './GoogleDrive.js';
import PromiseUtils from './PromiseUtils.js';

//import Util from '../node_modules/diabetes/Util.js';
//import Navigation from '../node_modules/sauna-spa/js/Navigation.js';

let n = new Navigation();
n.setPageInit('all-notes');

window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
	 console.log("Error occured: " + errorMsg);//or any message
	return false;
};

let renderSearch = (data)=>
{
	try
	{
		let list	= Util.getById('note-list');
		let htmlStr = data.reduce((prev,search_item )=>
		{
			let note = search_item.note;
			let term = search_item.term;
			let title = Util.txt2html(note.title);
			let date_str = '';
			let date = '';

			if( 'updated' in note )
			{
				date_str = note.updated.toString();
				date = date_str.substring(0,date_str.indexOf("GMT"));
			}

			let mode = 'is_markdown' in note && note.is_markdown ? 'view' : 'edit';
			return prev+`<a href="#" class="note-list-item" data-note-${mode}="${note.id}">
					<span class="list-item-title">${title}</span>
					<span class="list-item-date">${term.term} ${date}</span>
				</a>`;
		},'');

		list.innerHTML 	= htmlStr;
		}
		catch(e)
		{
			console.error('An error occourred rendering a search',e);
		}
};

let renderList = (notes)=>
{
	try
	{
		let list	= Util.getById('note-list');
		let htmlStr = notes.reduce((prev,note)=>
		{
			let title = Util.txt2html(note.title);
			let date_str = '';
			let date = '';

			if( 'updated' in note )
			{
				date_str = note.updated.toString();
				date = date_str.substring(0,date_str.indexOf("GMT"));
			}

			let mode = 'is_markdown' in note && note.is_markdown ? 'view' : 'edit';

			return prev+`<a href="#" class="note-list-item" data-note-${mode}="${note.id}">
					<span class="list-item-title">${title}</span>
					<span class="list-item-date">${date}</span>
				</a>`;
		},'');

		list.innerHTML 	= htmlStr;
	}
	catch(e)
	{
		console.log( e );
	}
};

Util.addOnLoad(()=>
{
	console.log('load window');
	let db = new Notes();
	let note	= null;

	console.log('init');
	console.log('FOOOO');
	db.init().then(()=>
	{
		note = new Note( n, db );
		console.log('Init');
		console.log('getting notes');
		db.getNotes(1,20).then( renderList );

	})
	.catch((foo)=>
	{
		console.log(foo);
	});

	console.log("BAR");


	Util.delegateEvent('click',document.body,'[data-note-view]',function(evt)
	{
		Util.stopEvent( evt );
		//console.log(	this.getAttribute('data-note-id')	);
		db.getNote(	this.getAttribute('data-note-view') ).then((note)=>
		{
			var md = window.markdownit(
			{
					html:		 false,		// Enable HTML tags in source
					xhtmlOut:	 false,		// Use '/' to close single tags (<br />)
					breaks:		 false,		// Convert '\n' in paragraphs into <br>
					langPrefix:	 'language-',	// CSS language prefix for fenced blocks
					linkify:		true,		 // autoconvert URL-like texts to links
					typographer:	true,		 // Enable smartypants and other sweet transforms
				});		// html / src / debug

			//Replace Notes and attachments

			var result = md.render( note.text );
			Util.getById('preview-page-edit-button').setAttribute( 'data-note-edit',note.id );
			Util.getById('note-preview').innerHTML = result;
			n.click_anchorHash('#preview-page');
		});
	});

	Util.delegateEvent('click',document.body,'[data-settings]',function(evt)
	{
		Util.stopEvent( evt );
		n.click_anchorHash('#page-settings');
	});

	Util.delegateEvent('click',document.body,'[data-note-edit]',function(evt)
	{
		Util.stopEvent( evt );
		note.setNote( this.getAttribute('data-note-edit') );
	});

	Util.getById('search-input').addEventListener('keyup',(evt)=>
	{
		if( evt.target.value.toLowerCase().trim() == '' )
		{
			db.getNotes(1,20).then( renderList );
			return;
		}

		db.search( evt.target.value.toLowerCase() ).then( renderSearch ).catch((e)=>console.log( e ));
	});

	Util.getById('all-notes').addEventListener('page-show',(evt)=>
	{

		let input = Util.getById('search-input');
		if( input.value.trim() ==	'' )
			db.getNotes(1,20).then( renderList );
		else
			db.search( input.value.trim().toLowerCase() ).then( renderSearch ).catch((e)=>console.log( e ));
	});

	Util.delegateEvent('click',document.body,'[data-navigation="back"]',()=>
	{
		window.history.back();
	});

	Util.getById('page-settings-export-button').addEventListener('click',(evt)=>
	{
		Util.stopEvent( evt );

		db.getBackupUrl()
		.then((href)=>
		{
			let date = new Date();
			let btn = Util.getById('page-settings-download-button');
			btn.setAttribute('download', 'Ants_editor_backup_'+( date.toISOString().substring(0,10) )+'.json');
			btn.classList.remove('hidden');
			btn.setAttribute('href',href );
		})
		.catch((error)=>
		{
			console.log('Error',error);
			alert('An error occourred please try again');
		});
	});

	Util.getById('page-settings-download-button').addEventListener('click',(evt)=>
	{
		evt.currentTarget.classList.add('hidden');
	});

	Util.getById('page-settings-import-button').addEventListener('click',(evt)=>
	{

		Util.stopEvent( evt );

		var file	= document.getElementById("page-settings-import-file").files[0];
		var reader	= new FileReader();

		reader.readAsText(file, "UTF-8");
		reader.onload = (evt)=>
		{
			//document.getElementById("fileContents").innerHTML = evt.target.result;
			try
			{
				let obj= JSON.parse( evt.target.result );
				return db.syncNotes( obj.notes );
				//return db.syncFastNotes( obj.notes );

			}
			catch(fileerror)
			{
				console.log(fileerror );
				alert('Error in the file, please try again later');
			}
		};
	});



	const CLIENT_ID = '415517813120-0344qthv45ac2ot76kl12at6cfn8q9n2.apps.googleusercontent.com';
	const API_KEY = 'AIzaSyBGbdQuULcqCnJqoylF_Y0eA-q6-XzS_L8';

	// Array of API discovery doc URLs for APIs used by the quickstart

	// Authorization scopes required by the API; multiple scopes can be
	// included, separated by spaces.
	const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive';

	let google = new GoogleDrive(CLIENT_ID, API_KEY, SCOPES );

	Util.getById('page-settings').addEventListener('page-show',(evt)=>
	{

	});


	Util.getById('sync-donwload').addEventListener('click',(evt)=>
	{
		return db.getBackupPreferences('google-drive')
		.then((file_info )=>
		{
			if( file_info )
			{
				return Promise.resolve( file_info );
			}

			return google.listFiles('ant-backup.json').then((response)=>
			{
				if( response.result.files.length )
					{
					return db.setBackupPreferences('google-drive',response.result.files[0] ).then(()=>
					{
						return Promise.resolve( response.result.files[0] );
					});
				}

				return Promise.resolve( null );
			});
		})
		.then((file_info)=>
		{
			if( file_info === null )
				return Promise.resolve( [] );

			return google.downloadFile( file_info.id ).then((file_content)=>
			{
				try{
							return Promise.resolve( file_content.result.notes );
						}
						catch(parseException)
						{
							console.log( parseException );
							return Promise.resolve([]);
						}
					});
		})
		.then((notes)=>
		{
			if( notes.length === 0 )
				return Promise.resolve( true );

			return db.syncNotes(notes);
		})
		.then(()=>
		{
			alert('Download Success');
		})
		.catch((other)=>
		{
			if( typeof other == "string" )
				alert( other );
			else if( other.msg )
				alert( other.msg );
		});
	});

	Util.getById('sync-upload').addEventListener('click',(evt)=>
	{
		Util.stopEvent( evt );

		db.getBackupJson()
		.then((content)=>
		{
			return db.getBackupPreferences('google-drive')
			.then(( file_info )=>
			{
				if( file_info )
				{
					return google.updateFile( file_info.id, 'Ants editor backup','ant-backup.json',content,'application/json')
					.then((result)=>
					{
						console.log('Success',result);
						alert('Upload Success');
					});
				}
				else
				{
					return google.uploadFile('Ants editor backup','ant-backup.json',content,'application/json')
					.then((result)=>
					{
							console.log('Success',result);
						alert('Upload Success');
					});
				}
			});
		})
		.catch((other)=>
		{
			if( typeof other == "string" )
				alert( other );
			else if( other.msg )
					alert( other.msg );
		});
	});


	Util.getById('sync-google').addEventListener('click',(evt)=>
	{
		Util.stopEvent( evt );


		//db.getBackup().then((notes)=>
		//{
		//	console.log('Backup',notes);
		//	console.log( JSON.stringify(notes) );
		//})
		//.catch((e)=>
		//{
		//	console.log('FOOOOO',e);
		//});

		google.initClient().then((is_signed_in)=>
		{
			console.log('Client init');
			let promise = Promise.resolve(true);

			if( !is_signed_in )
				promise = google.signIn();

			return promise;
		})
		.then(()=>
		{
			return db.getBackupPreferences('google-drive');
		})
		.then((file_info )=>
		{
			if( file_info )
			{
				return Promise.resolve( file_info );
			}

			return google.listFiles('ant-backup.json').then((response)=>
			{
				if( response.result.files.length )
				{
					return db.setBackupPreferences('google-drive',response.result.files[0] ).then(()=>
					{
						return Promise.resolve( response.result.files[0] );
					});
				}

				return Promise.resolve( null );
			});
		})
		.then((file_info)=>
		{
			if( file_info === null )
				return Promise.resolve( [] );

			return google.downloadFile( file_info.id ).then((file_content)=>
			{
				try
				{
					return Promise.resolve( file_content.result.notes );
				}
				catch(parseException)
				{
					console.log( parseException );
					return Promise.resolve([]);
				}
			});
		})
		.then((notes)=>
		{
			if( notes.length === 0 )
				return Promise.resolve( true );
			//return db.syncFastNotes( notes );
			return db.syncNotes( notes );
		})
		.then(()=>
		{
			console.log("Saved Notes");
			//return google.getFileMetadata( response.result.files[0].id );
			return db.getBackupJson();
		})
		.then((content)=>
		{
			return db.getBackupPreferences('google-drive')
			.then(( file_info )=>
			{
				if( file_info )
				{
					return google.updateFile( file_info.id, 'Ants editor backup','ant-backup.json',content,'application/json')
					.then((result)=>
					{
						console.log('Success',result);
						alert('Sync Success');
					});
				}
				else
				{
					return google.uploadFile('Ants editor backup','ant-backup.json',content,'application/json')
					.then((result)=>
					{
						console.log('Success',result);
						alert('Sync Success');
					});
				}
			});
		})
		.catch((other)=>
		{
			console.log("Error",other);
			if( typeof other == "string" )
				alert( other );
			else if( other.msg )
				alert( other.msg );
		});
	});
});

