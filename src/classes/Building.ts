import { game } from "../App"
import { Car } from "./Car"
import { Tile } from "./Grid"
import { Vector } from "./Vector"

export enum BuildingTypes {
	house,
	tree,
	road,
	station,
	none
}

export class Building {
	tile:Tile
	type:BuildingTypes = BuildingTypes.none
	constructor(baseTile:Tile) {
		this.tile=baseTile
	}

	destroy() {
		if(this.type === BuildingTypes.road) {

			let road = this as unknown as BuildingRoad

			game.world.roads.splice(game.world.roads.indexOf(road), 1)

			let trafficLightIdx = game.world.trafficLights.indexOf(road.tile)
			if(trafficLightIdx !== -1) game.world.trafficLights.splice(trafficLightIdx, 1)

			this.tile.building = new Building(this.tile)
			this.tile.eachNeighbor((neighbor) => {
				if(neighbor.building.type !== BuildingTypes.road) return
				(neighbor.building as BuildingRoad).updateRoadType()
			})
			
		}
		if(this.type === BuildingTypes.house) {

			let house = this as unknown as BuildingHouse

			let houseIdx = game.world.houses.indexOf(house)
			if(houseIdx !== -1) game.world.houses.splice(houseIdx, 1)

			this.tile.building = new Building(this.tile)
		}
		if(this.type === BuildingTypes.station) {
			let station = this as unknown as BuildingMetroStation

			let stationIdx = game.world.stations.indexOf(station)
			if(stationIdx !== -1) game.world.stations.splice(stationIdx, 1)

			this.tile.building = new Building(this.tile)
		}
	}
}
export class BuildingTree extends Building {
	constructor(tile:Tile) {
		super(tile)
		this.type = BuildingTypes.tree
	}
}

export class BuildingHouse extends Building {
	level:number = 1
	finishedTrips:number = 0
	constructor(tile:Tile) {
		super(tile)
		this.type = BuildingTypes.house

		game.world.houses.push(this)
	}
}

export class BuildingMetroStation extends Building {
	constructor(tile:Tile) {
		super(tile)
		this.type = BuildingTypes.station

		game.world.stations.push(this)
	}
}

export class BuildingRoad extends Building {
	roadType:string = '0'
	roadNeighbors:Tile[] = []
	cars:Car[] = []
	roadDirection:number = 0
	trafficLight?:number
	congestion = 0
	constructor(tile:Tile, options:Record<string, any>={}) {
		super(tile)
		this.type = BuildingTypes.road

		if(options.update !== false) this.updateRoadType()

	}

	updateRoadType(origin?:Tile) {
		let roadNeighbors:Tile[] = []
		let nonRoadNeighbors:Tile[] = []

		this.roadDirection = 0
		this.roadNeighbors = []
		this.roadType = '0'
		this.trafficLight = undefined

		if(game.world.roads.indexOf(this) === -1) 
			game.world.roads.push(this)

		this.tile.eachNeighbor((neighbor) => {
			if(origin && neighbor.pos.equals(origin.pos)) roadNeighbors.push(neighbor)
			else if(neighbor.building.type === BuildingTypes.road) {
				roadNeighbors.push(neighbor)
				if(!origin) (neighbor.building as BuildingRoad).updateRoadType(this.tile)
			}
			else nonRoadNeighbors.push(neighbor)
		})

		let neighborsPosRelative = [new Vector(-1, 0), new Vector(0, -1), new Vector(1, 0), new Vector(0, 1)]

		this.roadNeighbors = roadNeighbors
		if(this.roadNeighbors.length > 2) {
			this.trafficLight = 0

			if(game.world.trafficLights.indexOf(this.tile) === -1) 
				game.world.trafficLights.push(this.tile)

		} else {

			let trafficLightIdx = game.world.trafficLights.indexOf(this.tile)
			if(trafficLightIdx !== -1) game.world.trafficLights.splice(trafficLightIdx, 1)
		}
		
		if(roadNeighbors.length===1) {
			this.roadType = '1'
			let diff = roadNeighbors[0].pos.clone().minus(this.tile.pos)
			let idx = neighborsPosRelative.indexOf(neighborsPosRelative.find(v => v.equals(diff))!)
			this.roadDirection = idx
		}


		else if(roadNeighbors.length===2) {

			let diffn1 = roadNeighbors[0].pos.clone().minus(this.tile.pos)
			let idxn1 = neighborsPosRelative.indexOf(neighborsPosRelative.find(v => v.equals(diffn1))!)

			let diffn2 = roadNeighbors[1].pos.clone().minus(this.tile.pos)
			let idxn2 = neighborsPosRelative.indexOf(neighborsPosRelative.find(v => v.equals(diffn2))!)

			let distBetweenNeighbors = roadNeighbors[0].pos.clone().minus(roadNeighbors[1].pos).getMagnitude()

			let rotation = idxn1
			if(idxn1 > idxn2) rotation = idxn2

			// straight
			if(distBetweenNeighbors === 2) {
				this.roadType = '2-1'
			}

			// corner
			else if(distBetweenNeighbors === Math.sqrt(2)) {
				this.roadType = '2-2'

				let diff = Math.abs(idxn1-idxn2)
				if(diff === 3) rotation -= 1
			}

			this.roadDirection = rotation
		}


		else if(roadNeighbors.length===3) {
			this.roadType = '3'
			let nonRoadneighbor = nonRoadNeighbors[0]!
			let diff = nonRoadneighbor.pos.clone().minus(this.tile.pos)
			let idx = neighborsPosRelative.indexOf(neighborsPosRelative.find(v => v.equals(diff))!)
			this.roadDirection = idx+1
			//if(this.roadDirection === 4) this.roadDirection = 2
			//if(this.roadDirection === 2) this.roadDirection = 4
		}


		else if(roadNeighbors.length===4) this.roadType = '4'

		//this.tile.debugValues['rot'] = this.roadDirection+''
	}
	
}