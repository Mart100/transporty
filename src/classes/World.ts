import { game } from "../App";
import { BuildingHouse, BuildingMetroStation, BuildingRoad, BuildingTypes } from "./Building";
import { Car } from "./Car";
import { Color } from "./Color";
import { Grid, Tile } from "./Grid";
import { Metroline } from "./Metro";
import { Pathfinding } from "./Pathfinding";
import { Pathfinding2 } from "./Pathfinding2";
import { Pedestrian } from "./Pedestrian";
import { Utils } from "./Utils";
import { Vector } from "./Vector";

export class World {
	grid:Grid
	cars:Car[] = []
	trafficLights:Tile[] = []
	roads:BuildingRoad[] = []
	houses:BuildingHouse[] = []
	stations:BuildingMetroStation[] = []
	metrolines:Metroline[] = []
	pedestrians:Pedestrian[] = []
	
	constructor() {
		this.grid = new Grid(new Vector(200, 200))
	}

	create() {

	}

	growBuildings(amount=1) {

		let beginRoad
		if(this.roads.length === 0) beginRoad = this.grid.data[this.grid.center.x][this.grid.center.y]
		else beginRoad = this.roads[Math.floor(Math.random()*this.roads.length)].tile

		let open:Tile[] = [beginRoad]
		let closed:Tile[] = []
		let iterations = 0
		let buildingsBuilt = 0

		while(iterations < 100 && open.length > 0 && buildingsBuilt<amount) {
			let road = open[Math.floor(Math.random()*open.length)]
			let neighbors = road.allNeighbors()

			iterations++
			open.splice(open.indexOf(road), 1)
			closed.push(road)

			for(let n of neighbors) {
				if(n.building.type === BuildingTypes.none || n.building.type === BuildingTypes.tree) {
					if(Math.random() > 0.9) {
						let result = this.growNewBuilding(n)
						if(result) buildingsBuilt++ 
					}
				} else if(n.building.type === BuildingTypes.road) {
					if(open.some(road => road.pos.equals(n.pos))) continue
					if(closed.some(road => road.pos.equals(n.pos))) continue
					open.push(n)
				} else if(n.building.type === BuildingTypes.house) {
					if(Math.random() > 0.99) {
						let house = n.building as BuildingHouse
						if(house.finishedTrips >= 10 && house.level === 1) house.level = 2
					} 
				}
			}
		}
	}
	growNewBuilding(roadTile:Tile) {
		if(roadTile.building.type === BuildingTypes.road) return false
		else {
			roadTile.building = new BuildingHouse(roadTile)
			return true
		}
	}
	async growRoads(amount:number=1) {
		let beginRoad
		if(this.roads.length === 0) beginRoad = this.grid.data[this.grid.center.x][this.grid.center.y]
		else beginRoad = this.roads[Math.floor(Math.random()*this.roads.length)].tile
		
		let open:Tile[] = [beginRoad]
		let closed:Tile[] = []
		let iterations = 0
		let roadsBuilt = 0

		while(iterations < 100 && open.length > 0 && roadsBuilt<amount) {
			let road = open[Math.floor(Math.random()*open.length)]
			let neighbors = road.allNeighbors()
			neighbors = neighbors.sort(() => Math.random()-Math.random())

			//await Utils.sleep(100)

			iterations++
			open.splice(open.indexOf(road), 1)
			closed.push(road)
			//road.debugColor = new Color(255, 0, 0, 0.2)

			for(let n of neighbors) {
				if(n.building.type !== BuildingTypes.road) {
					if((road.building as BuildingRoad).roadNeighbors.length <= 2 || Math.random()>0.9) {
						let result = this.growNewRoad(n)
						if(result) roadsBuilt++
					}
				}
				else {
					if(open.some(road => road.pos.equals(n.pos))) continue
					if(closed.some(road => road.pos.equals(n.pos))) continue
	
					open.push(n)
					//n.debugColor = new Color(0, 255, 0, 0.2)
				}
			}
		}

		//for(let road of closed) road.debugColor = undefined
	}
	growNewRoad(roadTile:Tile) {

		if(roadTile.building.type !== BuildingTypes.none && roadTile.building.type !== BuildingTypes.tree) return false
		
		let neighbors = roadTile.all8Neighbors()!
		let roadNeighbor = neighbors.filter(neighbor => neighbor.building.type === BuildingTypes.road)
		let allowedNeighbors = Math.random()*5
		if(allowedNeighbors > 3) allowedNeighbors=3

		// prevent 2x2 squares
		let neighborAreRoads = ''
		neighbors.forEach(n => { 
			if(n.building.type === BuildingTypes.road) neighborAreRoads += '-'
			else neighborAreRoads += ' '
		})
		neighborAreRoads += neighborAreRoads
		if(neighborAreRoads.includes('---')) return false

		if(roadNeighbor.length > allowedNeighbors) return false
		else {
			roadTile.building = new BuildingRoad(roadTile)
			return true
		}
	}
	allHouses() {
		let houses:Tile[] = []
		this.grid.foreach((tile) => {
			if(tile.building.type === BuildingTypes.house) houses.push(tile)
		})
		return houses
	}

	async randomNewTrip() {
		let allHouses = game.world.houses
		let house1 = allHouses[Math.floor(Math.random()*allHouses.length)].tile
		let house2 = allHouses[Math.floor(Math.random()*allHouses.length)].tile

		let pathFinder = new Pathfinding(house1, house2)

		let path = await pathFinder.findPath()

		if(path.length > 5) {

			path.unshift(house1)
			path.push(house2)

			let metroTrip = path.some(tile => tile.building.type === BuildingTypes.station)
			//metroTrip = false
			setTimeout(() => {
				if(metroTrip) new Pedestrian(path)
				else new Car(path)
			}, Math.random()*1000)
			

			//house1.debugColor = new Color(car.color.r, car.color.g, car.color.b, 0.6)
			//house2.debugColor = new Color(car.color.r, car.color.g, car.color.b, 0.6)
		}
		
	}


	//==================================
	//==============LEGACY==============
	//==================================

	growBuildings0() {
		let middleRoad = this.grid.data[this.grid.center.x][this.grid.center.y]
		this.growBuildingsRecursive(middleRoad, 0, [])
	}
	growBuildingsRecursive(road:Tile, i:number, roadsVisited:Vector[]) {
		if(i > 100) return
		roadsVisited.push(road.pos)

		let neighbors = road.allNeighbors()!
		neighbors = neighbors.sort(() => Math.random()-Math.random())

		// make building
		if(Math.random()>0.9) {
			let emptyNeighbors = neighbors.filter(n => n.building.type === BuildingTypes.none || n.building.type === BuildingTypes.tree)
			if(emptyNeighbors.length > 0) {
				let successfull = this.growNewBuilding(emptyNeighbors[0])
				if(successfull) return
			}
		}

		// follow road
		else {
			let roadNeighbor = neighbors.find(neighbor => neighbor.building.type === BuildingTypes.road && !roadsVisited.some(pos => pos.equals(neighbor.pos)))
			if(roadNeighbor) {
				this.growBuildingsRecursive(roadNeighbor, ++i, roadsVisited)
				return
			}
		}
		this.growBuildingsRecursive(road, ++i, roadsVisited)
	}
}