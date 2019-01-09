export default class Router
{
	constructor( navigation)
	{
		this.pageList	= {};
		this._counter	= 1;
		this.pagesById	= {};
		this.navigation	= navigation;
	}

	getNewId()
	{
		this._counter = this._counter+1;
		return 'Sauna_'+this._counter;
	}

	getById( id )
	{
		if( id in this.pagesById )
		{
			return this.pagesById[ id ].page;
		}
		return null;
	}

	removePageById( id )
	{
		if( id in this.pagesById )
		{
			delete this.pageList[ this.pagesById[ id ].regex ];
			delete this.pagesById[ id ];
		}
	}

	//WTF
	setPageHandler( regex, page )
	{
		if( page.getAttribute("id") === null )
		{
			page.setAttribute("id", this.getNewId() );
		}

		page.onInit();

		this.pageList[ regex ] = page;
		this.pagesById[ page.getId() ] = { page: page, regex: regex };

		//XXX commented _element is not necesary but what this is doing????
		//page._element.addEventListener('transitionend',()=>
		//{
		//	if( page._element.classList.contains('active') )
		//	{
		//		if( page != this.navigation.lastPage )
		//		{
		//			//page.onShow();
		//		 	//this.router.run( window.location.href );
		//			this.navigation.lastPage = page;
		//			this.log('PAGE_CALLED', page.getId(), 'GREEN' );
		//		}

		//		this.navigation.removeNotPrevious();
		//	}
		//});
	}

	getPage( name )
	{
		var to_run  = ()=>{ console.log('No Page handler for '+(name.toString())) };

		for (let i in this.pageList)
		{
			let regParts = i.match(/^\/(.*?)\/([gim]*)$/);

			let regexp	= regParts ? new RegExp(regParts[1], regParts[2]) : new RegExp( i );

			if( regexp.test( name ) )
			{
				return this.pageList[ i ];
			}
		}

		return new Page();
	}
	run( url )
	{
		let page = this.getPage( url );
		page.onShow( url );
	}

	log(...args)
	{
		if( this.debug )
			console.log.call(console,args);
	}
}
