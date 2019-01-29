import Util from './Util.js';
import Page from './Page.js';
import Panel from './Panel.js';
//import Router from './Router.js';

export default class Navigation
{
	constructor()
	{
		this.history	= [];
//		this.router	= new Router( this );
	}

	getPageIdByHash( href )
	{
		let hash	= href.substring( href.indexOf('#')+1 );
		let bang	= hash.indexOf('!');

		if( bang !== -1 )
		{
			hash = hash.substring( 0, bang );
		}
		return hash;
	}

	isPageHashInHistory( hash )
	{
		let id = this.getPageIdByHash( hash );

		return this.history.some( i => id == this.getPageIdByHash( i ) );
	}

	setPageInit( pageInit )
	{
		console.log('PageInitId '+pageInit );
		let old_self = this;

		Util.delegateEvent('click',document.body,'a',function(evt)
		{

			let href = this.getAttribute('href');

			if( ! href || href === '#')
			{
				evt.preventDefault();
				return;
			}

			let hash = old_self.getPageIdByHash( href );

			var obj	= Util.getById( hash );

			if( ! obj )
			{
				console.error('Page '+hash+' Does not exists' );
				return;
			}

			evt.preventDefault();
			evt.stopImmediatePropagation();

			if( obj instanceof Page  || obj instanceof Panel )
			{
				old_self.click_anchorHash( href, false );
				Util.stopEvent( evt );
				return;
			}
		});

		window.addEventListener( 'popstate' , (evt)=>
		{
			this.pop_event( evt );
		});

		var x			= Util.getAll('sauna-page');
		var last		= Util.getById( pageInit);
		//this.lastPage	= this.router.getById( pageInit );

		last.classList.add('start','active');
		history.replaceState('#'+pageInit,"",'#'+pageInit);
		this.history	= [ window.location.hash ];
	}

	getCurrent()
	{
		let panel = Util.getFirst('sauna-panel.open');

		if( panel )
			return panel;

		return Util.getFirst('sauna-page.active');
	}

	getCurrentStateHref()
	{
		if( this.history.length > 0 )
			return this.history[ this.history.length - 1];
	}

	getActionType( href )
	{
		if( href == this.getCurrentStateHref() )
		{
			let clickElement = this.getElementByHref( href );
			if( clickElement !== null && clickElement instanceof Panel )
				return 'BACK';

			//Do nothing
			return 'NONE';
		}


		let clickElement = this.getElementByHref( href );
		let current	= this.getCurrent();

		let clickType	= this.getElementType( clickElement );
		let currentType = this.getElementType( current );

		if( clickElement === current )
		{
			return 'SAME';
		}


		if( clickType === 'NONE' )
		{
			return 'NONE';
		}


		if( currentType === 'PANEL' )
		{

			if( this.isPageHashInHistory( href ) )
			{
				return 'GO_BACK';
			}

			return 'REPLACE';
		}

		//Current IS Page

		//Panels always go back or get replaced
		if( clickType === 'PANEL' )
		{
			//If exists in history go back else replace panel by page
			return 'PUSH';
		}

		//If is not in history PUSH else POP
		return this.isPageHashInHistory( href ) ? 'GO_BACK' : 'PUSH';
	 }

	click_anchorHash( href )
	{
		let action = this.getActionType( href );

		switch( action )
		{
			case 'NONE': //Same Page
				console.error('NONE must never happen');

				return;
			case 'SAME': //Same page diferent parameters

				return;
			case 'REPLACE':
				window.history.replaceState( href, "", href );
				this.history[ this.history.length -1 ] = href;
				this.processEvent('REPLACE', href );
				this.removePreviousFromStack();
				return;
			case 'BACK': window.history.go( -1 ); return;
			case 'PUSH':
				this.history.push( href );
				window.history.pushState( href, "", href );
				this.processEvent('PUSH',href );
				this.removePreviousFromStack();
				return;
			case 'GO_BACK'	: this.goBack( href ); return;
		}
	}

	goBack( hash )
	{
		let index  = this.history.indexOf( hash )+1;
		let diff = index - this.history.length;

		history.go( diff );
	}

	pop_event( evt )
	{
		let index = this.history.indexOf( window.location.hash );

		if(  index == -1 )
		{
			//this.history.push( window.location.hash );
			//processEvent( 'PUSH',document.location.hash );
			let type = this.getActionType( document.location.hash );//This not works because href is already set, Do a new One

			if( type == 'SAME' )
			{

			}

			if( type !== 'REPLACE' && type !== 'PUSH' )
				console.error('Some nasty error on navigation');

			if( type === 'REPLACE' )
				console.log('Fix Replace on pop_event');

			this.processEvent( 'PUSH' , window.location.hash );
			this.removePreviousFromStack();
			this.history.push( window.location.hash );
		}
		else
		{
			let length = this.history.length;
			this.processEvent( 'GO_BACK', document.location.hash );
			this.removePreviousFromStack();
			this.history.splice( index+1 ,  length-index);
		}
	}

