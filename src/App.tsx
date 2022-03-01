import React from 'react'
import './App.scss'
import { Game } from './classes/Game'
import { loadGamefile } from './classes/gamefile'
import { DebugPanel } from './HUD/DebugPanel'
import { Toolbar } from './HUD/Toolbar'
import { Topmenu } from './HUD/Topmenu'
import autoLoadSave from "./autoload.js"


class App extends React.Component {
  
  async componentDidMount() {
    if(game.autoStart) {
      
      if(game.autoLoad) {
        await loadGamefile(autoLoadSave)
        game.start()
      }
      else {
        game.start()
      }
    }
  }

  render(): React.ReactNode {
    return (
      <div className="App">
        <DebugPanel></DebugPanel>
        <canvas id="canvas-tiles"></canvas>
        <canvas id="canvas-dynamic"></canvas>
        <canvas id="canvas-metro"></canvas>
        <Toolbar></Toolbar>
        <Topmenu></Topmenu>
      </div>
    );
  }

}

export default App

export const game = new Game()
console.log(game)


