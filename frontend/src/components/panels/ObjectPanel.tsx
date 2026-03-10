import { useState } from 'react'
import { useStore } from '../../store/useStore'

export default function ObjectPanel() {
  const { selectedObject, setFrom, setTo, setActiveTab } = useStore()
  const [routing, setRouting] = useState(false)

  if (!selectedObject) {
    return (
      <div style={{ padding: 20, color: '#475569', fontSize: 13, textAlign: 'center' }}>
        Выберите объект на карте
      </div>
    )
  }

  const { name, type, lat, lon, properties } = selectedObject

  const setAsRoute = (which: 'from' | 'to') => {
    const wp = { lat, lon, name }
    which === 'from' ? setFrom(wp) : setTo(wp)
    setActiveTab('route')
  }

  const routeFromMe = () => {
    if (!navigator.geolocation) return alert('GPS недоступен на этом устройстве')
    setRouting(true)

    const onSuccess = (pos: GeolocationPosition) => {
      const { latitude: myLat, longitude: myLon } = pos.coords
      ;(window as any).__FLY_TO?.([myLat, myLon])
      setFrom({ lat: myLat, lon: myLon, name: 'Моё местоположение' })
      setTo({ lat, lon, name })
      setTimeout(() => {
        ;(window as any).__BUILD_ROUTE?.()
        setActiveTab('route')
      }, 100)
      setRouting(false)
    }

    const onError = (err: GeolocationPositionError) => {
      setRouting(false)
      if (err.code === 1) {
        alert('Доступ к геолокации запрещён.\n\nНа телефоне: Настройки браузера → Разрешения → Местоположение → Разрешить')
      } else {
        // Таймаут или нет сигнала — пробуем без точного GPS
        navigator.geolocation.getCurrentPosition(onSuccess, () => {
          alert('Не удалось определить местоположение. Проверь разрешения в браузере.')
        }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 })
      }
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 30000
    })
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
        {type === 'well' ? 'Скважина' : type === 'bkns' ? 'БКНС' : 'ГУ'} •{' '}
        {lat.toFixed(5)}, {lon.toFixed(5)}
      </div>

      {/* Свойства */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
        {Object.entries(properties || {})
          .filter(([k, v]) => v && !['id', 'layer_type', 'OBJECTID', 'OBJECTID_1', 'Shape_Leng', 'Shape_Area', 'PERIMETER', 'GU_', 'GU_ID'].includes(k))
          .map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ color: '#475569' }}>{k}:</span>
              <span>{String(v)}</span>
            </div>
          ))
        }
      </div>

      {/* Маршрут от меня */}
      <button
        onClick={routeFromMe}
        disabled={routing}
        style={{
          width: '100%', padding: '9px', fontSize: 13, fontWeight: 600,
          marginBottom: 8,
          background: routing ? '#1e3a5f' : '#1d4ed8',
          color: '#fff', border: 'none', borderRadius: 6,
          cursor: routing ? 'wait' : 'pointer',
          boxShadow: '0 2px 6px rgba(29,78,216,0.4)'
        }}
      >
        {routing ? '⏳ Определяю местоположение...' : '🎯 Маршрут от меня сюда'}
      </button>

      {/* Кнопки откуда/куда */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setAsRoute('from')}
          style={{
            flex: 1, padding: '7px', fontSize: 12,
            background: '#1e293b', color: '#22c55e',
            border: '1px solid #22c55e', borderRadius: 6, cursor: 'pointer'
          }}
        >
          📍 Откуда
        </button>
        <button
          onClick={() => setAsRoute('to')}
          style={{
            flex: 1, padding: '7px', fontSize: 12,
            background: '#1e293b', color: '#ef4444',
            border: '1px solid #ef4444', borderRadius: 6, cursor: 'pointer'
          }}
        >
          🏁 Куда
        </button>
      </div>
    </div>
  )
}
