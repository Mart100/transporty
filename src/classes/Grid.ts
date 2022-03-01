import { game } from "../App"
import { Building, BuildingRoad, BuildingTree } from "./Building"
import { Color } from "./Color"
import { Vector } from "./Vector"

export class Grid {
	data: Tile[][] = []
	size: Vector
	center: Vector
	constructor(size:Vector) {

		this.size = size
		this.center = size.clone().divide(new Vector(2, 2))

		for(let x=0;x<size.x;x++) {
			this.data[x] = []
			for(let y=0;y<size.y;y++) {
				let tile = new Tile(new Vector(x, y))
				if(x === this.center.x && y === this.center.y) {
					tile.building = new BuildingRoad(tile, {update:false})
					tile.color = new Color(255, 0, 0)
				}

				this.data[x][y] = tile
			}	
		}

	}

	foreach(callback:(tile:Tile) => any) {
		for(let x=0;x<this.size.x;x++) {
			for(let y=0;y<this.size.y;y++) {
				const tile = this.data[x][y]
				callback(tile)
			}	
		}
	}
}

export class Tile {
	pos:Vector
	color:Color
	building:Building = new Building(this)
	debugValues:Record<string, string> = {}
	debugColor?:Color

	constructor(pos:Vector) {
		this.pos = pos
		this.color = new Color(255, 255, 255)

		//if(Math.random()>0.9) this.color = new Color(50, 50, 200) 

		if(Math.random()>0.9) this.building = new BuildingTree(this)
	}

	replaceBuilding(newBuilding:Building) {
		if(this.building) this.building.destroy()
		this.building = newBuilding
	}

	allNeighbors() {
		let neighbors:Tile[] = []
		let neighborsPosRelative = [new Vector(-1, 0), new Vector(0, 1), new Vector(1, 0), new Vector(0, -1)]
		for(let neighborRelativePos of neighborsPosRelative) {
			let neighborPos = neighborRelativePos.plus(this.pos)
			if(!game.world.grid.data[neighborPos.x]) continue
			if(!game.world.grid.data[neighborPos.x][neighborPos.y]) continue
			neighbors.push(game.world.grid.data[neighborPos.x][neighborPos.y])
		}
		return neighbors
	}

	all8Neighbors() {
		let neighbors:Tile[] = []
		let neighborsPosRelative = [new Vector(-1, 0), new Vector(-1, 1), new Vector(0, 1), new Vector(1, 1), new Vector(1, 0), new Vector(1, -1), new Vector(0, -1), new Vector(-1, -1)]
		for(let neighborRelativePos of neighborsPosRelative) {
			let neighborPos = neighborRelativePos.plus(this.pos)
			if(!game.world.grid.data[neighborPos.x]) continue
			if(!game.world.grid.data[neighborPos.x][neighborPos.y]) continue
			neighbors.push(game.world.grid.data[neighborPos.x][neighborPos.y])
		}
		return neighbors
	}

	eachNeighbor(func:(neighbor:Tile) => any) {
		let neighbors = this.allNeighbors()
		for(let neighbor of neighbors) func(neighbor)
	}
}