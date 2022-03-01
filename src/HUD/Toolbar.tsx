import React from "react";

export interface ToolbarItem {
	image:string
	name:string
}

export let toolbarSelected = ''

type Props = {}
type State = { items: ToolbarItem[] }

export class Toolbar extends React.Component<Props, State> {

  constructor(props:Props) {
    super(props)
    this.state = {
      items: [
				{
					image: './assets/road-2-1.png',
					name: 'road'
				},
				{
					image: './assets/bulldozer.png',
					name: 'bulldozer'
				},
				{
					image: './assets/info.png',
					name: 'info'
				},
				{
					image: './assets/house-1.png',
					name: 'house'
				},
				{
					image: './assets/metro-station.png',
					name: 'metro-station'
				},
				{
					image: './assets/metro-line.png',
					name: 'metro-line'
				}
			],
    }
  }

	render() {

		let itemsHTML = []

		let onClick = (event:React.MouseEvent) => {
			toolbarSelected = event.currentTarget.id
		}

		for(let item of this.state.items) {

			itemsHTML.push(<img key={item.image} id={item.name} alt="" src={item.image} onClick={onClick}></img>)
		}

		return <div id="toolbar">{itemsHTML}</div>
	}
}
