import PromiseUtils from './PromiseUtils.js';

export default class SyncService
{
	constructor(localChangedList,remoteChangedList)
	{
		this.to_upload = [];
		this.download_to_trash = [];
		this.to_download = [];

		remoteChangedList((remote)=>
		{
			let index = localChangedList.findIndex( l => l.is( r ) );

			if( index == -1 )
			{
				if( local.is_deleted )
				{
					if( remote.is_deleted )
						this.removeLocal( local );
					else
						this.download_to_trash( remote );
				}
				else if( local.updated > remote.updated )
				{
					this.to_upload( local );
				}
				else
				{
					this.to_download.push( remote );
				}

				localChangedList.splice( index, 1 );
			}
			else
			{
				this.to_download.push( remote );
			}
		});

		localChangedList.forEach((local)=>
		{
			this.to_upload.push( local );
		});
	}

	download()
	{
		let generator = (item, index)=>
		{
			return this.downloadItem( item );
		};

		return PromiseUtils.runSequential(this.to_download, generator );
	}

	downloadToTrash()
	{
		let generator = (item, index)=>
		{
			return this.downloadToTrashItem( item );
		};

		return PromiseUtils.runSequential(this.to_download, generator );
	}

	upload()
	{
		let generator = (item, index)=>
		{
			return this.uploadItem( item );
		};

		return PromiseUtils.runSequential(this.to_download, generator );

	}

	downloadItem(download, toTrash )
	{

	}

	uploadItem()
	{

	}
}
