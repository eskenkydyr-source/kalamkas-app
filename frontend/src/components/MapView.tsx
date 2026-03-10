import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const WELL_COLORS: Record<string, string> = {
  'dob.': '#22c55e',
  'nagn.': '#3b82f6',
  'likv.': '#6b7280',
  'water': '#06b6d4',
  'gaz': '#f59e0b',
  'kontr.': '#8b5cf6',
  'razv.': '#f97316',
}

const LAYER_TYPE_MAP: Record<string, string> = {
  wells_dob: 'dob.',
  wells_nagn: 'nagn.',
  wells_likv: 'likv.',
  wells_water: 'water',
  wells_gaz: 'gaz',
}

interface Props {
  activeLayers: Record<string, boolean>
}

export default function MapView({ activeLayers }: Props) {
  const [wells, setWells] = useState<any>(null)
  const [bkns, setBkns] = useState<any>(null)
  const [gu, setGu] = useState<any>(null)

  const base = import.meta.env.BASE_URL

  useEffect(() => {
    fetch(`${base}data/wells.geojson`).then(r => r.json()).then(setWells)
    fetch(`${base}data/bkns.geojson`).then(r => r.json()).then(setBkns)
    fetch(`${base}data/gu.geojson`).then(r => r.json()).then(setGu)
  }, [])

  const visibleWellTypes = Object.entries(LAYER_TYPE_MAP)
    .filter(([layer]) => activeLayers[layer])
    .map(([, type]) => type)

  return (
    <MapContainer
      center={[45.374, 51.926]}
      zoom={12}
      style={{ flex: 1, height: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap"
      />

      {/* Скважины */}
      {wells?.features
        ?.filter((f: any) => visibleWellTypes.includes(f.properties.type))
        .map((f: any, i: number) => {
          const [lon, lat] = f.geometry.coordinates
          const color = WELL_COLORS[f.properties.type] || '#999'
          return (
            <CircleMarker
              key={i}
              center={[lat, lon]}
              radius={4}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}
            >
              <Popup>
                <b>{f.properties.name}</b><br />
                Тип: {f.properties.type_ru}<br />
                №: {f.properties.well_num}
              </Popup>
            </CircleMarker>
          )
        })}

      {/* БКНС */}
      {activeLayers.bkns && bkns && (
        <GeoJSON
          key="bkns"
          data={bkns}
          style={{ color: '#dc2626', weight: 2, fillColor: '#fca5a5', fillOpacity: 0.4 }}
          onEachFeature={(f, layer) => {
            layer.bindPopup(`<b>${f.properties.NAME}</b><br/>${f.properties.BKNS_UCHAS || ''}`)
          }}
        />
      )}

      {/* ГУ */}
      {activeLayers.gu && gu && (
        <GeoJSON
          key="gu"
          data={gu}
          style={{ color: '#d97706', weight: 1.5, fillColor: '#fde68a', fillOpacity: 0.3 }}
          onEachFeature={(f, layer) => {
            layer.bindPopup(`<b>${f.properties.NAME || f.properties.FIND}</b>`)
          }}
        />
      )}
    </MapContainer>
  )
}
