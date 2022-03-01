import { globalDebugValues } from "../HUD/DebugPanel";
import { Benchmarking } from "./Benchmarking";
import { BuildingRoad, BuildingTypes } from "./Building";
import { InputHandler } from "./InputHandler";
import { Renderer } from "./Renderer";
import { World } from "./World";

interface GameStartOptions {
	benchmarking:Benchmarking
}

export class Game {
	renderer:Renderer
	world:World
	inputHandler:InputHandler
	tickCount:number = 0
	performanceMeasurements:Record<string, number> = {}
	started=false
	tripsCompleted=0
	paused=false
	autoStart=true
	autoLoad=true
	temp:Record<string, any> = {}

	benchmarking:Benchmarking|undefined

	cityGrowth = 20

	constructor() {
		this.renderer = new Renderer()
		this.world = new World()
		this.inputHandler = new InputHandler()
		
	}
	start(options?:GameStartOptions) {

		if(this.started === true) return

		if(options?.benchmarking) this.benchmarking = options.benchmarking

		this.world.create()
		if(this.benchmarking) {
			if(this.benchmarking.rendering) this.renderer.start()
		}
		else this.renderer.start()
		this.inputHandler.startInputLoop()

		setInterval(() => {
			this.measurePerformance(() => {
				this.tick()
			}, 'tick', 20)
		}, 10)

		console.log('GAME STARTED')
		this.started = true

		if(this.benchmarking) this.benchmarking.startTime = performance.now()
	}

	measurePerformance(func:Function, name:string, averaging:number=10) {
		let timeStartDrawTiles = performance.now()
		func()
		let timeTaken = performance.now()-timeStartDrawTiles
		if(this.performanceMeasurements[name] === undefined) this.performanceMeasurements[name] = 0
		this.performanceMeasurements[name] = ((this.performanceMeasurements[name]*(averaging-1))+timeTaken)/averaging
	}

	tick() {

		if(this.paused) return

		this.tickCount += 1

		// check if benchmarking has finished
		if(this.benchmarking) {
			if(this.tickCount > this.benchmarking.ticks && this.benchmarking.finished === false) {
				let now = performance.now()
				let timeElapsed = now-this.benchmarking.startTime
				console.log('BENCHMARKING ENDED: TOOK ', timeElapsed, 'ms')
				globalDebugValues['benchmark-result'] = { val: timeElapsed + 'ms' }
				delete globalDebugValues['benchmarking-progress']
				this.benchmarking.finished = true
				this.paused = true
			}
		}

		// calculate which tiles all cars are on
		this.world.roads.forEach(road => road.cars = [])
		for(let car of this.world.cars) {
			if(car.currentTile.building.type !== BuildingTypes.road) continue
			let carTile = car.currentTile.building as BuildingRoad

			carTile.cars.push(car)
		}

		for(let car of this.world.cars) car.tick()

		for(let ped of this.world.pedestrians) ped.tick()


		// grow city
		if(this.tickCount % Math.floor(1000/this.cityGrowth) === 0 && !this.benchmarking?.disableCityGrowth) {
			
			this.measurePerformance(() => {
				this.world.growRoads(5)
			}, 'grow-roads')

			this.measurePerformance(() => {
				this.world.growBuildings(3)
			}, 'grow-houses')
			
		}

		// put data in debugValues
		if(this.tickCount % 15 === 0) {
			for(let name in this.performanceMeasurements) {
				globalDebugValues[name] = { val: Math.round(this.performanceMeasurements[name]*10)/10 }
			}
			globalDebugValues['cars'] = { val: this.world.cars.length+'' }
			globalDebugValues['peds'] = { val: this.world.pedestrians.length+'' }
			globalDebugValues['houses'] = { val: this.world.houses.length+'' }
			globalDebugValues['tickCount'] = { val: this.tickCount+'' }
			globalDebugValues['tripsComp'] = { val: this.tripsCompleted+'' }

			if(this.benchmarking && this.benchmarking.finished === false) {
				globalDebugValues['benchmarking-progress'] = { val: Math.floor((this.tickCount/this.benchmarking.ticks)*100) + '%' }
			}
		}


		if(this.tickCount % 10 === 0) {
			this.world.roads.forEach(road => {
				road.congestion /= 1.05
				//road.tile.debugValues['c'] = Math.round(road.congestion)+''
			})
		}

		// new trips
		if(this.tickCount % 10 === 0) {
			this.measurePerformance(() => {
				let houses = this.world.houses.length
				if(this.world.cars.length+this.world.pedestrians.length < houses) {
					let amount = Math.ceil(houses/100)
					for(let i=0;i<amount;i++) this.world.randomNewTrip()
				}
			}, 'new-trips')

			
		}

		// change traffic lights
		if(this.tickCount % 50 === 0) {

			this.measurePerformance(() => {
				// change trafficlights
				this.world.trafficLights.forEach(tile => {
					if(tile.building.type === BuildingTypes.road) {
						let road = tile.building as BuildingRoad
						if(road.trafficLight !== undefined) {
							road.trafficLight+=1
							if(road.trafficLight >= road.roadNeighbors.length) road.trafficLight = 0
						}
					}
				})
			}, 'change-trafficlights')


		}
	}

}