export default class GoogleDrive
{
	constructor( client_id, api_key, scopes )
	{
		this.client_id = client_id;
		this.api_key = api_key;
		this.scopes = scopes;
		this._isLoad = false;
	}

	load()
	{
		/**
		 *	On load, called to load the auth2 library and API client library.
		 */
		return new Promise((resolve,reject)=>
		{
			window.gapi.load('client:auth2',()=>
			{
				console.log('Goolgle client loaded');
				resolve();
			});
		});
	}
	/**
	 *	Initializes the API client library and sets up sign-in state
	 *	listeners.
	 */
	initClient()
	{
		let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
		console.log('Window is window',window.gapi.load );


		return this.load('client:auth2')
		.then(()=>
		{
			console.log('Load client and auth2');
			return window.gapi.client.init
			({
			 	apiKey: this.api_key,
			 	clientId: this.client_id,
			 	discoveryDocs: DISCOVERY_DOCS,
			 	scope: this.scopes
			});
		})
		.then((xxx)=>
		{
			console.log( xxx );
		 	//window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
		 	// Handle the initial sign-in state.
		 	//updateSigninStatus();
			return Promise.resolve( window.gapi.auth2.getAuthInstance().isSignedIn.get() );
		});
	}

	/**
	 *	Sign in the user upon button click.
	 */
	signIn()
	{
		return window.gapi.auth2.getAuthInstance().signIn();
	}

	/**
	 *	Sign out the user upon button click.
	 */
	signOut()
	{
		return window.gapi.auth2.getAuthInstance().signOut();
	}

	/**
	 * Print files.
	 */
	listFiles() {
		return window.gapi.client.drive.files.list({
		 'pageSize': 10,
		 'fields': "nextPageToken, files(id, name)"
		//'q':"'appDataFolder' in parents"
		});/*.then(function(response) {
		 appendPre('Files:');
		 let files = response.result.files;
		 if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				let file = files[i];
				appendPre(file.name + ' (' + file.id + ')');
			}
		 } else {
			appendPre('No files found.');
		 }
		});*/
	}

	createDirectory(name)
	{
		return new Promise((resolve,reject)=>
		{
			let fileMetadata = {
				 'name': name,
				 'mimeType': 'application/vnd.google-apps.folder'
			};

			window.gapi.client.drive.files.create
			(
				{
					resource: fileMetadata,
					fields: 'id'
				}, function (err, file) {
				if (err) {
					// Handle error
					reject( err );
				}else {
					console.log('Folder Id: ', file.id);
					resolve( file );
				}
			});
		});
	}

	/**
	 * Print a file's metadata.
	 * https://developers.google.com/drive/api/v2/reference/files/get#examples
	 *
	 * @param {String} fileId ID of the file to print metadata for.
	 */
	printFile(fileId)
	{
		return new Promise((resolve,reject)=>
		{
			let request = window.gapi.client.drive.files.get({
			 'fileId': fileId
			});
			request.execute(function(resp) {
				console.log('Title: ' + resp.title);
				console.log('Description: ' + resp.description);
				console.log('MIME type: ' + resp.mimeType);
				resolve( resp );
			});
		});
	}

	/**
	 * Download a file's content.
	 * https://developers.google.com/drive/api/v2/reference/files/get#examples
	 *
	 * @param {File} file Drive File instance.
	 * @param {Function} callback Function to call when the request is complete.
	 */
	downloadFile(file)
	{
		return new Promise((resolve,reject)=>
		{
	 		 if (file.downloadUrl) {
	 			let accessToken = window.gapi.auth.getToken().access_token;
	 			let xhr = new XMLHttpRequest();
	 			xhr.open('GET', file.downloadUrl);
	 			xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
	 			xhr.onload = function() {
					resolve( xhr.responseText );
	 			};
	 			xhr.onerror = function() {
					reject('Unknown error');
	 			};
	 			xhr.send();
	 		 }
			 else
			{
				 reject('Not downloadUrl property on file');
	 		}
		});
	}
	/**
	* Insert new file.
	*
	* @param {File} fileData File object to read data from.
	* @param {Function} callback Function to call when the request is complete.
	https://developers.google.com/drive/api/v2/reference/files/insert#examples
	*/

