import $ from 'jquery'
import { game } from "../App"
import { Building, BuildingHouse, BuildingMetroStation, BuildingRoad, BuildingTree, BuildingTypes } from "./Building"
import { Vector } from "./Vector"
import { Grid } from "./Grid"

export async function showLoadGamefile() {
	return new Promise((resolve, reject) => {
								
		let form = $('body').append(`<form id="upload" style="display: none;">
			<label for="file">File to upload</label>
			<input type="file" id="file" accept=".json">
		</form>
		`)

		form.find('input').on('change', function (e) {
			
			if(!e.target.files || e.target.files.length === 0) return resolve(false)

			let file = e.target.files[0]

			let reader = new FileReader()

			const onLoad = async (event:any) => {
				let str = event.target.result
				let gridData = JSON.parse(str)
				loadGamefile(gridData)
				resolve(true)
			}

			reader.onload = onLoad
			reader.readAsText(file)
		})
		form.find('label').trigger('click')
	})

}

export function loadGamefile(worldData:any) {

	let gridData = worldData.grid
								
	game.world.cars = []
	game.world.trafficLights = []
	game.world.roads = []

	game.world.grid = new Grid(new Vector(gridData.length, gridData.length))

	for(let x=0;x<gridData.length;x++) {
		for(let y=0;y<gridData.length;y++) {
			let buildingType = gridData[x][y] as BuildingTypes
			let tile = game.world.grid.data[x][y]
			if(buildingType === BuildingTypes.house) tile.building = new BuildingHouse(tile)
			if(buildingType === BuildingTypes.road) tile.building = new BuildingRoad(tile)
			if(buildingType === BuildingTypes.tree) tile.building = new BuildingTree(tile)
			if(buildingType === BuildingTypes.station) tile.building = new BuildingMetroStation(tile)
			if(buildingType === BuildingTypes.none) tile.building = new Building(tile)
		}
	}

	let metrolines = worldData.metrolines

	for(let line of metrolines) {
		let station1 = game.world.grid.data[line[0].x][line[0].y]
		let station2 = game.world.grid.data[line[1].x][line[1].y]
		game.world.metrolines.push({points:[station1, station2]})
	}
}



export function saveGamefile() {

	let grid = game.world.grid
	let copiedGrid:BuildingTypes[][] = [] 

	for(let x=0;x<grid.size.x;x++) {
		copiedGrid[x] = []
		for(let y=0;y<grid.size.y;y++) {
			copiedGrid[x][y] = grid.data[x][y].building.type
		}
	}

	let worldData = {
		grid:copiedGrid,
		metrolines:game.world.metrolines.map(line => [line.points[0].pos, line.points[1].pos])
	}

	var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(worldData))
	var downloadAnchorNode = document.createElement('a')
	downloadAnchorNode.setAttribute("href", dataStr)
	downloadAnchorNode.setAttribute("download", 'saveFile.json')
	document.body.appendChild(downloadAnchorNode)
	downloadAnchorNode.click()
	downloadAnchorNode.remove()
}