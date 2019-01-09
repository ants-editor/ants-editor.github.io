const template = document.createElement('template');

template.innerHTML = `
  <style>

:host
{
  position				: absolute;
  /*transition				: all 0.3s ease;*/
  transition				: all 0.5s ease;
  width					: 100%;
  max-width				: 200px;
  top						: 0;
  bottom					: 0;
  background-color		: white;
  z-index					: 5;
  pointer-events			: all;
}

:host([type="right"])
{
  transform				: translate3d(100%,0,0);
  -webkit-transform		: translate3d(100%,0,0);
  right					: 0;
}

:host([type="left"])
{
  transform				: translate3d(-100%,0,0);
  -webkit-transform		: translate3d(-100%,0,0);
  left					: 0;
}

:host([type="left"][open])
:host([type="right"][open])
,:host(.open)
{
  z-index					: 5;
  transform				: translate3d(0,0,0);
  -webkit-transform		: translate3d(0,0,0);
}
  </style>
  <slot></slot>
`;

class Panel extends HTMLElement
{
	/*
	*/
	constructor()
	{
		super();

		this.debug = true;

		let shadowRoot = this.attachShadow({mode: 'open'});
    	shadowRoot.appendChild(template.content.cloneNode(true));
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

	show()
	{
		this.setAttribute("open","");
	}
	hide()
	{
		this.removeAttribute("open");
	}
}

customElements.define('sauna-panel', Panel);
export default Panel;