	base64Encode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
	}



	uploadFile( filename, content, contentType )
	{
		const boundary = '-------314159265358979323846';
		const delimiter = "\r\n--" + boundary + "\r\n";
		const close_delim = "\r\n--" + boundary + "--";

		let ctype = contentType || 'application/octet-stream';

		let metadata = {
			'title': filename,
			'mimeType': ctype
		};

		console.log('Before btoa',content);
		let base64Data = this.base64Encode( content );
		console.log('after Before btoa');
		console.log( content );
		let multipartRequestBody =
					delimiter +
					'Content-Type: application/json\r\n\r\n' +
					JSON.stringify(metadata) +
					delimiter +
					'Content-Type: ' + ctype + '\r\n' +
					'Content-Transfer-Encoding: base64\r\n' +
					'\r\n' +
					base64Data +
					close_delim;

		return window.gapi.client.request
		({
			'path': '/upload/drive/v3/files',
			'method': 'POST',
			'params': {'uploadType': 'multipart'},
			'headers': {
				'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody
		});
	}


	uploadJsonFile(name,data)
	{
		return new Promise((resolve,reject)=>
		{
			const boundary = '-------314159265358979323846';
			const delimiter = "\r\n--" + boundary + "\r\n";
			const close_delim = "\r\n--" + boundary + "--";

			const contentType = 'application/json';

			let metadata = {
				'name': name,
				'mimeType': contentType
			};

			let multipartRequestBody =
				delimiter +
				'Content-Type: application/json\r\n\r\n' +
				JSON.stringify(metadata) +
				delimiter +
				'Content-Type: ' + contentType + '\r\n\r\n' +
				data +
				close_delim;

			let request = window.gapi.client.request({
				'path': '/upload/drive/v3/files',
				'method': 'POST',
				'params': {'uploadType': 'multipart'},
				'headers': {
					'Content-Type': 'multipart/related; boundary="' + boundary + '"'
				},
				'body': multipartRequestBody
			});

			let callback = function( file )
			{
				resolve( file );
				console.log(file);
			};

			request.execute(callback);
		});
	}

	uploadFile2( stringName, content, content_type )
	{
		//content-type 'text/plain;charset=utf-8'

		return new Promise((resolve,reject)=>
		{
			let file = new File(['Hello, world!'], 'hello world.txt', { type: contentType });
			let user = window.gapi.auth2.getAuthInstance().currentUser.get();
			let oauthToken = user.getAuthResponse().access_token;

			let initResumable = new XMLHttpRequest();
			initResumable.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media', true);
			initResumable.setRequestHeader('Authorization', 'Bearer ' + oauthToken);
			initResumable.setRequestHeader('Content-Type', 'application/json');
			initResumable.setRequestHeader('X-Upload-Content-Length', file.size);
			initResumable.setRequestHeader('X-Upload-Content-Type', contentType);
			initResumable.onreadystatechange = function() {
				if(initResumable.readyState === XMLHttpRequest.DONE && initResumable.status === 200) {
				 const locationUrl = initResumable.getResponseHeader('Location');

				 const reader = new FileReader();
				 reader.onload = (e) => {
					const uploadResumable = new XMLHttpRequest();
					uploadResumable.open('PUT', locationUrl, true);
					uploadResumable.setRequestHeader('Content-Type', contentType);
					uploadResumable.setRequestHeader('X-Upload-Content-Type', contentType);
					uploadResumable.onreadystatechange = function() {
						if( uploadResumable.readyState === XMLHttpRequest.DONE && uploadResumable.status === 200 ) {
						 console.log(uploadResumable.response);
						}
					};
					uploadResumable.send(reader.result);
				 };
				 reader.readAsArrayBuffer(file);
				}
			};
		});
	}
}
