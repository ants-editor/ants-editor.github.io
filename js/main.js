import Notes from './NotesDb.js';
import Navigation from './sauna/Navigation.js';
import Util from './Util.js';
import Note from './Note.js';

//import Util from '../node_modules/diabetes/Util.js';
//import Navigation from '../node_modules/sauna-spa/js/Navigation.js';

let n = new Navigation();
n.setPageInit('all-notes');

window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
   console.log("Error occured: " + errorMsg);//or any message
    return false;
};

window.addEventListener('load',()=>
{
	console.log('load window');
	let db = new Notes();
	let note  = null;
	let list  = Util.getById('note-list');


	let renderList =(notes)=>
	{
		console.log('Rendering');
	//	console.log( notes );
		try{
		let htmlStr = notes.reduce((prev,note)=>
		{
			let title = Util.txt2html(note.title);
			let date_str = '';
			let date = '';

			if( 'created' in note )
			{
				date_str = note.created.toString();
				date = date_str.substring(0,date_str.indexOf("GMT"));
			}

			if( 'is_markdown' in note && note.is_markdown )
				return prev+`<a href="#" class="note-list-item" data-note-view="${note.id}">
					<span class="list-item-title">${title}</span>
					<span class="list-item-date">${date}</span>
				</a>`;
			else
			{
				return prev+`<a href="#" class="note-list-item" data-note-edit="${note.id}">
					<span class="list-item-title">${title}</span>
					<span class="list-item-date">${date}</span>
				</a>`;
			}
		},'');

		//console.log( htmlStr );
		list.innerHTML 	= htmlStr;
		}catch(e){ console.log( e )}

	};

	console.log('init');
	console.log('FOOOO');
	db.init().then(()=>
	{
		console.log('Init');

		console.log('getting notes');
		db.getNotes(1,20).then( renderList );

		note = new Note( n, db );
	}).catch((foo)=>{console.log(foo);});

	console.log("BAR");


	Util.delegateEvent('click',document.body,'[data-note-view]',function(evt)
	{
		Util.stopEvent( evt );
		//console.log(  this.getAttribute('data-note-id')  );
		db.getNote(  this.getAttribute('data-note-view') ).then((note)=>
		{
			var md = window.markdownit(
			{
  				html:         false,        // Enable HTML tags in source
  				xhtmlOut:     false,        // Use '/' to close single tags (<br />)
  				breaks:       false,        // Convert '\n' in paragraphs into <br>
  				langPrefix:   'language-',  // CSS language prefix for fenced blocks
  				linkify:      true,         // autoconvert URL-like texts to links
  				typographer:  true,         // Enable smartypants and other sweet transforms
  			});      // html / src / debug

			var result = md.render( note.text );
			Util.getById('preview-page-edit-button').setAttribute( 'data-note-edit',note.id );
			Util.getById('note-preview').innerHTML = result;
			n.click_anchorHash('#preview-page');
		});
	});

	Util.delegateEvent('click',document.body,'[data-note-edit]',function(evt)
	{
		Util.stopEvent( evt );
		note.setNote( this.getAttribute('data-note-edit') );
	});

	Util.getById('search-input').addEventListener('keyup',(evt)=>
	{
		db.search( evt.target.value ).then( renderList ).catch((e)=>console.log( e ));
	});

	Util.getById('all-notes').addEventListener('page-show',(evt)=>
	{
		db.getNotes(1,20).then( renderList );
	});

	Util.delegateEvent('click',document.body,'[data-navigation="back"]',()=>
	{
		window.history.back();
	});
});

