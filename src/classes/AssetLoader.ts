export class AssetLoader {
	assets:Record<string, CanvasImageSource> = {}
	assetLocations = [
		'tree.png',
		'road-0.png','road-1.png','road-2-1.png','road-2-2.png','road-3.png','road-4.png',
		'house-1.png', 'house-2.png',
		'bulldozer.png',
		'metro-station.png', 'metro-line.png'
	]
	assetWaiters:(() => void)[] = []
	assetsLoadedBool = false

	async assetsLoaded() {		
		if(this.assetsLoadedBool) return true
		await new Promise((resolve, reject) => {
			this.assetWaiters.push(() => {
				resolve(true)
			})
		})
	}

	async loadAssets() {

		for(let assetLocation of this.assetLocations) {
			let img = new Image()
			img.src = './assets/'+assetLocation
			await new Promise((resolve, reject) => {
				img.addEventListener('load', function() {
					resolve(true)
				}, false);
			})

			let name = assetLocation.split('.')[0]

			this.assets[name] = img
		}

		if(this.assetWaiters) for(let assetWaiter of this.assetWaiters) assetWaiter()
		this.assetsLoadedBool = true

		return this.assets
	}
}