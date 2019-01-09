import Util from './Util.js';
//import Util from '../node_modules/diabetes/Util.js';


export default class Note
{
	constructor(nav,notes_db)
	{
		this.debug = true;
		this.nav = nav;
		this.notes_db = notes_db;
		this.id_input = document.getElementById('note-id');
		this.textarea = document.querySelector('#note textarea');
		this.attachments = [];
		this.tags = [];
		this.edit = document.getElementById('note-edit');
		this.preview = document.getElementById('note-preview');

		Util.getById('note-delete').addEventListener('click',(evt)=>
		{
			Util.stopEvent( evt );
			Util.getById('delete-dialog').showModal();
		});


		Util.delegateEvent('click',document.body,'[data-note-new]',(evt)=>
		{
			console.log('Clicked');
			Util.stopEvent( evt );
			this.showNewNote();
		});

		Util.getById('note-preview-btn').addEventListener('click',(evt)=>
		{
			Util.stopEvent( evt );
			this.togglePreview();
		});


		Util.getById('delete-note-accept').addEventListener('click',(evt)=>
		{
			this.notes_db.deleteNote( this.id_input.value ).then(()=>
			{
				Util.getById('delete-dialog').close();
				this.textarea.value = '';
				nav.click_anchorHash('#all-notes');
			})
			.catch((e)=>
			{
				console.log( e );
				Util.getById('delete-dialog').close();
				nav.click_anchorHash('all-notes');
			});
		});

		Util.getById('delete-note-cancel').addEventListener('click',(evt)=>
		{
			Util.getById('delete-dialog').close();
		});


		Util.getById('note-close').addEventListener('click',(evt)=>
		{
			Util.stopEvent( evt );
			console.log('Saving note');
			try{
			if( this.id_input.value !== '' )
			{
				this.notes_db.saveNote(  this.id_input.value, this.textarea.value).then(()=>
				{
					console.log('Note saved');
					nav.click_anchorHash('#all-notes');
				})
				.catch((e)=>
				{
					console.error(e);
				});
			}
			else
			{
				this.notes_db.addNewNote( this.textarea.value, null, null ).then((id)=>
				{
					nav.click_anchorHash('#all-notes');
					console.log('New note added',id);
				})
				.catch((e)=>
				{
					console.error(e);
					if( e === 'Filename already exists' )
					{

					}
					else
					{

					}
				});
			}
			}catch(e){ console.log(e); }
		});
	}

	setNote(note_id)
	{
		this.notes_db.getNote( note_id ).then((note)=>
		{
			this.id_input.value = note.id;
			this.textarea.value = note.text;
			this.nav.click_anchorHash('#note');
		});
	}

	showNewNote()
	{
		this.id_input.value = "";
		this.textarea.value = "";
		this.nav.click_anchorHash('#note');
	}

	init()
	{

	}

	togglePreview()
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
		var result = md.render( this.textarea.value );
		this.preview.innerHTML = result;
		this.nav.click_anchorHash('#preview-page');
	}
}
