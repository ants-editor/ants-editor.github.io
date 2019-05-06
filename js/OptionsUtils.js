export default class OptionsUtils
{
    static getCount( options )
	{
		if( options && 'count' in options )
			return options.count;

		return null;
	}

	static getDirection(options)
	{
		if( options && 'direction' in options )
			return options.direction;

		return "next";
	}

	static getQueryObject( options )
	{
		return options && 'index' in options
		  ? store.index( option.index )
		  : this.store;
	}

	/*
	 *	x.countQuery('users','id',{index:'xxxx' '>=' : 3 , '<=' : '5' });
	 */

	static getKeyRange( options )
	{
		if( options === null || options === undefined )
			return null;

		if( '=' in options )
		{
			try
			{
				return IDBKeyRange.only( options['='] );
			}
			catch(e)
			{
				console.log("Error with the value",options['='] );
				throw e;
			}
		}

		let isLowerBoundOpen	= '>' in options;
		let isLowerBound  		= isLowerBoundOpen || '>=' in options;

		let isUpperBoundOpen	= '<' in options;
		let isUpperBound		= isUpperBoundOpen || '<=' in options;


		if( isLowerBound && isUpperBound )
		{
			let lowerBound	= options[ isLowerBoundOpen ?  '>':'>='];
			let upperBound	= options[ isUpperBoundOpen ?  '<':'<='];
			return IDBKeyRange.bound( lowerBound, upperBound, isLowerBoundOpen, isUpperBoundOpen );
		}

		if( isLowerBound )
		{
			let lowerBound	= options[ isLowerBoundOpen ? '>' : '>=' ];
			return IDBKeyRange.lowerBound( lowerBound , isLowerBoundOpen );
		}

		if( isUpperBound )
		{
			let upperBound = options[ isUpperBoundOpen ? '<' : '<=' ];
			return IDBKeyRange.upperBound( upperBound , isUpperBoundOpen );
		}

		return null;
	}
}
