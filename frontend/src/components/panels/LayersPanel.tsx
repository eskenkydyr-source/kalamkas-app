import { useStore } from '../../store/useStore'
import type { WellType } from '../../store/useStore'

const WELL_TYPES: { key: WellType; label: string; color: string; count: number }[] = [
  { key: 'dob.',   label: 'Добывающие',     color: '#22c55e', count: 2201 },
  { key: 'nagn.',  label: 'Нагнетательные', color: '#3b82f6', count: 784 },
  { key: 'likv.',  label: 'Ликвидированные',color: '#6b7280', count: 139 },
  { key: 'water',  label: 'Водозаборные',   color: '#06b6d4', count: 68 },
  { key: 'gaz',    label: 'Газовые',        color: '#f59e0b', count: 59 },
  { key: 'kontr.', label: 'Контрольные',    color: '#8b5cf6', count: 42 },
  { key: 'razv.',  label: 'Разведочные',    color: '#f97316', count: 15 },
]

const BASE_LAYERS = [
  { key: 'osm' as const,  label: '🗺 Карта' },
  { key: 'sat' as const,  label: '🛰 Спутник' },
  { key: 'dark' as const, label: '🌙 Тёмная' },
]

export default function LayersPanel() {
  const { layers, toggleLayer, activeWellTypes, toggleWellType, basemap, setBasemap, editMode, setEditMode } = useStore()

  const handleEditMode = () => {
    if (!editMode) {
      const pwd = prompt('Введите пароль редактора:')
      if (pwd === 'kalamkas2024') setEditMode(true)
      else if (pwd !== null) alert('Неверный пароль')
    } else {
      setEditMode(false)
    }
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Базовая карта */}
      <div>
        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Подложка
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {BASE_LAYERS.map(b => (
            <button
              key={b.key}
              onClick={() => setBasemap(b.key)}
              style={{
                flex: 1, padding: '5px 2px', fontSize: 10,
                background: basemap === b.key ? '#1d4ed8' : '#1e293b',
                color: basemap === b.key ? '#fff' : '#94a3b8',
                border: '1px solid ' + (basemap === b.key ? '#3b82f6' : '#334155'),
                borderRadius: 4, cursor: 'pointer'
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Объектные слои */}
      <div>
        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          Слои
        </div>
        {[
          { key: 'roads', label: 'Дороги', icon: '🛣' },
          { key: 'bkns',  label: 'БКНС (11)',  icon: '🔴' },
          { key: 'gu',    label: 'ГУ (73)',     icon: '🟡' },
          { key: 'wells', label: 'Скважины',    icon: '⚫' },
        ].map(l => (
          <label key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={layers[l.key] ?? false} onChange={() => toggleLayer(l.key)} />
            <span>{l.icon} {l.label}</span>
          </label>
        ))}
      </div>

      {/* Типы скважин */}
      {layers.wells && (
        <div>
          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Типы скважин
          </div>
          {WELL_TYPES.map(({ key, label, color, count }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer', fontSize: 12 }}>
              <input
                type="checkbox"
                checked={activeWellTypes.has(key)}
                onChange={() => toggleWellType(key)}
              />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ fontSize: 10, color: '#475569' }}>{count}</span>
            </label>
          ))}
        </div>
      )}

      {/* Редактор */}
      <div style={{ paddingTop: 8, borderTop: '1px solid #1e293b' }}>
        <button
          onClick={handleEditMode}
          style={{
            width: '100%', padding: '7px', fontSize: 12,
            background: editMode ? '#7c3aed' : '#1e293b',
            color: editMode ? '#fff' : '#94a3b8',
            border: '1px solid ' + (editMode ? '#7c3aed' : '#334155'),
            borderRadius: 6, cursor: 'pointer'
          }}
        >
          {editMode ? '✏️ Редактор: ВКЛ' : '🔒 Редактор графа'}
        </button>
      </div>
    </div>
  )
}