	processEvent( action, hash )
	{
		let current = this.getCurrent();
		let currentType	= this.getElementType( current );

		let next	= this.getElementByHref( hash );
		let nextType	= this.getElementType( next );

		switch( action )
		{
			case 'REPLACE':
			{
				if( currentType === 'PAGE' )
				{
					if( nextType === 'PAGE' )
					{
						this.pushPageFromPage( current, next, true );//XXX Take care of this
						return;
					}
					console.error('replace panel from page THIS MUST NEVER HAPPEN');
					return;
				}

				//Current is Panel
				if( nextType == 'PANEl' )
				{
					this.openPanelFromPanel( current, next );
					return;
				}

				//Current is panel next is page
				this.pushPageFromPanel( next , current );
				return;
			}
			case 'PUSH':
			{
				if( currentType === 'PAGE' )
				{
					if( nextType === 'PANEL' )
					{
						this.openPanelFromPage( next, current );
						return;
					}

					this.pushPageFromPage( next, current, false );
					return;
				}
				//Current is PANEL
				console.error('Push From Panel To Panel Must never happen');
				return;
			}
			case 'GO_BACK':
			{
				if( currentType === 'PAGE' )
				{
					this.popPageFromPage( current, next );
					return;
				}

				//Current is panel

				//User is responsible for how it looks
				//Pop and a left panel open it looks bad,
				//Pop and a right panel it can looks good
				if( nextType == 'PAGE' )
				{
					this.popPageFromPanel( next, current );
				}
				else
				{
					console.error('next must never be panel, this must never happen');
				}
			}
		}
	}

	pushPageFromPage( nextPageElement, currentPageElement, is_replace )
	{
		//currentPageElement.dispatchEvent(new CustomEvent('page-hide',{bubbles: false, detail:{}}));
		//nextPageElement.dispatchEvent(new CustomEvent('page-show',{bubbles: false, detail:{}}));
		this.makeTransitionPush( currentPageElement, nextPageElement, is_replace );
	}

	makeTransitionPush( current ,next, is_replace )
	{
		//XXX let currentId = current.getAttribute('id');
		//XXX let currentPage	= this.router.getById( currentId );

		//XXX if( currentPage )
		//XXX 	currentPage.onHide();

		//XXX let nextId	= next.getAttribute('id');
		//XXX let nextPage = this.router.getById( nextId );

		//XXX if( nextPage )
		//XXX 	nextPage.onShow();

		next.classList.add('noanimation');
		setTimeout(function()
		{
			next.classList.remove('previous');
			next.classList.remove('noanimation');
			next.classList.add('active');

			if( !is_replace )
				current.classList.add('previous');

			current.classList.remove('active');
		},10 );
	}

	openPanelFromPage( panel, page )
	{
		panel.classList.add('open');


		let type = panel.classList.contains('right') ? 'panel-open-right': 'panel-open-left';
		document.body.classList.add( type );

	}

	openPanelFromPanel( nextPanel, currentPanel )
	{
		currentPanel.classList.remove('open');
		nextPanel.classList.add('open');
	}

	pushPageFromPanel( pageElement , panel )
	{
		panel.classList.remove('open');
		let type = panel.classList.contains('right') ? 'panel-open-right': 'panel-open-left';
		document.body.classList.remove( type );

		var currentPage = Util.getFirst('sauna-page.active');

		if( currentPage !== pageElement )
			this.makeTransitionPush( currentPage, pageElement );
		//else
		//	this.router.run( window.location.href );
	}

	getElementByHref( href )
	{
		let clickedHashId	= href.substring( href.indexOf('#')+1 );
		let bang	= clickedHashId.indexOf('!');

		if( bang !== -1 )
		{
			clickedHashId = clickedHashId.substring( 0, bang );
		}

		return Util.getById( clickedHashId );
	}

	hasPanelActive()
	{
		var current = Util.getFirst('sauna-page.active');
		return current.classList.has('.panel');
	}

	getElementType( element )
	{
		if( element instanceof Panel )
			return 'PANEL';

		if( element instanceof Page )
			return 'PAGE';

		return 'NONE';
	}

	// Target is in History
	popPageFromPanel( pageElement, panel )
	{
		panel.classList.remove('open');

		let type = panel.classList.contains('right') ? 'panel-open-right': 'panel-open-left';
		document.body.classList.remove( type );

		var currentPage = Util.getFirst('sauna-page.active');
		if( currentPage === pageElement )
			return;

		this.makeTransitionPop( pageElement ,currentPage );
	}

	popPageFromPage( pageToPop, prevPage )
	{
		this.makeTransitionPop( prevPage ,pageToPop );
	}

	makeTransitionPop( previous ,current)
	{
		previous.classList.add('active');
		previous.classList.remove('previous');
		current.classList.remove('active');
		current.classList.remove('previous');
	}

	removePreviousFromStack()
	{
		let divs = Array.from( document.querySelectorAll('sauna-page') );

		let ids = {};

		this.history.forEach(( i ) =>
		{
			ids[ this.getPageIdByHash( i ) ] = 1;
		});

		divs.forEach((div)=>
		{
			let id = div.getAttribute('id');
			if( !(id in ids ) )
			{
				console.log('Success remove Animation');
				div.classList.add('noanimation');
				div.classList.remove('previous');
				div.classList.remove('noanimation');
			}
		});
	}
}
