const template = document.createElement('template');

template.innerHTML = `
  <style>
	:host(.pop_left2right)
	{
		animation-fill-mode: both;
		animation-name: pop_left2right;
		animation-timing-function: ease-in;
  		transform-origin: bottom center;
		animation-duration: 0.3s;
	}
	:host(.pop_right2left)
	{
		animation-fill-mode: both;
		animation-name: pop_right2left;
		animation-timing-function: ease-in;
  		transform-origin: bottom center;
		animation-duration: 0.3s;
	}

	:host(.push_right2left)
	{
		animation-fill-mode: both;
		animation-name: push_right2left;
		animation-timing-function: ease-in;
  		transform-origin: bottom center;
		animation-duration: 0.3s;
	}

	:host(.push_left2right)
	{
		animation-fill-mode: both;
		animation-name: push_left2right;
		animation-timing-function: ease-in;
  		transform-origin: bottom center;
		animation-duration: 0.3s;
	}

	@keyframes pop_left2right{
		0% {
    		transform: translate( 0px, 0);
  		}
  		100% {
  		  	transform: translate( 100%, 0);
  		}
	}

	@keyframes pop_right2left{
		0% {
    		transform: translate( 0px, 0);
  		}
  		100% {
  		  	transform: translate( -100%, 0);
  		}
	}
	@keyframes push_right2left{
		0% {
  		  	transform: translate( 100%, 0);
  		}
  		100% {
    		transform: translate( 0px, 0);
  		}
	}
	@keyframes push_left2right{
		0% {
  		  	transform: translate( -100%, 0);
  		}
  		100% {
    		transform: translate( 0px, 0);
  		}
	}

    :host {
  		position				: fixed;
  		top						: 0;
  		left					: 0;
  		right					: 0;
  		bottom					: 0;
  		/*width					: 100%;*/
  		overflow				: hidden;
  		z-index					: 1;
  		box-sizing			: border-box;
	    -webkit-transform		: translate3d(-100%,0,0);
	    transform				: translate3d(-100%,0,0);
    }

	:host([animation="enabled"])
	{
		/*
  		transition				: all 0.3s ease;
		*/
	}

	,:host(.previous)
	{
	  -webkit-transform		: translate3d(-100%,0,0);
	  transform				: translate3d(-100%,0,0);
	}

	:host(.active)
	{
	  z-index					: 3;
	  display					: block;
	  -webkit-transform		: translate3d(0,0,0);
	  transform				: translate3d(0,0,0);
	}

	.wrapper
	{
		display: -ms-flexbox;
    	display: -webkit-flex;
    	display: flex;
    	-webkit-flex-direction: column;
    	-ms-flex-direction: column;
    	flex-direction: column;
    	-webkit-flex-wrap: nowrap;
    	-ms-flex-wrap: nowrap;
    	flex-wrap: nowrap;
    	-webkit-justify-content: flex-start;
    	-ms-flex-pack: start;
    	justify-content: flex-start;
    	-webkit-align-content: stretch;
    	-ms-flex-line-pack: stretch;
    	align-content: stretch;
    	-webkit-align-items: flex-start;
    	-ms-flex-align: start;
    	align-items: flex-start;

		width: 100%;
		height: 100%;
		overflow: auto;
	}

	.wrapper>.main
	{

		-webkit-order: 0;
    	-ms-flex-order: 0;
    	order: 0;
    	-webkit-flex: 1 0 auto;
    	-ms-flex: 1 0 auto;
    	flex: 1 0 auto;

   		-webkit-align-self: stretch;
    	-ms-flex-item-align: stretch;
    	align-self: stretch;


		overflow-y				: auto;
		overflow-x				: hidden;
	}

/*
	:host.previous.noanimation
	{

	  z-index					: 1;
	  transition				: all 0s linear;
	  transform				: translate3d(100%,0,0);
	  -moz-transition-property: none;
	  -webkit-transition-property: none;
	  -o-transition-property: none;
	  transition-property: none;

	}
	:host
	,:host.start.previous
	{
	  transform				: translate3d(-100%,0,0);
	  -webkit-transform		: translate3d(-100%,0,0);
	  display					: block;
	}

	:host header
	{
	  height					: 45px;
	  position				: absolute;
	  top						: 0;
	  right					: 0;
	  left					: 0;
	}
*/

  </style>
  <div class="wrapper">
	<div class="main">
		<slot></slot>
	</div>
  </div>
`;

