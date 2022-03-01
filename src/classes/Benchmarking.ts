export interface BenchmarkingOptions {
	ticks:number
	disableCityGrowth?:boolean
	rendering?:boolean

}

export class Benchmarking {
	ticks:number
	disableCityGrowth=true
	rendering=true
	startTime=0
	finished=false

	constructor(options:BenchmarkingOptions) {
		this.ticks = options.ticks
		if(options.disableCityGrowth !== undefined) this.disableCityGrowth = options.disableCityGrowth
		if(options.rendering !== undefined) this.rendering = options.rendering
	}
}