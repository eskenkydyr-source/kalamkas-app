import { useState } from 'react'
import MapView from './components/MapView'
import Sidebar from './components/Sidebar'
import { useStore } from './store/useStore'
import './App.css'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { markerMode, setMarkerMode } = useStore()
  const [locating, setLocating] = useState(false)

  const goToMyLocation = () => {
    if (!navigator.geolocation) return alert('GPS недоступен на этом устройстве')
    setLocating(true)

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = pos.coords
      ;(window as any).__FLY_TO?.([lat, lng], 16)
      setLocating(false)
    }

    const onError = (err: GeolocationPositionError) => {
      setLocating(false)
      if (err.code === 1) {
        alert('Доступ к геолокации запрещён.\n\nНа телефоне: Настройки браузера → Разрешения → Местоположение → Разрешить')
      } else if (err.code === 2) {
        alert('GPS сигнал недоступен. Попробуй выйти на улицу или включить мобильный интернет.')
      } else {
        // Таймаут — пробуем без высокой точности
        navigator.geolocation.getCurrentPosition(onSuccess, () => {
          alert('Не удалось определить местоположение. Проверь разрешения в браузере.')
        }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 })
      }
    }

    // Сначала пробуем без высокой точности (быстрее на мобильных)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 30000  // разрешить кэш до 30 сек
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
        {/* Моё местоположение */}
        <button
          onClick={goToMyLocation}
          title="Моё местоположение"
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: locating ? '#1d4ed8' : '#1e293b',
            color: '#fff', border: '2px solid ' + (locating ? '#3b82f6' : '#334155'),
            fontSize: 20, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            animation: locating ? 'pulse 1s infinite' : 'none'
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
