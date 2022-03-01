export class Vector {
	x: number
	y: number

	constructor(x:number, y:number) {
		this.x = x
		this.y = y

		if(this.x === undefined) this.x = 0
		if(this.y === undefined) this.y = 0
		
	}
	multiply(vec1:Vector) : Vector {
		this.x *= vec1.x
		this.y *= vec1.y
		return this
	}
	plus(vec1:Vector) : Vector {
		this.x += vec1.x
		this.y += vec1.y
		return this
	}
	minus(vec1:Vector) : Vector {
		this.x -= vec1.x
		this.y -= vec1.y
		return this
	}
	divide(vec1:Vector) : Vector {
		this.x /= vec1.x
		this.y /= vec1.y
		return this
	}
	rotate(angle:number) : Vector {
		let x1 = Math.cos(angle) * this.x - Math.sin(angle) * this.y
		let y1 = Math.sin(angle) * this.x + Math.cos(angle) * this.y

		this.x = x1
		this.y = y1
		
		return this
	}
	string() : string { 
		return this.x+'|'+this.y
	}
	getAngle() : number {
		let angle = Math.atan2(this.y, this.x)
		return angle
	}
	getAngleDegrees() : number {
		let angle = Math.atan2(this.y, this.x)
		let degrees = 180*angle/Math.PI  //degrees
		return (360+Math.round(degrees))%360 //round number, avoid decimal fragments
	}
	setMagnitude(to:number) : Vector {
		let magnitude = this.getMagnitude()

		if(magnitude === 0) return this

		let x = (this.x/magnitude)*to
		let y = (this.y/magnitude)*to

		this.x = x
		this.y = y

		return this
	}
	getMagnitude() : number {
		if(this.x === 0 && this.y === 0) return 0
		let magnitude = Math.sqrt(this.x*this.x + this.y*this.y)
		return magnitude
	}
	clone() : Vector {
		return new Vector(this.x, this.y)
	}
	equals(vec1:Vector) {
		return this.x===vec1.x&&this.y===vec1.y
	}
	floor() {
		this.x = Math.floor(this.x)
		this.y = Math.floor(this.y)
		return this
	}
	round() {
		this.x = Math.round(this.x)
		this.y = Math.round(this.y)
		return this
	}
	middle(vec1:Vector) {
		return vec1.clone().plus(this).divide(new Vector(2, 2))
	}
}