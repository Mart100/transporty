import { Tile } from "./Grid";
import { Vector } from "./Vector";


export interface Metrotunnel {
	points: [Tile, Tile]
}

export interface Metroline {
	points: [Tile, Tile]
}

export class MetroVehicle {
	line:Metroline
	pos:number = 0
	capacity = 50

	constructor(line:Metroline) {
		this.line = line
	}

}