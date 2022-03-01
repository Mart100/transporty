import React, { ReactElement } from "react"
import { game } from "../App"
import { loadGamefile, saveGamefile, showLoadGamefile } from '../classes/gamefile'
import { TopmenuSubmenu } from "./TopmenuSubmenu"
import benchmarkSave1 from "../benchmark-saves/1"
import { Benchmarking } from "../classes/Benchmarking"


interface TopmenuItem {
	image:string
	submenu?:ReactElement
	onClick?:() => void
}

type Props = {}
type State = { items:TopmenuItem[]}

export class Topmenu extends React.Component<Props, State> {

	constructor(props:Props) {
		super(props)
		this.state = {
			items: [
				{
					image: './assets/save.png',
					submenu: <TopmenuSubmenu items={[
						{
							text: 'Save',
							onClick: () => {
								saveGamefile()
							}
						},
						{
							text: 'Load',
							onClick: async () => {
								let result = await showLoadGamefile()
								if(result === true && game.started === false) game.start()
							}
						}
					]}></TopmenuSubmenu>
				},
				{
					image: './assets/play.png',
					onClick: () => {
						console.log('start')
						if(game.started === false) game.start()
						else {
							game.paused = !game.paused
						}
					}
				},
				{
					image: './assets/benchmark.png',
					submenu: <TopmenuSubmenu items={[
						{
							text: 'Tick test',
							onClick: async () => {
								console.log(benchmarkSave1)
								await loadGamefile(benchmarkSave1)
								game.start({
									benchmarking: new Benchmarking({
										ticks: 800,
										rendering:true
									})
								})
							}
						},
					]}></TopmenuSubmenu>
				}
			]
		}
	}
	render() {

		let itemsHTML = []

		for(let item of this.state.items) {

			let styles:React.CSSProperties = {}
			if(item.onClick) styles.cursor = 'pointer'

			itemsHTML.push(
				<div key={item.image} onClick={item.onClick} style={styles}>
					<img alt="" src={item.image}></img>
					{item.submenu}
				</div>
			)
		}

		return <div id="topmenu">{itemsHTML}</div>
	}
}