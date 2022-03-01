import { game } from "../App"
import { globalDebugValues } from "../HUD/DebugPanel"
import { toolbarSelected } from "../HUD/Toolbar"
import { AssetLoader } from "./AssetLoader"
import { BuildingHouse, BuildingMetroStation, BuildingRoad, BuildingTypes } from "./Building"
import { Camera } from "./Camera"
import { Car } from "./Car"
import { Color } from "./Color"
import { Tile } from "./Grid"
import { Pedestrian } from "./Pedestrian"
import { Utils } from "./Utils"
import { Vector } from "./Vector"

export class Renderer {
	canvas: Record<string, HTMLCanvasElement> = {}
	ctx:Record<string, CanvasRenderingContext2D> = {}
	lastFrame:Record<string, number> = {}
	camera:Camera
	assetLoader:AssetLoader
	assets:Record<string, CanvasImageSource > = {}
	window:Vector

	constructor() {

		this.camera = new Camera()

		this.assetLoader = new AssetLoader()
		this.loadAssets()

		this.window = new Vector(window.innerWidth, window.innerHeight)

	}
	async loadAssets() {
		this.assets = await this.assetLoader.loadAssets()
	}
	loadCanvas() {

		let canvasIds = ['dynamic', 'tiles', 'metro']

		for(let canvasId of canvasIds) {
			this.canvas[canvasId] = document.getElementById(`canvas-${canvasId}`) as HTMLCanvasElement
			this.ctx[canvasId] = this.canvas[canvasId].getContext('2d') as CanvasRenderingContext2D
	
			this.canvas[canvasId].width = window.innerWidth
			this.canvas[canvasId].height = window.innerHeight

			//this.ctx[canvasId].imageSmoothingEnabled = false
		}
	}
	async start() {
		await this.assetLoader.assetsLoaded()
		this.loadCanvas()

		// set camera pos to middle of screen
		this.camera.pos = 
			game.world.grid.size.clone()
			.minus(new Vector(this.window.x, this.window.y).divide(new Vector(this.camera.zoomValue, this.camera.zoomValue)))
			.divide(new Vector(2, 2))


		this.dynamicFrame()

		this.lastFrame['tiles'] = performance.now()
		this.tilesFrame()

		this.metroFrame()
	}
	metroFrame() {

		window.requestAnimationFrame(() => { this.metroFrame() })

		let cameraZoom = this.camera.zoomValue
		let ctx = this.ctx['metro']
		let canvas = this.canvas['metro']

		if(ctx === undefined) return

		if(canvas.height !== window.innerWidth) canvas.height = this.window.y
		if(canvas.width !== window.innerHeight) canvas.width = this.window.x

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		let stations:Tile[] = []
		game.world.grid.foreach(t => { if(t.building.type === BuildingTypes.station) stations.push(t) })

		for(let station of stations) {

			let stationWindowPos = this.gridToWindowPos(station.pos)

			ctx.fillStyle = new Color(120, 120, 200).toString()
			ctx.beginPath()
			ctx.arc(stationWindowPos.x+cameraZoom/2, stationWindowPos.y+cameraZoom/2, cameraZoom/4, 0, Math.PI*2)
			ctx.fill()
			
		}

		// draw metro lines
		for(let metroline of game.world.metrolines) {
		
			let station1 = metroline.points[0]
			let station1Window = this.gridToWindowPos(station1.pos)
			let station2 = metroline.points[1]
			let station2Window = this.gridToWindowPos(station2.pos)

			ctx.lineWidth = cameraZoom/10
			ctx.strokeStyle = new Color(120, 120, 200).toString()
			ctx.beginPath()
			ctx.moveTo(station1Window.x+cameraZoom/2, station1Window.y+cameraZoom/2)
			ctx.lineTo(station2Window.x+cameraZoom/2, station2Window.y+cameraZoom/2)
			ctx.closePath()
			ctx.stroke()
		}

		// draw unfinished metro line
		if(game.temp['metro-line'] !== undefined) {
			let stationPos = (game.temp['metro-line'].from as Tile).pos
			let mousePos = game.inputHandler.mousePos
			let stationPosWindow = this.gridToWindowPos(stationPos)

			ctx.lineWidth = cameraZoom/10
			ctx.strokeStyle = new Color(120, 120, 200).toString()
			ctx.beginPath()
			ctx.moveTo(stationPosWindow.x+cameraZoom/2, stationPosWindow.y+cameraZoom/2)
			ctx.lineTo(mousePos.x, mousePos.y)
			ctx.closePath()
			ctx.stroke()
		}

	}
	tilesFrame(force=false) {

		window.requestAnimationFrame(() => { this.tilesFrame() })

		let now = performance.now()
		let elapsed = now - this.lastFrame['tiles']
		let fpsInterval = 1000/2

		if(elapsed < fpsInterval && !force) return

		this.lastFrame['tiles'] = now - (elapsed%fpsInterval)

		let ctx = this.ctx['tiles']
		let canvas = this.canvas['tiles']

		if(ctx === undefined) return

		if(canvas.height !== window.innerWidth) canvas.height = this.window.y
		if(canvas.width !== window.innerHeight) canvas.width = this.window.x

		ctx.clearRect(0, 0, canvas.width, canvas.height)

		game.measurePerformance(() => {
			this.drawTiles()
		}, 'draw-tiles')
	}
	dynamicFrame() {

		let ctx = this.ctx['dynamic']
		let canvas = this.canvas['dynamic']

		// rerun frame
		window.requestAnimationFrame(() => { this.dynamicFrame() })

		// clear screen
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		if(this.window.x !== window.innerWidth) {
			this.window.x = window.innerWidth
			canvas.width = this.window.x
			canvas.height = this.window.y
		}
		if(this.window.y !== window.innerHeight) {
			this.window.y = window.innerHeight
			canvas.width = this.window.x
			canvas.height = this.window.y
		}

		game.measurePerformance(() => {
			if(this.camera.zoomValue > 60) this.drawTrafficLights()
		}, 'draw-trafficlights')

		game.measurePerformance(() => {
			if(this.camera.zoomValue > 15) for(let car of game.world.cars) this.drawCar(car)
		}, 'draw-cars')

		
		game.measurePerformance(() => {
			if(this.camera.zoomValue < 50) return
			for(let ped of game.world.pedestrians) this.drawPedestrian(ped)
		}, 'draw-peds')

		this.drawMouseTileHover()
		this.drawMouseTool()
	
	}

