import { game } from "../App"
import { Vector } from "./Vector"

export class Camera {
	zoomValue:number
	pos:Vector

	constructor() {
		this.zoomValue = 20
		this.pos = new Vector(0, 0)
	}

	move(movement:Vector) {
		this.pos.minus(movement)
		game.renderer.tilesFrame(true)
	}

	zoom(zoomAmount:number, mousePos:Vector) {

		let previousZoom = this.zoomValue+0
		this.zoomValue *= zoomAmount+1

    if(this.zoomValue <= 10 && zoomAmount < 0) return this.zoomValue = previousZoom
    if(this.zoomValue >= 400 && zoomAmount > 0) { this.zoomValue = 400; zoomAmount = (400-previousZoom)/400 }
    
		let width = game.renderer.window.x
		let height = game.renderer.window.y


		this.pos.x += ((width*zoomAmount)*(mousePos.x/width))/this.zoomValue
		this.pos.y += ((height*zoomAmount)*(mousePos.y/height))/this.zoomValue


		game.renderer.tilesFrame(true)

	}
}