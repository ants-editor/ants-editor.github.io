export default class Util
{
	static addOnLoad(callback)
	{
		window.addEventListener('load', callback );
	}

	static getById( selector )
	{
		return document.getElementById( selector );
	}

	static getFirst( selector )
	{
		return document.querySelector( selector );
	}

	static getAll(selector)
	{
		return document.querySelectorAll( selector );
	}

	static stopEvent( evt )
	{
		evt.stopPropagation();
		evt.preventDefault();
	}

	static quoteattr(s, preserveCR)
	{
		let pCR = preserveCR ? '&#13;' : '\n';
		return ('' + s) /* Forces the conversion to string. */
			.replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
			.replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
			.replace(/"/g, '&quot;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			/*
			 * 	You may add other replacements here for HTML only
			 * 	(but it's not necessary).
			 * 	Or for XML, only if the named entities are defined in its DTD.
			 */
			.replace(/\r\n/g, pCR) /* Must be before the next replacement. */
			.replace(/[\r\n]/g, pCR);
	}

	static fireChangeEvent(selector)
	{
		let element		= document.querySelector( selector );

		let cevent  	= new Event('change',{ bubbles: true, cancelable: false });
		cevent.target	= element;
		element.dispatchEvent( cevent );
		//dispatchInputEvent( element );
	}

	static fireInputEvent(selector)
	{
		var input = document.querySelector( selector );

		if( input === null )
		{
			console.error('Selector doesnt exists');
			return;
		}

		var inputEvent = new Event('input',
		{
			"bubbles" 		: true
			,"cancelable" 	: false
			,"composed"		: false
		});

		input.dispatchEvent( inputEvent );
	}

	static txt2html( h )
	{
		return this.text2html( h );
	}
	static text2html( h )
	{
			var s = document.createElement('span');
			s.textContent = h;
			return s.innerHTML.replace(/\n/g,'<br>');
	}

	/**
	getPagination
	({
		   	totalRows		   : parameters.data.data.total
		   	,rowsPerPage		: 10
		   	,currentPage		: page
		   	,link_format		: '<a href="/galleryAlbum.html?id='+id+'&page=PAGE_NUMBER">PAGE_TITLE</a>'
		   	,current_page_format: '<a href="#" class="active">PAGE_TITLE</a>'
		   	,nextTitle		  : '&gt;&gt;'
		   	,prevTitle		  : '&lt;&lt;'
		   	,disable_next_format: '<a href="#">PAGE_TITLE</a>'
		   	,disable_prev_format: '<a href="#">PAGE_TITLE</a>'
	});
	*/
	static getPagination( obj )
	{
		var nav		= '';
		var prev	= '';
		var next	= '';
		var page	= '';

		var pageNum = parseInt( obj.currentPage, 10);
		var maxPage = Math.ceil( parseInt( obj.totalRows, 10 )/ obj.rowsPerPage );
		var offset  = ( pageNum - 1) * parseInt( obj.rowsPerPage , 10) ;
		var search  = ['PAGE_NUMBER','PAGE_TITLE'];

		var start   = 0;
		var end	 = 5;

		if( pageNum > 5 )
		{
			start = pageNum - 5;

			if( (maxPage-pageNum) < 5 && maxPage >= 10 )
			{
				start = maxPage - 10;
			}

			if(pageNum < maxPage)
			{
				var nextPages = maxPage - pageNum;
				end	   = nextPages > 5 ? pageNum+5 : pageNum+nextPages;
			}
			else
				end = maxPage;
		}
		else
		{
			start = 0;
			end   = maxPage<10 ? maxPage : 11;
		}

		for(page=start; page <end; page++)
		{
			//replace = array(page,page);
			var format  = page == pageNum ? obj.current_page_format : obj.link_format;
			nav	+= format.split( 'PAGE_NUMBER' ).join( page ).split( 'PAGE_TITLE' ).join( (page+1) );
			//str_replace( search, replace , format );
		}
		if (pageNum > 0)
		{
			page = (pageNum - 1);
			prev = obj.link_format.split( 'PAGE_NUMBER').join( page ).split( 'PAGE_TITLE' ).join( obj.prevTitle );
			//str_replace( search ,array(page,"Previous"), link_format );
		}
		else
		{
			// we're on page one, don't print previous link
			prev = obj.disable_prev_format.split( 'PAGE_TITLE' ).join( obj.prevTitle );
		}

		if (pageNum < maxPage-1)
		{
			page = (pageNum + 1);
			next = obj.link_format.split( 'PAGE_NUMBER').join( page ).split( 'PAGE_TITLE' ).join( obj.nextTitle );
			//str_replace(search,array(page,"Next"),link_format);
		}
		else
		{
			//next = ''; // we're on the last page, don't print next link
			next = obj.disable_next_format.split( 'PAGE_TITLE' ).join( obj.nextTitle );
		}

		if(maxPage != 1)
			return prev + nav + next;

		return '';
	}

	static form2Object(form)
	{
		if( !form  || !form.elements )
			return {};

		var formObject	= {};

		var checks		= ['checkbox', 'radio'];
		for(var i=0;i<form.elements.length;i++)
		{
			var el	= form.elements[ i ];
			var key = el.name;

			// if an element has no name, it wouldn't be sent to the server
			if ( !key )
				continue;

			if (['file', 'reset', 'submit', 'button'].indexOf(el.type) > -1)
				continue;

			if ( checks.indexOf( el.type ) > -1 && !el.checked)
				continue;

			if (/\[\]$/.test( key ))
			{
				key = key.slice( 0 ,-2 );
				// if using array notation, go ahead and put the first value into an array.
				if( formObject[ key ] === undefined )
				{
					formObject[ key ] = [];
				}
			}

			if (formObject[ key ] === undefined )
			{
				formObject[ key ] = el.value;
			}
			else if ( formObject[ key ] instanceof Array )
			{
				formObject[ key ].push( el.value );
			}
			else //If is not indefined and not is array, turns the value into array
			{
				formObject[ key ] = [ formObject[ key ], el.value ];
			}
		}
		return formObject;
	}

	static object2form( formObject, form )
	{
		var checks = ['checkbox','radio'];

		for( var i in formObject )
		{
			if( formObject[ i ] instanceof Array  )
			{
				//TODO
				var elements = form.querySelectorAll('[name="'+i+'"]');

				if( elements.length !== 0 )
				{
					elements = form.querySelectorAll('[name="'+i+'[]"]'); //Investigate this

					if( elements.length === 0 )
						continue;

					if( checks.indexOf( elements[ 0 ].type ) > -1  )
					{
						elements[ 0 ].checked = true;
					}

				}
				else
				{
					elements = form.querySelectorAll('[name="'+i+'[]"]'); //Investigate this

					if( elements.length === 0 )
						continue;

					if( checks.indexOf( elements[ 0 ].type ) > -1  )
					{
						elements[ 0 ].checked = true;
					}
					else
						elements[ 0 ].checked = true;
				}
			}
			else
			{
				var element = form.querySelector('[name="'+i+'"][value="'+formObject[ i ]+'"]');

				if( !element )
					element = form.querySelector('[name="'+i+'"]');

				if( element )
				{
					if( checks.indexOf( element.type  ) == -1 )
					{
						element.value = formObject[ i ];
					}
					else
					{
						element.checked = formObject[ i ];
					}
				}
			}
		}
	}

	static checkFormNativeValidation( form )
	{
		if( !form.checkValidity() )
		{
			if( /iPad|iPhone|iPod/.test(navigator.platform) )
			{
				var required = form.querySelectorAll( '[required]' );

				for( var i=0; i<required.length; i++ )
				{
					required[ i ].classList.remove('s_invalid');

					if( required[ i ].webkitMatchesSelector(':invalid') )
					{
						required[ i ].classList.add('s_invalid');
						var element = required[ i ];
						var msg		= required[ i ].getAttribute('data-error-msg') || 'Please verify your data';

						this.alert( msg,()=>{ element.focus();}); // jshint ignore:line
						return false;
					}
				}
			}
			return false;
		}
		return true;
	}

	static alert( html, callback )
	{
		let div = document.createElement('div');
		var s =  `
			<div style="position: fixed; top: 0; left: 0; bottom: 0; right: 0; z-index: 499; background-color: rgba( 0,0,0,0.6); pointer-events: all;">
					<div style="color: #46; background-color: white; border-radius: 5px; min-width: 270px; min-height: 50px; padding: 15px; text-align: center; overflow: hidden; position: fixed; top: 50%; left: 50%;transform: translate(-50%, -50%); z-index: 500; font-size: 16px;">
						<div>
							<p style="text-align:center">${html}</p>
							<button style="display: inline-block; padding: 6px 12px; font-size: 14px; line-height: 1.42857143; text-align: center; white-space: nowrap; vertical-align: middle; touch-action: manipulation; cursor: pointer; user-select: none; background-image: none; border: 1px solid transparent; border-radius: 4px;">
								OK
							</button>
						</div>
					</div>
			</div>`;

		div.innerHTML = s;
		let button = div.querySelector('button');
		button.addEventListener('click',(evt)=>
		{
			if( typeof callback === "function" )
				callback();

			div.parentNode.removeChild( div );
		});

		document.body.appendChild( div );
	}

	static delegateEvent(evtName ,element, selector, func )
	{
		element.addEventListener(evtName,(evt)=>
		{
			var e		= evt || window.event;
			var targ	= e.target || e.srcElement;
			var body	= element;

			var matches	= document.documentElement.matches
				|| document.documentElement.webkitMatchesSelector
				|| document.documentElement.mozMatchesSelector
				|| document.documentElement.oMatchesSelector
				|| document.documentElement.msMatchesSelector;

			for(var cur = targ; cur != body && cur != window.document; cur=cur.parentNode )
			{
				if( matches.call( cur, selector ) )
				{
					func.call( cur, evt );

					if( ! evt.bubbles  )
						return;
				}
			}
		});
	}

	static ajax(obj)
	{
		var xhr		= new XMLHttpRequest();
		var promise = new Promise(function(resolve,reject)
		{
			var i;

			xhr.open
			(
			 	obj.method 		|| 'GET'
				,obj.url
				,obj.async 		|| true
				,obj.user 		|| ''
				,obj.password	|| ''
			);

			xhr.timeout = obj.timeout || 0;

			if( obj.requestHeaders )
			{
				for(i in obj.requestHeaders )
				{
					xhr.setRequestHeader( i, obj.requestHeaders[ i ] );
				}
			}

			xhr.withCredentials 	= obj.withCredentials	|| false;

			xhr.responseType		= obj.responseType	|| obj.dataType || '';

			if( obj.overrideMimeType )
				xhr.overrideMimeType( obj.overrideMimeType );

			xhr.addEventListener("progress"	, obj.progress );
			xhr.addEventListener('error',function(e)
			{
				if( obj.error )
				{
					obj.error( xhr, xhr.statusText, e );
				}

				reject({ xhr: xhr, status: xhr.statusText, error: e });
			});

			if( obj.uploadProgress )
				xhr.upload.addEventListener("progress", obj.uploadProgress);

			if( obj.uploadFinish )
			{
				xhr.upload.addEventListener("load", obj.uploadFinish );
			}

			xhr.onreadystatechange = function(e)
			{
				if (xhr.readyState == 4)
				{
					if( xhr.status >= 200 && xhr.status < 300 )
					{
						if( xhr.responseType === "" || xhr.responseType == "text" )
						{
							if( obj.success )
								obj.success( xhr.responseText , xhr.statusText, xhr );

							resolve( xhr.responseText );
						}
						else
						{
							if( obj.success )
								obj.success( xhr.response , xhr.statusText, xhr );

							resolve( xhr.response );
						}
					}
					else if( xhr.status >=300 && xhr.status< 400 )
					{
						//never happens but when it do make something
						if( obj.error )
							obj.error( xhr, xhr.statusText, 'Redirection' );

						reject( xhr );
					}
					else if( xhr.status > 400 && xhr.status < 500 )
					{
						if( obj.error )
							obj.error( xhr, xhr.statusText, 'Not found error' );

						reject({ xhr: xhr, status:xhr.statusText, error: 'Not found error' });
					}
					else if(  xhr.status > 400 && xhr.status < 500 )
					{
						if( obj.error )
							obj.error( xhr, xhr.statusText, 'System server error' );

						reject( xhr );
						reject({ xhr: xhr, status:xhr.statusText, error: 'System server Error' });
					}
					else
					{
						if( obj.error )
							obj.error( xhr, xhr.statusText, 'Unknown Error' );

						reject({ xhr: xhr, status:xhr.statusText, error: 'Unknow error' });
					}
				}
			};

			xhr.addEventListener('abort',function(e)
			{
				if( obj.abort )
					obj.abort( e );

				reject({ xhr: xhr, status:'Aborted', error: e });
			});


			var parameters	= null;
			var methods		= [Blob, Document, FormData, String ];

			if( obj.data )
			{
				for(i=0;i<methods.length;i++)
				{
					if( obj.data instanceof methods[i] )
					{
						parameters = obj.data;
						break;
					}
				}

				if( !parameters )
				{
					var serialize = function(obj, prefix)
					{
						var p;
						var str = [];

						for(p in obj)
						{
							if (obj.hasOwnProperty(p))
							{
								var v = obj[p];
							   	var is_obj = typeof v == "object";
								var k = prefix ? prefix + "[" + (isNaN(+p) || is_obj ? p : '') + "]" : p;

								str.push
								(
								 	is_obj ?
										serialize( v, k ) :
										encodeURIComponent( k ) + "=" + encodeURIComponent( v )
								);
							}
						}
						return str.join("&");
					};

					xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
					parameters = serialize( obj.data, false );
				}
			}

			xhr.send( parameters );
		});

		promise.xhr = xhr;

		return promise;

	}
}