	drawPedestrian(ped:Pedestrian) {
		let ctx = this.ctx['dynamic']
		let cameraZoom = this.camera.zoomValue
		let currTile = ped.getPathTile().pos.clone().plus(new Vector(0.5, 0.5))
		let prevTile = ped.getPathTile(-1).pos.clone().plus(new Vector(0.5, 0.5))
		let nextTile = ped.getPathTile(1).pos.clone().plus(new Vector(0.5, 0.5))
		let from = currTile.middle(prevTile)
		let to = currTile.middle(nextTile)
		let rotation1 = from.clone().minus(currTile).getAngle()
		from.plus(new Vector(-1/2.5, 0).rotate(rotation1+Math.PI/2))
		let rotation2 = currTile.clone().minus(to).getAngle()
		to.plus(new Vector(-1/2.5, 0).rotate(rotation2+Math.PI/2))
		let rotation3 = from.clone().minus(to).getAngle()
		currTile.plus(new Vector(-1/2.5, 0).rotate(rotation3+Math.PI/2))

		let tilePos = ped.tileProgress
		let pos = from.clone().multiply(new Vector(1-tilePos, 1-tilePos)).plus(to.clone().multiply(new Vector(tilePos, tilePos)))

		if(to.clone().minus(from).getMagnitude() < 1) { // inner curve
			currTile.plus(new Vector(-1/8, 0).rotate(rotation3+Math.PI/2))
			pos = Utils.quadraticBezierCurve(from, currTile, to, tilePos)
		}

		if(to.clone().minus(from).getMagnitude() > 1) { // outter curve
			currTile.plus(new Vector(-1/6, 0).rotate(rotation3+Math.PI/2))
			if(tilePos < 0.5) pos = from.clone().multiply(new Vector(1-tilePos*2, 1-tilePos*2)).plus(currTile.clone().multiply(new Vector(tilePos*2, tilePos*2)))
			if(tilePos >= 0.5) pos = currTile.clone().multiply(new Vector(1-(tilePos-0.5)*2, 1-(tilePos-0.5)*2)).plus(to.clone().multiply(new Vector((tilePos-0.5)*2, (tilePos-0.5)*2)))
		}


		let drawDebug = false

		if(drawDebug) {
			ctx.beginPath()
			ctx.fillStyle = new Color(255,255,255).toString()
			let fromWindow = this.gridToWindowPos(from)
			ctx.beginPath()
			ctx.arc(fromWindow.x, fromWindow.y, cameraZoom/60, 0, Math.PI*2)
			ctx.fill()
			let toWindow = this.gridToWindowPos(to)
			ctx.beginPath()
			ctx.arc(toWindow.x, toWindow.y, cameraZoom/60, 0, Math.PI*2)
			ctx.fill()
			ctx.fillStyle = new Color(0,255,255).toString()
			let controlPointWindow = this.gridToWindowPos(currTile)
			ctx.beginPath()
			ctx.arc(controlPointWindow.x, controlPointWindow.y, cameraZoom/60, 0, Math.PI*2)
			ctx.fill()
		}

		
		let windowPos = this.gridToWindowPos(pos)

		if(windowPos.x < -cameraZoom || windowPos.x > this.window.x+cameraZoom) return
		if(windowPos.y < -cameraZoom || windowPos.y > this.window.y+cameraZoom) return

		ctx.fillStyle = ped.color.toString() 
		ctx.beginPath()
		ctx.arc(windowPos.x, windowPos.y, cameraZoom/40, 0, Math.PI*2)
		ctx.fill()

	}

