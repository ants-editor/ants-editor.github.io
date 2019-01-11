// Client ID and API key from the Developer Console
var CLIENT_ID = '415517813120-0344qthv45ac2ot76kl12at6cfn8q9n2.apps.googleusercontent.com';
var API_KEY = 'AIzaSyBGbdQuULcqCnJqoylF_Y0eA-q6-XzS_L8';

// Array of API discovery doc URLs for APIs used by the quickstart

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.appdata';

//var authorizeButton = document.getElementById('authorize_button');
//var signoutButton = document.getElementById('signout_button');

class GoogleSync
{
	constructor( client_id, api_key, scopes )
	{
		this.client_id = client_id;
		this.api_key = api_key;
		this.scopes = scopes;
	}

	load()
	{
		/**
		 *	On load, called to load the auth2 library and API client library.
		 */
		return gapi.load('client:auth2').then(()=>
		{
			return this.initClient();
		});
	}
	/**
	 *	Initializes the API client library and sets up sign-in state
	 *	listeners.
	 */
	initClient()
	{
		let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

		return gapi.load('client:auth2')
		.then(()=>
		{
			return gapi.client.init
			({
			 	apiKey: API_KEY,
			 	clientId: CLIENT_ID,
			 	discoveryDocs: DISCOVERY_DOCS,
			 	scope: SCOPES
			});
		})
		.then((xxx)=>
		{
			console.log( xxx );
		 	//gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
		 	// Handle the initial sign-in state.
		 	//updateSigninStatus();
			return Promise.resolve( gapi.auth2.getAuthInstance().isSignedIn.get() );
		});
	}

	/**
	 *	Sign in the user upon button click.
	 */
	signIn()
	{
		return gapi.auth2.getAuthInstance().signIn();
	}

	/**
	 *	Sign out the user upon button click.
	 */
	signOut()
	{
		return gapi.auth2.getAuthInstance().signOut();
	}

	/**
	 * Print files.
	 */
	listFiles() {
		return gapi.client.drive.files.list({
		 'pageSize': 10,
		 'fields': "nextPageToken, files(id, name)"
		//'q':"'appDataFolder' in parents"
		});/*.then(function(response) {
		 appendPre('Files:');
		 var files = response.result.files;
		 if (files && files.length > 0) {
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
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
			var fileMetadata = {
				 'name': name,
				 'mimeType': 'application/vnd.google-apps.folder'
			};

			gapi.client.drive.files.create
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
			var request = gapi.client.drive.files.get({
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
	 			var accessToken = gapi.auth.getToken().access_token;
	 			var xhr = new XMLHttpRequest();
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
	uploadFile(fileData, callback )
	{
		return new Promise((resolve,reject)=>
		{
			const boundary = '-------314159265358979323846';
			const delimiter = "\r\n--" + boundary + "\r\n";
			const close_delim = "\r\n--" + boundary + "--";

			var reader = new FileReader();
			reader.readAsBinaryString(fileData);
			reader.onload = function(e) {
				var contentType = fileData.type || 'application/octet-stream';
				var metadata = {
					'title': fileData.fileName,
					'mimeType': contentType
				};

				var base64Data = btoa(reader.result);
				var multipartRequestBody =
						delimiter +
						'Content-Type: application/json\r\n\r\n' +
						JSON.stringify(metadata) +
						delimiter +
						'Content-Type: ' + contentType + '\r\n' +
						'Content-Transfer-Encoding: base64\r\n' +
						'\r\n' +
						base64Data +
						close_delim;

				var request = gapi.client.request({
						'path': '/upload/drive/v2/files',
						'method': 'POST',
						'params': {'uploadType': 'multipart'},
						'headers': {
							'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
						},
						'body': multipartRequestBody});

				var callback = function( file )
				{
					console.log(file);
					resolve( file );
				};

				request.execute(callback);
			};
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

			var metadata = {
				'name': name,
				'mimeType': contentType
			};

			var multipartRequestBody =
				delimiter +
				'Content-Type: application/json\r\n\r\n' +
				JSON.stringify(metadata) +
				delimiter +
				'Content-Type: ' + contentType + '\r\n\r\n' +
				data +
				close_delim;

			let request = gapi.client.request({
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
			let user = gapi.auth2.getAuthInstance().currentUser.get();
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
