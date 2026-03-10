import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, Polyline, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '../store/useStore'
import { haversine, nearestNode } from '../utils/distance'
import type { GraphNode } from '../utils/distance'
import { astar, buildAdj } from '../utils/astar'

const WELL_COLORS: Record<string, string> = {
  'dob.': '#22c55e', 'nagn.': '#3b82f6', 'likv.': '#6b7280',
  'water': '#06b6d4', 'gaz': '#f59e0b', 'kontr.': '#8b5cf6', 'razv.': '#f97316',
}

const BASEMAP_URLS: Record<string, string> = {
  osm:  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  sat:  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
}

// Компонент для обработки кликов на карте
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng) }
  })
  return null
}

// Компонент для перелёта к объекту
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo(target, 15, { duration: 1 })
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Компонент для смены базовой карты
function BasemapLayer({ basemap }: { basemap: string }) {
  return (
    <TileLayer
      key={basemap}
      url={BASEMAP_URLS[basemap] || BASEMAP_URLS.osm}
      attribution="© OpenStreetMap / Esri / CARTO"
    />
  )
}

export default function MapView() {
  const {
    layers, activeWellTypes, basemap,
    from, to, setFrom, setTo,
    routeSelectMode, setRouteSelectMode,
    routePath, setRoutePath, setRouteInfo,
    setSelectedObject,
    markerMode, customMarkers, addCustomMarker,
    editMode, editSubmode,
  } = useStore()

  const [wells, setWells] = useState<any>(null)
  const [bkns, setBkns] = useState<any>(null)
  const [gu, setGu] = useState<any>(null)
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], edges: [number,number,number][] } | null>(null)
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null)
  const [editGraph, setEditGraph] = useState<{ nodes: GraphNode[], edges: [number,number,number][] } | null>(null)

  const base = import.meta.env.BASE_URL

  useEffect(() => {
    Promise.all([
      fetch(`${base}data/wells.geojson`).then(r => r.json()),
      fetch(`${base}data/bkns.geojson`).then(r => r.json()),
      fetch(`${base}data/gu.geojson`).then(r => r.json()),
      fetch(`${base}data/graph.json`).then(r => r.json()),
    ]).then(([w, b, g, gr]) => {
      setWells(w); setBkns(b); setGu(g)
      const parsed = {
        nodes: gr.nodes.map(([lat, lon, type]: [number, number, string]) => ({ lat, lon, type })),
        edges: gr.edges as [number,number,number][]
      }
      // Загрузить сохранённые изменения из localStorage
      const saved = localStorage.getItem('kalamkas_graph')
      const graph = saved ? JSON.parse(saved) : parsed
      setGraphData(parsed)
      setEditGraph({ ...graph })
      ;(window as any).__KALAMKAS_GRAPH = graph
      // Глобально для RoutePanel поиска
      ;(window as any).__KALAMKAS_DATA = { wells: w, bkns: b, gu: g }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Построение маршрута
  const buildRoute = () => {
    if (!from || !to || !graphData) return
    const { nodes, edges } = graphData
    const adj = buildAdj(nodes, edges)
    const startIdx = nearestNode(from.lat, from.lon, nodes)
    const goalIdx = nearestNode(to.lat, to.lon, nodes)
    if (startIdx === null || goalIdx === null) { setRoutePath([]); return }
    const path = astar(startIdx, goalIdx, nodes, adj)
    if (!path) { setRoutePath([]); return }
    const coords: [number, number][] = path.map(i => [nodes[i].lat, nodes[i].lon])
    let dist = 0
    for (let i = 0; i < coords.length - 1; i++) {
      dist += haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
    }
    dist += haversine(from.lat, from.lon, coords[0][0], coords[0][1])
    dist += haversine(to.lat, to.lon, coords[coords.length-1][0], coords[coords.length-1][1])
    setRoutePath(coords)
    setRouteInfo({ distance: dist, duration: (dist / 1000) / 30 * 60 })
  }

  // Глобально доступна для RoutePanel
  useEffect(() => {
    (window as any).__BUILD_ROUTE = buildRoute
  }, [from, to, graphData]) // eslint-disable-line react-hooks/exhaustive-deps

  // Сохранить граф в localStorage
  const saveGraph = (g: { nodes: GraphNode[], edges: [number,number,number][] }) => {
    localStorage.setItem('kalamkas_graph', JSON.stringify(g))
    ;(window as any).__KALAMKAS_GRAPH = g
    setEditGraph({ ...g })
  }

  const handleMapClick = (lat: number, lon: number) => {
    if (routeSelectMode) {
      const wp = { lat, lon, name: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }
      routeSelectMode === 'from' ? setFrom(wp) : setTo(wp)
      setRouteSelectMode(null)
      return
    }
    if (markerMode) {
      addCustomMarker(lat, lon)
      return
    }
    // Редактор: добавить узел
    if (editMode && editSubmode === 'add' && editGraph) {
      const newNode: GraphNode = { lat: parseFloat(lat.toFixed(6)), lon: parseFloat(lon.toFixed(6)), type: 'road' }
      const updated = { ...editGraph, nodes: [...editGraph.nodes, newNode] }
      saveGraph(updated)
    }
  }

  const handleNodeClick = (idx: number) => {
    if (!editMode || !editGraph) return
    if (editSubmode === 'del') {
      const updated = {
        nodes: editGraph.nodes.filter((_, i) => i !== idx),
        edges: editGraph.edges.filter(([f, t]) => f !== idx && t !== idx)
          .map(([f, t, d]): [number,number,number] => [f > idx ? f - 1 : f, t > idx ? t - 1 : t, d])
      }
      saveGraph(updated)
    }
  }

  const handleEdgeClick = (edgeIdx: number) => {
    if (!editMode || editSubmode !== 'deledge' || !editGraph) return
    const updated = { ...editGraph, edges: editGraph.edges.filter((_, i) => i !== edgeIdx) }
    saveGraph(updated)
  }

  const handleObjectClick = (name: string, type: string, lat: number, lon: number, properties: any) => {
    setSelectedObject({ name, type, lat, lon, properties })
    setFlyTarget([lat, lon])
  }

  // Дорожный слой
  const roadLines = graphData ? graphData.edges.map(([fromIdx, toIdx], i) => {
    const a = graphData.nodes[fromIdx], b = graphData.nodes[toIdx]
    if (!a || !b) return null
    const aType = a.type, bType = b.type
    let color = '#374151'; let weight = 1.5
    if (aType === 'bkns' || bType === 'bkns') { color = '#fff'; weight = 2.5 }
    else if (aType === 'gu' || bType === 'gu') { color = '#f59e0b'; weight = 2 }
    return (
      <Polyline key={i} positions={[[a.lat, a.lon], [b.lat, b.lon]]}
        pathOptions={{ color, weight, opacity: 0.7 }} />
    )
  }) : null

  const visibleWellTypes = Array.from(activeWellTypes)

  return (
    <MapContainer
      center={[45.374, 51.926]}
      zoom={12}
      style={{ flex: 1, height: '100%' }}
      zoomControl={true}
    >
      <BasemapLayer basemap={basemap} />
      <MapClickHandler onMapClick={handleMapClick} />
      <FlyTo target={flyTarget} />

      {/* Дороги (обычный режим) */}
      {layers.roads && !editMode && roadLines}

      {/* Редактор графа: рёбра */}
      {editMode && editGraph && editGraph.edges.map(([fromIdx, toIdx], i) => {
        const a = editGraph.nodes[fromIdx], b = editGraph.nodes[toIdx]
        if (!a || !b) return null
        return (
          <Polyline
            key={`edge-${i}`}
            positions={[[a.lat, a.lon], [b.lat, b.lon]]}
            pathOptions={{
              color: editSubmode === 'deledge' ? '#f97316' : '#a78bfa',
              weight: editSubmode === 'deledge' ? 4 : 2,
              opacity: 0.8
            }}
            eventHandlers={{ click: () => handleEdgeClick(i) }}
          />
        )
      })}

      {/* Редактор графа: узлы */}
      {editMode && editGraph && editGraph.nodes.map((n, i) => {
        const nodeColor = n.type === 'bkns' ? '#3b82f6' : n.type === 'gu' ? '#f59e0b' : '#a78bfa'
        return (
          <CircleMarker
            key={`node-${i}`}
            center={[n.lat, n.lon]}
            radius={editSubmode === 'del' ? 7 : 5}
            pathOptions={{
              color: editSubmode === 'del' ? '#ef4444' : nodeColor,
              fillColor: editSubmode === 'del' ? '#ef4444' : nodeColor,
              fillOpacity: 0.9, weight: 2
            }}
            eventHandlers={{ click: () => handleNodeClick(i) }}
          >
            <Popup>
              Узел #{i}<br/>
              Тип: {n.type}<br/>
              {n.lat.toFixed(5)}, {n.lon.toFixed(5)}
            </Popup>
          </CircleMarker>
        )
      })}

      {/* Скважины */}
      {layers.wells && wells?.features
        ?.filter((f: any) => visibleWellTypes.includes(f.properties.type))
        .map((f: any, i: number) => {
          const [lon, lat] = f.geometry.coordinates
          const color = WELL_COLORS[f.properties.type] || '#999'
          return (
            <CircleMarker
              key={i}
              center={[lat, lon]}
              radius={3}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 0.5 }}
              eventHandlers={{ click: () => handleObjectClick(f.properties.name || `Скв. ${f.properties.well_num}`, 'well', lat, lon, f.properties) }}
            />
          )
        })}

      {/* БКНС */}
      {layers.bkns && bkns && (
        <GeoJSON key="bkns" data={bkns}
          style={{ color: '#dc2626', weight: 2, fillColor: '#fca5a5', fillOpacity: 0.35 }}
          onEachFeature={(f, layer) => {
            const geom = f.geometry as any
            const coords = geom.coordinates[0]
            const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length
            const lon = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length
            layer.on('click', () => handleObjectClick(f.properties.NAME, 'bkns', lat, lon, f.properties))
          }}
        />
      )}

      {/* ГУ */}
      {layers.gu && gu && (
        <GeoJSON key="gu" data={gu}
          style={{ color: '#d97706', weight: 1.5, fillColor: '#fde68a', fillOpacity: 0.25 }}
          onEachFeature={(f, layer) => {
            const geom = f.geometry as any
            const coords = geom.coordinates[0]
            const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length
            const lon = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length
            const name = f.properties.NAME || f.properties.FIND || 'ГУ'
            layer.on('click', () => handleObjectClick(name, 'gu', lat, lon, f.properties))
          }}
        />
      )}

      {/* Маршрут */}
      {routePath && routePath.length > 1 && (
        <Polyline positions={routePath}
          pathOptions={{ color: '#38bdf8', weight: 4, opacity: 0.9 }} />
      )}
      {routePath !== null && routePath.length === 0 && from && to && (
        <Polyline positions={[[from.lat, from.lon], [to.lat, to.lon]]}
          pathOptions={{ color: '#ef4444', weight: 2, dashArray: '8,6', opacity: 0.7 }} />
      )}

      {/* Маркеры маршрута */}
      {from && (
        <CircleMarker center={[from.lat, from.lon]} radius={8}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }}>
          <Popup>{from.name}</Popup>
        </CircleMarker>
      )}
      {to && (
        <CircleMarker center={[to.lat, to.lon]} radius={8}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1 }}>
          <Popup>{to.name}</Popup>
        </CircleMarker>
      )}

      {/* Пользовательские метки */}
      {customMarkers.map(m => (
        <CircleMarker key={m.id} center={[m.lat, m.lon]} radius={7}
          pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.9, weight: 2 }}>
          <Popup>{m.label}<br/>{m.lat.toFixed(5)}, {m.lon.toFixed(5)}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
