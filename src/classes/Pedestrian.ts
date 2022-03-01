import { game } from "../App";
import { BuildingHouse, BuildingTypes } from "./Building";
import { Color } from "./Color";
import { Tile } from "./Grid";
import { Utils } from "./Utils";
import { Vector } from "./Vector";

export class Pedestrian {
	path:Tile[]
	color:Color
	highlight:Color|null = null
	maxSpeed:number
	pathProgress = 0
	tileProgress = 0
	speed:number = 0
	debugValues:Record<string, string> = {}
	tickCount:number = 0
	averageSpeed:number = 0

	constructor(path:Tile[]) {
		this.path = path
		this.color = Color.random()

		this.maxSpeed = Utils.randomRange(2, 3)

		game.world.pedestrians.push(this)
	}
	getPathTile(i=0) {
		if(this.pathProgress+i >= this.path.length) return this.path[this.path.length-1]
		if(this.pathProgress+i <= 0) return this.path[0]
		return this.path[this.pathProgress+i]
	}

	tick() {

		this.tickCount++

		let inCurve = false
		let inInnerCurve = false
		if(this.getPathTile(-1).pos.clone().minus(this.getPathTile(1).pos).getMagnitude() < 2) inCurve = true
		if(inCurve) {
			let angleA = this.getPathTile().pos.clone().minus(this.getPathTile(-1).pos).getAngle()
			let pos2 = this.getPathTile().pos.clone().plus(new Vector(-1, 0).rotate(angleA-Math.PI/2))
			if(pos2.equals(this.getPathTile(1).pos)) inInnerCurve = true
		}

		let nextTile = this.getPathTile(1)

		this.speed = this.maxSpeed

		if(inCurve) {
			if(inInnerCurve) this.speed *= 4
			else this.speed *= 0.5
		}

		this.tileProgress += 0.005*this.speed

		if(this.tileProgress >= 1) {

			this.tileProgress = 0
			this.pathProgress += 1

			if(this.pathProgress+1 === this.path.length) this.remove(true)

			// nextTile isn't a road
			let nextTileType = nextTile.building.type
			if(nextTileType !== BuildingTypes.road && nextTileType !== BuildingTypes.station) this.remove()
		}
	}

	remove(finished:boolean=false) {
		let pedIdx = game.world.pedestrians.indexOf(this)
		game.world.pedestrians.splice(pedIdx, 1)

		if(finished) {
			let startTile = this.path[0]
			let startHouse = startTile.building as BuildingHouse

			startHouse.finishedTrips++
			game.tripsCompleted++
		}
	}
}