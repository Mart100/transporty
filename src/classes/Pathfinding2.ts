import { game } from "../App"
import { BuildingRoad, BuildingTypes } from "./Building"
import { Color } from "./Color"
import { Tile } from "./Grid"
import { Utils } from "./Utils"
import { Vector } from "./Vector"

class PathfindingTile2 {
	f = 0
	g = 0
	h = 0
	t = 0
	pos:Vector
	parent:PathfindingTile2|null = null
	tile:Tile
	isRoad:boolean
	isStation:boolean

	constructor(tile:Tile) {
		this.pos = tile.pos
		this.tile = tile
		this.isRoad = tile.building.type === BuildingTypes.road
		this.isStation = tile.building.type === BuildingTypes.station
	}

	neighbors() {
		let neighbors:PathfindingTile2[] = []
		let neighborsPosRelative = [new Vector(-1, 0), new Vector(0, 1), new Vector(1, 0), new Vector(0, -1)]
		for(let neighborRelativePos of neighborsPosRelative) {
			let neighborPos = neighborRelativePos.plus(this.pos)
			if(!game.world.grid.data[neighborPos.x]) continue
			if(!game.world.grid.data[neighborPos.x][neighborPos.y]) continue
			neighbors.push(new PathfindingTile2(game.world.grid.data[neighborPos.x][neighborPos.y]))
		}

		if(this.isStation) {
			let connectedLines = game.world.metrolines.filter(line => line.points[0].pos.equals(this.pos) || line.points[1].pos.equals(this.pos))

			let connectedStations = connectedLines.map(line => {
				if(line.points[0].pos.equals(this.pos)) return new PathfindingTile2(line.points[1])
				else return new PathfindingTile2(line.points[0])
			})

			neighbors = neighbors.concat(connectedStations)


		}
		return neighbors
	}
}

// https://briangrinstead.com/blog/astar-search-algorithm-in-javascript/


export class Pathfinding2 {
	start:Tile
	finish:Tile
	debug:boolean = false
	autoDestroy:boolean = false
	open:PathfindingTile2[] = []
	closed:PathfindingTile2[] = []
	grid:PathfindingTile2[][] = []
	iterations:number = 0
	smartPath=false
	constructor(start:Tile, finish:Tile) {
		this.start = start
		this.finish = finish
	}

	async findPath() {

		this.open.push(new PathfindingTile2(this.start))
		while(this.iterations < 1000 && this.open.length > 0) {

			if(this.debug) await Utils.sleep(200)

			let lowestFTile = 0
			for(let tileIdx in this.open) if(this.open[tileIdx].f < this.open[lowestFTile].f) lowestFTile = Number(tileIdx)

			let currentTile = this.open[lowestFTile]
			if(currentTile === undefined) console.log(this)

			// finish found
			if(currentTile.pos.clone().minus(this.finish.pos).getMagnitude() === 1) {
				let reversedPath = []
				let current = currentTile
				while(current.parent) {
					reversedPath.push(current)
					current = current.parent
				}
				let path = reversedPath.reverse()
				if(this.debug) for(let road of path) road.tile.debugColor = new Color(255, 0, 0, 0.5)
				if(this.autoDestroy && this.debug) this.destroy()
				return path.map(pathTile => pathTile.tile)
			}

			this.open.splice(lowestFTile, 1)
			this.closed.push(currentTile)

			let neighbors = currentTile.neighbors()
			for(let neighborIdx in neighbors) {
				let neighbor = neighbors[neighborIdx] as PathfindingTile2

				if(!neighbor.isRoad && !neighbor.isStation) continue
				if(this.closed.some(tile => tile.pos.equals(neighbor.pos))) continue

				if(currentTile.g === undefined) currentTile.g = 0

				let t=0
				let g = currentTile.g+1
				if(this.smartPath && currentTile.isRoad) {
					t = (neighbor.tile.building as BuildingRoad).congestion/100
					if((neighbor.tile.building as BuildingRoad).trafficLight !== undefined) t+=2
					g+=t
				}
				let bestG = false

				if(!this.open.some(tile => tile.pos.equals(neighbor.pos))) {
					bestG = true
					neighbor.h = neighbor.pos.clone().minus(this.finish.pos).getMagnitude()
					this.open.push(neighbor)

				}

				else if(g < neighbor.g) bestG = true

				if(bestG) {
					neighbor.parent = currentTile
					neighbor.g = g
					neighbor.f = g+neighbor.h+t

					if(this.debug) {
						neighbor.tile.debugValues['f'] = Math.round(neighbor.f*10)/10+''
						neighbor.tile.debugValues['g'] = Math.round(neighbor.g*10)/10+''
						neighbor.tile.debugValues['h'] = Math.round(neighbor.h*10)/10+''
						if(t) neighbor.tile.debugValues['t'] = Math.round(t*10)/10+''
						neighbor.tile.debugColor = new Color(0, 255, 0, 0.2)
					}
				}
			}
		}
		return []
	}

	destroy() {

		if(this.debug) {
			for(let road of [...this.closed, ...this.open]) {
				road.tile.debugColor = undefined;
				delete road.tile.debugValues['f'];
				delete road.tile.debugValues['g'];
				delete road.tile.debugValues['h'];
				delete road.tile.debugValues['t'];
			}
		}
	}
}