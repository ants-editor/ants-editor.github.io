
importScripts('js/workbox-sw.js');

let version					= '10';
let cssCacheName			= 'ccn'+version;
let cacheFirstName			= 'cfn'+version;
let networkFirstName 		= 'nfn'+version;
let imageCacheName			= 'icn'+version;

//workbox.routing.registerRoute
//(
//	new RegExp('.*\.js'),workbox.strategies.networkFirst()
//);

workbox.routing.registerRoute
(
  	// Cache CSS files
  	/.*\.(?:css|html|index.html)/,
  	// Use cache but update in the background ASAP
  	//workbox.strategies.staleWhileRevalidate
	workbox.strategies.networkFirst
	({
    	// Use a custom cache name
    	cacheName: cssCacheName,
  	})
);

workbox.routing.registerRoute
(
  // Cache image files
  /.*\.(?:png|jpg|jpeg|svg|gif)/,
  // Use the cache if it's available
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: imageCacheName
    //,plugins: [
    //  new workbox.expiration.Plugin({
    //    // Cache only 20 images
    //    maxEntries: 200,
    //    // Cache for a maximum of a week
    //    //maxAgeSeconds: 7 * 24 * 60 * 60,
    //  })
    //],
  })
);
/*
workbox.routing.registerRoute
(
	/networkFirstFiles/
	,workbox.strategies.networkFirst
	({
    	// Use a custom cache name
    	cacheName: networkFirstName
    	,plugins: [
    	  new workbox.expiration.Plugin({
    	    // Cache only 2
    	    maxEntries: 2,
    	    // Cache for a maximum 10 Min
    	    maxAgeSeconds: 10 * 60
    	  })
    	]
  	})
);
*/

/*
workbox.routing.registerRoute
(
	/.someFiles.server/
	,workbox.strategies.cacheFirst
	({
    	// Use a custom cache name
    	cacheName: cacheFirstName,
    	plugins: [
    	  new workbox.expiration.Plugin({
    	    // Cache only 20 images
    	    maxEntries: 3,
    	    // Cache for a maximum of a week
    	    maxAgeSeconds: 2 * 24 * 60 * 60,
    	  })
    	]
  	})
);
*/
