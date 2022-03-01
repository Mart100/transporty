import $ from 'jquery';
import { game } from '../App';
import { toolbarSelected } from '../HUD/Toolbar';
import { Building, BuildingHouse, BuildingMetroStation, BuildingRoad, BuildingTypes } from './Building';
import { Vector } from './Vector';

export class InputHandler {
	keys:Record<string, boolean>
	mouseTileHover:Vector
	mousePos:Vector

	constructor() {

		this.mouseTileHover = new Vector(0, 0)
		this.mousePos = new Vector(0, 0)
		this.keys = {}

		$(document).on('mousemove', (e) => { this.onMouseMove(e) })
		$(document).on('DOMMouseScroll scroll', (e) => { this.onMouseScroll(e) })
		window.addEventListener('scroll', (e:any) => { this.onMouseScroll(e) })
		$(document).on('click', (e) => { this.onMouseClick(e) })
		
		$(document).on('keydown', (event) => { this.keys[event.code] = true })
		$(document).on('keyup', (event) => { this.keys[event.code] = false })
	}

	onMouseClick(event:JQuery.ClickEvent) {

		if(event.target.tagName !== 'CANVAS') return

		let mouseTileHover = game.world.grid.data[this.mouseTileHover.x][this.mouseTileHover.y]

		// right click
		console.log(event)

		if(toolbarSelected === 'metro-station') {
			mouseTileHover.replaceBuilding(new BuildingMetroStation(mouseTileHover))
		}
		if(toolbarSelected === 'metro-line') {
			console.log('metro line')
			if(mouseTileHover.building.type === BuildingTypes.station) {

				if(!game.temp['metro-line']) {
					console.log('metro line-1')
					game.temp['metro-line'] = { from:mouseTileHover }
				}

				else {
					let station1 = game.temp['metro-line'].from
					let station2 = mouseTileHover
					
					game.world.metrolines.push({points: [station1, station2]})

					delete game.temp['metro-line']
				}

			}
		}
		if(toolbarSelected === 'road') {
			mouseTileHover.replaceBuilding(new BuildingRoad(mouseTileHover))
		}
		if(toolbarSelected === 'house') {
			mouseTileHover.replaceBuilding(new BuildingHouse(mouseTileHover))
		}
		if(toolbarSelected === 'bulldozer') {
			mouseTileHover.building.destroy()
		}
		if(toolbarSelected === 'info') {
			console.log(mouseTileHover)
		}
	}

	onMouseMove(event:JQuery.MouseMoveEvent) {

		this.mousePos.x = event.clientX
		this.mousePos.y = event.clientY

		this.mouseTileHover = game.renderer.windowToGridPos(this.mousePos).clone().floor()

	}
	onMouseScroll(event:any) {

		let zoomOut = event.detail > 0 || event.wheelDelta < 0
		let camera = game.renderer.camera

		if(zoomOut) {
			camera.zoom(-0.1, this.mousePos)
		} 
		
		else {
			camera.zoom(0.1, this.mousePos)
		}

	}

	startInputLoop() {
		setInterval(() => {
			this.inputLoop()
		}, 10)
	}
	inputLoop() {


		// move camera
		let speed = (20/game.renderer.camera.zoomValue)
		let keys = this.keys
		let movement = new Vector(0, 0)
	
		if(keys["KeyW"] || keys["ArrowUp"]) { // north
			movement.plus(new Vector(0, speed))
		}
		if(keys["KeyA"] || keys["ArrowLeft"]) { // east
			movement.plus(new Vector(speed, 0))
		}
		if(keys["KeyS"] || keys["ArrowRight"]) { // south
			movement.plus(new Vector(0, -speed))
		}
		if(keys["KeyD"] || keys["ArrowLeft"]) { // west
			movement.plus(new Vector(-speed, 0))
		}
	
		// moved
		if(movement.getMagnitude() > 0) {
			game.renderer.camera.move(movement)
		}
	}
}