	drawMouseTool() {

		let ctx = this.ctx['dynamic']
		let tool = toolbarSelected
		let mousePos = game.inputHandler.mousePos
		let asset = null
		if(tool === 'house') asset = this.assets['house-1']
		if(tool === 'road') asset = this.assets['road-2-1']
		if(tool === 'bulldozer') asset = this.assets['bulldozer']
		if(['info', 'bulldozer', 'metro-station', 'metro-line'].includes(tool)) asset = this.assets[tool]

		if(asset) {
			ctx.globalAlpha = 0.9
			ctx.drawImage(asset, mousePos.x+20, mousePos.y+20, 50, 50)
			ctx.strokeStyle = new Color(0, 0, 255).toString()
			ctx.globalAlpha = 1
			ctx.strokeRect(mousePos.x+20, mousePos.y+20, 50, 50)
			
		}
	}
	drawCar(car:Car) {

		let cameraZoom = this.camera.zoomValue
		let tilePos = car.tileProgress
		let ctx = this.ctx['dynamic']

		let carCurrentTile = car.currentTile.pos.clone().plus(new Vector(0.5, 0.5))

		let carCurrentTileWindow = this.gridToWindowPos(carCurrentTile)
		if(carCurrentTileWindow.x < -cameraZoom || carCurrentTileWindow.x > this.window.x+cameraZoom) return
		if(carCurrentTileWindow.y < -cameraZoom || carCurrentTileWindow.y > this.window.y+cameraZoom) return

		let carPreviousTile = car.previousTile.pos.clone().plus(new Vector(0.5, 0.5))
		let carNextTile = car.nextTile.pos.clone().plus(new Vector(0.5, 0.5))
		let carFrom = carCurrentTile.middle(carPreviousTile)
		let carTo = carCurrentTile.middle(carNextTile)
		let carPos = carFrom.clone().multiply(new Vector(1-tilePos, 1-tilePos)).plus(carTo.clone().multiply(new Vector(tilePos, tilePos)))
		let rotation = carFrom.clone().minus(carTo).getAngle()

		// car is on curved road
		if(carTo.clone().minus(carFrom).getMagnitude() < 1) {
			carPos = Utils.quadraticBezierCurve(carFrom, carCurrentTile, carTo, tilePos)
			let carPos2 = Utils.quadraticBezierCurve(carFrom, carCurrentTile, carTo, tilePos+0.01)
			let angle = carPos.clone().minus(carPos2).getAngle()
			rotation = angle
			//rotationAroundCarAxes = -angle/2
		}

		/*
		ctx.fillStyle = car.color.toString()
		let carFromWindow = this.gridToWindowPos(carFrom)
		ctx.beginPath()
		ctx.arc(carFromWindow.x, carFromWindow.y, cameraZoom/20, 0, Math.PI*2)
		ctx.fill()
		let carToWindow = this.gridToWindowPos(carTo)
		ctx.beginPath()
		ctx.arc(carToWindow.x, carToWindow.y, cameraZoom/20, 0, Math.PI*2)
		ctx.fill()
		*/

		let carWindowPos = this.gridToWindowPos(carPos).plus(new Vector(-cameraZoom/5, 0).rotate(rotation+Math.PI/2))


		ctx.save()
		ctx.beginPath()
		ctx.translate(carWindowPos.x, carWindowPos.y)
		ctx.rotate(rotation)
		ctx.rect(-cameraZoom/6, -cameraZoom/12, cameraZoom/3, cameraZoom/6)
		ctx.fillStyle = car.color.toString()
		ctx.fill()

		if(car.highlight) {
			ctx.lineWidth = cameraZoom/50
			ctx.strokeStyle = car.highlight.toString()
			ctx.stroke()
		}
		ctx.restore()

		if(car.debugValues && this.camera.zoomValue > 200) {
			let idx = 0

			for(let name in car.debugValues) {
				let value = car.debugValues[name]
				let text = `${name}: ${value}`
				let fontSize = cameraZoom/10
				ctx.fillStyle = new Color(0, 0, 0).toString()
				ctx.strokeStyle = new Color(255, 255, 255).toString()
				ctx.font = `${fontSize}px Arial`
				ctx.fillText(text, carWindowPos.x-cameraZoom/12, carWindowPos.y+idx*fontSize)
				ctx.strokeText(text, carWindowPos.x-cameraZoom/12, carWindowPos.y+idx*fontSize)
				idx++
			}
		}
		
	}
	drawMouseTileHover() {
		let mouseTileHover = game.inputHandler.mouseTileHover
		let tileWindowPos = this.gridToWindowPos(mouseTileHover)
		let cameraZoom = this.camera.zoomValue

		let ctx = this.ctx['dynamic']

		ctx.fillStyle = new Color(0, 0, 0, 0.5).toString()
		ctx.fillRect(tileWindowPos.x, tileWindowPos.y, cameraZoom, cameraZoom)

	}

