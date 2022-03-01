import React from "react";
import { game } from "../App";
import { Color } from "../classes/Color";
import { Pathfinding } from "../classes/Pathfinding";
import { Utils } from "../classes/Utils";

export const globalDebugValues:Record<string, DebugValue> = {

  'Log game': {
    button: () => {
      console.log(game)
    }
  },
  'Start debug trip': {
    button: async () => {
      let allHouses = game.world.allHouses()
      let house1 = allHouses[Math.floor(Math.random()*allHouses.length)]
      let house2 = allHouses[Math.floor(Math.random()*allHouses.length)]

      house1.debugColor = new Color(0, 0, 255, 0.5)
      house2.debugColor = new Color(0, 0, 255, 0.5)

      let pathFinder = new Pathfinding(house1, house2)
      pathFinder.debug = true

      await pathFinder.findPath()

      await Utils.sleep(2000)

      pathFinder.destroy()
      house1.debugColor = undefined
      house2.debugColor = undefined
    }
  }
}

interface DebugValue {
  val?:string|number
  button?:() => void
}

type Props = {}
type State = { values: Record<string, DebugValue> }

export class DebugPanel extends React.Component<Props, State> {
  interval:any
  constructor(props:Props) {
    super(props)
    this.state = {
      values: globalDebugValues,
    }
  }
  componentDidMount() {
    this.interval = setInterval(() => this.setState({ values: globalDebugValues }), 100);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }
  render() {

    const valuesHTML = []

    for(let valueName in this.state.values) {
      let value = this.state.values[valueName]
      if(value.button) {
        valuesHTML.push(
          <button key={valueName} onClick={value.button}>{valueName}</button>
        )
      }
      else {
        valuesHTML.push(
          <span key={valueName}>{valueName}: {value.val}</span>
        )
      }
    }
    
    return <div id="debugPanel">{valuesHTML}</div>
  }
}