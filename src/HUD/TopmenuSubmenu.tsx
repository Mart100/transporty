import React from "react"

interface TopmenuSubmenuItem {
	text:string
	onClick:() => void
}


type Props = { items:TopmenuSubmenuItem[] }
type State = { shown:boolean }


export class TopmenuSubmenu extends React.Component<Props, State> {

	constructor(props:Props) {
		super(props)
		this.state = {
			shown: false
		}
	}

	onClick() {
		this.setState({ shown:true })
	}

	render() {

		let itemsHTML = []

		for(let item of this.props.items) {

			itemsHTML.push(<div key={item.text} onClick={item.onClick}>{item.text}</div>)
		}

		return <div className="topmenusubmenu" onClick={() => this.onClick()}>{itemsHTML}</div>
	}
}