import { useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import './App.css'

export type LayersState = Record<string, boolean>

export default function App() {
  const [activeLayers, setActiveLayers] = useState<LayersState>({
    wells_dob: true,
    wells_nagn: true,
    wells_likv: false,
    wells_water: false,
    wells_gaz: false,
    bkns: true,
    gu: true,
    graph: false,
  })

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar activeLayers={activeLayers} setActiveLayers={setActiveLayers} />
      <MapView activeLayers={activeLayers} />
    </div>
  )
}