	drawTrafficLights() {

		let cameraZoom = this.camera.zoomValue
		let ctx = this.ctx['dynamic']

		game.world.trafficLights.forEach((tile) => {
			// draw traffic light

			let building = tile.building as BuildingRoad

			for(let idx in building.roadNeighbors) {
				let neighbor = building.roadNeighbors[idx]
				let middle = neighbor.pos.middle(tile.pos).middle(tile.pos).plus(new Vector(0.5, 0.5))

				if(Number(idx) === building.trafficLight) ctx.fillStyle = 'rgb(0, 255, 0)'
				else ctx.fillStyle = 'rgb(255, 0, 0)'

				let middleToWindow = this.gridToWindowPos(middle)

				if(middleToWindow.x < -cameraZoom || middleToWindow.x > this.window.x) return
				if(middleToWindow.y < -cameraZoom || middleToWindow.y > this.window.y) return
				
				ctx.beginPath()
				ctx.arc(middleToWindow.x, middleToWindow.y, cameraZoom/30, 0, Math.PI*2)
				ctx.fill()
			}
		})
	}
	drawTiles() {

		game.world.grid.foreach((tile) => {


			let tileWindowPos = this.gridToWindowPos(tile.pos)
			let cameraZoom = this.camera.zoomValue
			let ctx = this.ctx['tiles']

			if(tileWindowPos.x < -cameraZoom || tileWindowPos.x > this.window.x) return
			if(tileWindowPos.y < -cameraZoom || tileWindowPos.y > this.window.y) return

			// colored tile
			if(!tile.color.equals(new Color(255,255,255))) {

				ctx.fillStyle = tile.color.toString()
				ctx.fillRect(tileWindowPos.x, tileWindowPos.y, cameraZoom, cameraZoom)
			}

			if(tile.building.type === BuildingTypes.tree) {
				ctx.drawImage(this.assets['tree'], tileWindowPos.x, tileWindowPos.y, cameraZoom, cameraZoom)
			}

			if(tile.building.type === BuildingTypes.road) {
				let building = tile.building as BuildingRoad
				let rotation = building.roadDirection

				ctx.save()
				ctx.translate(tileWindowPos.x+cameraZoom/2, tileWindowPos.y+cameraZoom/2)
				ctx.rotate(rotation/2*Math.PI);
				ctx.drawImage(this.assets['road-'+building.roadType], -cameraZoom/2-0.5, -cameraZoom/2-0.5, cameraZoom+1, cameraZoom+1)
				ctx.restore()

				// draw congestion
				if(building.congestion > 100) {
					ctx.fillStyle = new Color(building.congestion/2, 255-building.congestion/2, 0, Math.min(Math.max(building.congestion/2000, 0.05), 0.2)).toString()
					ctx.fillRect(tileWindowPos.x, tileWindowPos.y, cameraZoom, cameraZoom)
				}
			}

			if(tile.building.type === BuildingTypes.station) {
				let station = tile.building as BuildingMetroStation
				let asset = this.assets[`metro-station`]
				ctx.drawImage(asset, tileWindowPos.x-0.5, tileWindowPos.y-0.5, cameraZoom+1, cameraZoom+1)
			}

			if(tile.building.type === BuildingTypes.house) {
				let house = tile.building as BuildingHouse
				let asset = this.assets[`house-${house.level}`]
				//tile.debugValues['a'] = `house-${house.level}`
				let yPos = tileWindowPos.y
				let height = cameraZoom
				if(house.level === 2) {
					yPos-=cameraZoom
					height = cameraZoom*2
				}
				ctx.drawImage(asset, tileWindowPos.x, yPos, cameraZoom, height)
			}

			if(tile.debugColor) {

				ctx.fillStyle = tile.debugColor.toString()
				ctx.fillRect(tileWindowPos.x, tileWindowPos.y, cameraZoom, cameraZoom)
			}

			if(tile.debugValues) {
				let idx = 1
				for(let name in tile.debugValues) {
					let value = tile.debugValues[name]
					let text = `${name}: ${value}`
					let fontSize = cameraZoom/5

					ctx.fillStyle = new Color(0, 0, 0).toString()
					ctx.strokeStyle = new Color(255, 255, 255).toString()
					ctx.font = `${fontSize}px Arial`
					ctx.fillText(text, tileWindowPos.x, tileWindowPos.y+idx*fontSize)
					ctx.strokeText(text, tileWindowPos.x, tileWindowPos.y+idx*fontSize)

					idx++
				}
			}
		})
	}
	gridToWindowPos(pos:Vector) {
		let convertedPos = new Vector(0, 0)
		let camera = this.camera
		convertedPos.x = ((pos.x-camera.pos.x)*camera.zoomValue)
		convertedPos.y = ((pos.y-camera.pos.y)*camera.zoomValue)
		return convertedPos
	}
	windowToGridPos(pos:Vector) {
		let convertedPos = new Vector(0, 0)
		let camera = this.camera
		convertedPos.x = pos.x/camera.zoomValue + camera.pos.x
		convertedPos.y = pos.y/camera.zoomValue + camera.pos.y
		return convertedPos
	}


}