import type { Dispatch, SetStateAction } from 'react'
import type { LayersState } from '../App'

interface Props {
  activeLayers: LayersState
  setActiveLayers: Dispatch<SetStateAction<LayersState>>
}

const LAYERS = [
  { key: 'wells_dob',   label: 'Добывающие',    color: '#22c55e' },
  { key: 'wells_nagn',  label: 'Нагнетательные', color: '#3b82f6' },
  { key: 'wells_likv',  label: 'Ликвидированные', color: '#6b7280' },
  { key: 'wells_water', label: 'Водозаборные',   color: '#06b6d4' },
  { key: 'wells_gaz',   label: 'Газовые',        color: '#f59e0b' },
  { key: 'bkns',        label: 'БКНС',           color: '#dc2626' },
  { key: 'gu',          label: 'ГУ',             color: '#d97706' },
]

export default function Sidebar({ activeLayers, setActiveLayers }: Props) {
  const toggle = (key: string) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div style={{
      width: 220, background: '#1e293b', color: '#f1f5f9',
      padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
      overflowY: 'auto', zIndex: 1000
    }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#94a3b8' }}>
        ҚАЛАМҚАС
      </h2>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
        Карта месторождения
      </p>

      {LAYERS.map(({ key, label, color }) => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={activeLayers[key] ?? false}
            onChange={() => toggle(key)}
          />
          <span style={{
            width: 12, height: 12, borderRadius: 2,
            background: color, flexShrink: 0
          }} />
          {label}
        </label>
      ))}
    </div>
  )
}
