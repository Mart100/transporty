import { Vector } from "./Vector";

export class Utils {

	static sleep(ms:number) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(true)
			}, ms)
		})
	}

	static randomRange(min:number, max:number) {
		return Math.random() * (max - min) + min;
	}

	static quadraticBezierCurve(start:Vector, control:Vector, end:Vector, t:number) {
		let x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * control.x + t * t * end.x;
		let y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * control.y + t * t * end.y;
		return new Vector(x, y)
	}
}