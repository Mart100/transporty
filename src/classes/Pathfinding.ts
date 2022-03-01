import { game } from "../App"
import BinaryHeap from "../libs/BinaryHeap"
import { BuildingRoad, BuildingTypes } from "./Building"
import { Color } from "./Color"
import { Tile } from "./Grid"
import { Utils } from "./Utils"
import { Vector } from "./Vector"

class PathfindingTile {
	f = 0
	g = 0
	h = 0
	t = 0
	visited = false
	closed = false
	pos:Vector
	parent:PathfindingTile|null = null
	tile:Tile
	isRoad:boolean
	isStation:boolean

	constructor(tile:Tile) {
		this.pos = tile.pos
		this.tile = tile
		this.isRoad = tile.building.type === BuildingTypes.road
		this.isStation = tile.building.type === BuildingTypes.station
	}
}

// https://briangrinstead.com/blog/astar-search-algorithm-in-javascript/


export class Pathfinding {
	start:Tile
	finish:Tile
	debug:boolean = false
	autoDestroy:boolean = false
	open:BinaryHeap
	grid:PathfindingTile[][] = []
	iterations:number = 0
	smartPath=false
	constructor(start:Tile, finish:Tile) {
		this.start = start
		this.finish = finish

		this.open = new BinaryHeap((node:PathfindingTile) => node.f)
		this.open.push(this.start)

	}

	async findPath() {

		this.open.push(new PathfindingTile(this.start))
		while(this.iterations < 1000 && this.open.size() !== 0) {

			this.iterations++

			if(this.debug) await Utils.sleep(20)

			let currentTile = this.open.pop()
			
			currentTile.closed = true

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

			let neighbors = this.neighbors(currentTile)
			for(let neighborIdx in neighbors) {
				let neighbor = neighbors[neighborIdx] as PathfindingTile

				if(!neighbor.isRoad && !neighbor.isStation) continue
				if(neighbor.closed) continue

				if(currentTile.g === undefined) currentTile.g = 0

				let t=0
				let g = currentTile.g+1
				if(this.smartPath && currentTile.isRoad) {
					if((neighbor.tile.building as BuildingRoad).congestion) t = (neighbor.tile.building as BuildingRoad).congestion/200
					if((neighbor.tile.building as BuildingRoad).trafficLight !== undefined) t+=1
					g+=t
				}
				if(currentTile.isStation) g+=5

				let beenVisited = neighbor.visited

				if(!neighbor.visited || g < neighbor.g) {
					
					neighbor.visited = true
					neighbor.parent = currentTile
					neighbor.h = neighbor.h || (Math.abs(neighbor.pos.x - this.finish.pos.x) + Math.abs(neighbor.pos.y - this.finish.pos.y))
					neighbor.g = g
					neighbor.f = g+neighbor.h

					if(!beenVisited) this.open.push(neighbor)

					else {
						this.open.rescoreElement(neighbor)
					}

					if(this.debug) {
						console.log(neighbor)
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


	neighbors(tile:PathfindingTile) {
		let neighbors:PathfindingTile[] = []
		let neighborsPosRelative = [new Vector(-1, 0), new Vector(0, 1), new Vector(1, 0), new Vector(0, -1)]
		for(let neighborRelativePos of neighborsPosRelative) {
			let neighborPos = neighborRelativePos.plus(tile.pos)
			if(this.grid[neighborPos.x] && this.grid[neighborPos.x][neighborPos.y]) {
				neighbors.push(this.grid[neighborPos.x][neighborPos.y])
			} else {
				if(!game.world.grid.data[neighborPos.x]) continue
				if(!game.world.grid.data[neighborPos.x][neighborPos.y]) continue
				let pathFindingTile = new PathfindingTile(game.world.grid.data[neighborPos.x][neighborPos.y])
				if(!this.grid[neighborPos.x]) this.grid[neighborPos.x] = []
				this.grid[neighborPos.x][neighborPos.y] = pathFindingTile
				neighbors.push(pathFindingTile)
			}

		}

		if(tile.isStation) {
			let connectedLines = game.world.metrolines.filter(line => line.points[0].pos.equals(tile.pos) || line.points[1].pos.equals(tile.pos))

			let connectedStations = connectedLines.map(line => {
				if(line.points[0].pos.equals(tile.pos)) return new PathfindingTile(line.points[1])
				else return new PathfindingTile(line.points[0])
			})

			neighbors = neighbors.concat(connectedStations)


		}
		return neighbors
	}

	destroy() {

		if(this.debug) {
			for(let road of this.open.content) {
				road.tile.debugColor = undefined;
				delete road.tile.debugValues['f'];
				delete road.tile.debugValues['g'];
				delete road.tile.debugValues['h'];
				delete road.tile.debugValues['t'];
			}
		}
	}
}