class Page extends HTMLElement
{
	/*
	*/
	constructor()
	{
		super();

		this.debug = true;

		let shadowRoot = this.attachShadow({mode: 'open'});
    	shadowRoot.appendChild(template.content.cloneNode(true));
		this.addEventListener('animationend',(evt)=>{
			console.log('Animation end',evt.animationName);
			if( evt.animationName === 'push_right2left' || evt.animationName === 'push_left2right' )
			{
				this.classList.add('active');
				this.classList.remove('push_right2left','push_left2right');
			}
			else
			{
				this.classList.remove('active');
				this.classList.remove('pop_right2left','pop_left2right');
			}
		});
	}

	connectedCallback()
	{
		console.log('connected');
	}

	disconnectedCallback()
	{
		console.log('disconnected');
	}

	attributeChangedCallback(attrName, oldVal, newVal)
	{
		if( this.debug )
		{
			console.log( 'Changing var '+attrName,oldVal,newVal );
		}
  	}

	pushIn()
	{
		//In From right to left
		console.log('pushIn'+this.getAttribute('id'));
		//if( this.classList.contains("previous") && this.getAttribute("animation") == "enabled" )
		//{
		//	this.classList.add("noanimation");
		//	this.promiseDelay(10,()=>
		//	{
		//		this.classList.remove("previous");
		//		this.classList.remove("noanimation");
		//		this.classList.add("active");
		//	});
		//	//this.removeAttribute("animation");
		//	//this.setAttribute("disabled","");
		//	//this.removeAttribute("status");
		//	//this.removeAttribute("disabled");

		//	//this.setTransition(false);
		//	//this.promiseDelay(10,()=>this.classList.add("previous"))
		//	//	.then(()=> this.promiseDelay(10,()=>this.setTransition(true)))
		//	//	.then(()=> this.promiseDelay(10,()=>classList"status","active")))
		//	//	//.then(()=>this.setTransition(false) )
		//}
		//else
		//{
		//	//this.setAttribute("status","active");
		//	this.classList.add("active");
		//}
		this.classList.add('push_right2left');
	}

	pushOut()
	{
		//In From left to right
		console.log('pushOut '+this.getAttribute('id'));
		if( !this.classList.contains("previous") && this.getAttribute("animation") == "enabled" )
		{
			//this.style['transition'] = 'all 0s linear';
			//this.setTransition(false);
			//this.classList.add("noanimation");

			//this.promiseDelay(10,()=>{
			//	this.classList.add("previous");
			//	this.classList.remove("noanimation");
			//	this.classList.remove("previous");
			//	this.classList.add("active");
			//});

			//this.promiseDelay(10,()=>this.removeAttribute("status"))
			//	.then(()=> this.promiseDelay(10,()=>this.setTransition(true)))
			//	.then(()=> this.promiseDelay(10,()=>this.setAttribute("status","active")))
			//	//.then(()=>this.setTransition(false) )
		}
		else
		{
//			this.classList.add("active");
			//this.setAttribute("status","active");
		}

		this.classList.add('push_left2right');
	}
	setTransition(b)
	{
		//if( b )
		//{
		//	this.classList.remove('noanimation');
		//	this.style['transition'] = '';
		//	this.style['-moz-transition-property'] ='';
		//	this.style['-webkit-transition-property'] = '';
		//	this.style['-o-transition-property'] = '';
		//	this.style['transition-property']= '';
		//}
		//else
		//{
		//	this.classList.add('noanimation');
		//	this.style['transition'] = 'all 0s linear';
		//	this.style['-moz-transition-property'] ='none';
		//	this.style['-webkit-transition-property'] = 'none';
		//	this.style['-o-transition-property'] = 'none';
		//	this.style['transition-property']= 'none';
		//}
	}
	promiseDelay(time, lambda)
	{
		return new Promise((resolve,reject)=>
		{
			setTimeout(()=>
			{
				lambda();
				resolve(true);
			},time);
		});
	}
	popIn()
	{
		//Pop from right to left
		console.log('popIn '+this.getAttribute('id'));
		//this.classList.add("previous");
		this.classList.add('pop_right2left');
	}
	popOut()
	{
		//Pop from left to right
		console.log('popOut '+this.getAttribute('id'));
		this.classList.remove("active");
		this.classList.add('pop_left2right');
		//this.removeAttribute("status");
	}
}

customElements.define('sauna-page', Page);
export default Page;
