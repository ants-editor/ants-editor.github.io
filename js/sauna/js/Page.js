const template = document.createElement('template');

template.innerHTML = `
  <style>
	:host
	{
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		bottom: 0;
		overflow: hidden;
	}
	</style>
	<div>
		<slot></slot>
	</div>`;

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
		/*
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
		*/
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
