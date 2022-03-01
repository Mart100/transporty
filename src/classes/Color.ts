export class Color {
	r: number
	g: number
	b: number
	a: number

	constructor(r:number, g:number, b:number, a:number=255) {
		this.r = r
		this.g = g
		this.b = b
		this.a = a
	}

	equals(color2:Color) {
		if(this.r !== color2.r) return false
		if(this.g !== color2.g) return false
		if(this.b !== color2.b) return false
		if(this.a !== color2.a) return false
		return true
	}

	toString() {
		return `rgba(${this.r},${this.g},${this.b},${this.a})`
	}

	static random() {
		let r = Math.floor(Math.random()*255)
		let g = Math.floor(Math.random()*255)
		let b = Math.floor(Math.random()*255)

		return new Color(r, g, b)
	}

}