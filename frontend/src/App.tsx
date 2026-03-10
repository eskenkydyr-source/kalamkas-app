import { useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import { useStore } from './store/useStore'
import './App.css'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { markerMode, setMarkerMode } = useStore()
  const [locating, setLocating] = useState(false)

  const [locMsg, setLocMsg] = useState('')

  const applyLocation = (lat: number, lng: number) => {
    ;(window as any).__FLY_TO?.([lat, lng], 16)
    ;(window as any).__SET_MY_LOCATION?.([lat, lng])
    setLocating(false)
    setLocMsg('')
  }

  // Запасной вариант — IP геолокация (не требует разрешений)
  const locateByIP = async () => {
    setLocMsg('📡 Определяю по IP...')
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.latitude && data.longitude) {
        applyLocation(data.latitude, data.longitude)
      } else throw new Error('no data')
    } catch {
      setLocating(false)
      setLocMsg('')
      alert('Не удалось определить местоположение ни через GPS, ни через IP.')
    }
  }

  const goToMyLocation = () => {
    setLocating(true)
    setLocMsg('🔍 Определяю местоположение...')

    if (!navigator.geolocation) {
      locateByIP()
      return
    }

    const onSuccess = (pos: GeolocationPosition) => {
      applyLocation(pos.coords.latitude, pos.coords.longitude)
    }

    const onError = (err: GeolocationPositionError) => {
      if (err.code === 1) {
        // Разрешение запрещено — сразу IP
        setLocMsg('🌐 GPS запрещён, пробую IP...')
        locateByIP()
      } else {
        // Таймаут или нет сигнала — IP
        setLocMsg('⏱ GPS недоступен, пробую IP...')
        locateByIP()
      }
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 60000
    })
  }

  return (
    <div className="app">
      <button className="mob-toggle" onClick={() => setSidebarOpen(v => !v)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <div className={`sidebar-wrap ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>
      <MapView />

      {/* Плавающие кнопки */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20,
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000
      }}>
        {/* Статус геолокации */}
        {locMsg && (
          <div style={{
            position: 'absolute', right: 52, whiteSpace: 'nowrap',
            background: '#1e293b', color: '#94a3b8',
            border: '1px solid #334155', borderRadius: 8,
            padding: '6px 10px', fontSize: 11,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}>
            {locMsg}
          </div>
        )}

        {/* Моё местоположение */}
        <button
          onClick={goToMyLocation}
          title="Моё местоположение"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: locating ? '#1d4ed8' : '#1e293b',
            color: '#fff', border: '2px solid ' + (locating ? '#3b82f6' : '#334155'),
            fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
          {locating ? '⏳' : '🎯'}
        </button>

        {/* Поставить метку */}
        <button
          onClick={() => setMarkerMode(!markerMode)}
          title="Поставить метку"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: markerMode ? '#f59e0b' : '#1e293b',
            color: '#fff', border: '2px solid ' + (markerMode ? '#f59e0b' : '#334155'),
            fontSize: 18, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >📍</button>
      </div>
    </div>
  )
}
