const template = document.createElement('template');

template.innerHTML = `
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
