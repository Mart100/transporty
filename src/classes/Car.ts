import { game } from "../App"
import { BuildingHouse, BuildingRoad, BuildingTypes } from "./Building"
import { Color } from "./Color"
import { Tile } from "./Grid"
import { Utils } from "./Utils"

export class Car {
	path:Tile[]
	color:Color
	highlight:Color|null = null
	pathProgress = 0
	tileProgress = 0
	maxSpeed:number
	speed:number = 0
	debugValues:Record<string, string> = {}
	tickCount:number = 0
	averageSpeed:number = 0

	constructor(path:Tile[]) {
		this.path = path
		this.color = Color.random()

		this.maxSpeed = Utils.randomRange(40, 50)

		game.world.cars.push(this)
	}

	get currentTile() {
		return this.path[this.pathProgress]
	}

	get previousTile() {
		if(this.pathProgress === 0) return this.path[this.pathProgress]
		return this.path[this.pathProgress-1]
	}

	get nextTile() {
		if(this.pathProgress+1 === this.path.length) return this.path[this.pathProgress]
		return this.path[this.pathProgress+1]
	}

	get nextNextTile() {
		if(this.pathProgress+2 >= this.path.length) return this.path[this.pathProgress]
		return this.path[this.pathProgress+2]
	}

	remove(finished:boolean=false) {
		let carIdx = game.world.cars.indexOf(this)
		game.world.cars.splice(carIdx, 1)

		if(finished) {
			let startTile = this.path[0]
			let startHouse = startTile.building as BuildingHouse

			startHouse.finishedTrips++
			//startTile.debugValues['t'] = startHouse.finishedTrips+''
			game.tripsCompleted++
		}


	}

	tick() {

		this.tickCount++

		// set congestion
		let road = this.currentTile.building as BuildingRoad
		let nextRoad = this.nextTile.building as BuildingRoad
		road.congestion += 1

		// check if in curve
		let carInCurve = false
		let carInInnerCurve = false
		if(this.previousTile.pos.clone().minus(this.nextTile.pos).getMagnitude() < 2) carInCurve = true
		if(carInCurve) {
			let angleA = this.previousTile.pos.clone().minus(this.currentTile.pos).getAngle()
			let angleB = this.nextTile.pos.clone().minus(this.currentTile.pos).getAngle()
			if(angleA > angleB) carInInnerCurve = true
			//this.debugValues['a'] = angleA/Math.PI + ''
			//this.debugValues['b'] = angleB/Math.PI + ''
		}
		//this.debugValues['c'] = carInCurve ? '1' : '0'
		//this.debugValues['i'] = carInInnerCurve ? '1' : '0'

		// keep distance from car infront
		if(road.type === BuildingTypes.road && nextRoad.type === BuildingTypes.road) {
			let carRequiredDistance = 0.5
			if(carInCurve && carInInnerCurve) carRequiredDistance = 1
			/*
			let carsOnTile = game.world.cars.filter(car => 
				car.currentTile.pos.equals(this.currentTile.pos) 
				&& (car.previousTile.pos.equals(this.previousTile.pos) 
						|| car.nextTile.pos.equals(this.nextTile.pos)) 
			)
			*/
			let carsOnTile = road.cars.filter(car => (car.previousTile.pos.equals(this.previousTile.pos) || car.nextTile.pos.equals(this.nextTile.pos)))
			//let carsOnNextTile = game.world.cars.filter(car => car.currentTile.pos.equals(this.nextTile.pos) && car.nextTile.pos.equals(this.nextNextTile.pos))
			let carsOnNextTile = nextRoad.cars.filter(car => car.nextTile.pos.equals(this.nextNextTile.pos))
			let carsInFront = [...carsOnTile.filter(car => car.tileProgress > this.tileProgress), ...carsOnNextTile]
			if(carsInFront.length > 0) {
				let closestCar = carsInFront.sort((a, b) => {
					let tileProgressA = a.currentTile.pos.equals(this.currentTile.pos) ? a.tileProgress : 1+a.tileProgress
					let tileProgressB = b.currentTile.pos.equals(this.currentTile.pos) ? b.tileProgress : 1+b.tileProgress
					return tileProgressA-tileProgressB
				})[0]
	
				let carDistance = closestCar.tileProgress-this.tileProgress
				if(!closestCar.currentTile.pos.equals(this.currentTile.pos)) carDistance+=1
	
				if(carDistance<carRequiredDistance) {
					this.highlight = closestCar.color
					this.speed = closestCar.speed*(carDistance/carRequiredDistance)
				}
				else {
					this.speed = (closestCar.speed+this.maxSpeed)/2
				}
	
			}
			else {
				this.speed = this.maxSpeed
				this.highlight = null
			}
		}


		else {
			this.speed = this.maxSpeed
			this.highlight = null
		}

		this.averageSpeed = ((this.tickCount*this.averageSpeed)+this.speed)/(this.tickCount+1)
		this.debugValues['t'] = this.tickCount + ''
		this.debugValues['s'] = Math.floor(this.averageSpeed*10)/10 + ''
		if(this.averageSpeed < 5 && this.tickCount > 400) {
			this.remove()
		}

		if(carInCurve) {
			if(carInInnerCurve) {
				//this.speed *= 2
			} else {
				this.speed *= 0.8
			}
		}
		this.tileProgress += 0.005*this.speed

		if(this.tileProgress >= 1) {

			// wait at incoming junctions
			let nextTile = this.nextTile.building as BuildingRoad
			if(nextTile.trafficLight !== undefined && this.currentTile.building.type === BuildingTypes.road) {
				let greenLight = nextTile.roadNeighbors[nextTile.trafficLight].pos.equals(this.currentTile.pos)
				if(!greenLight) {
					this.tileProgress = 1
					this.speed = 0
					return
				}
			}

			this.tileProgress = 0
			this.pathProgress += 1

			if(this.pathProgress+1 === this.path.length) this.remove(true)

			// nextTile isn't a road
			if(nextTile.type !== BuildingTypes.road && nextTile.type !== BuildingTypes.station) this.remove()
		}
	}
}