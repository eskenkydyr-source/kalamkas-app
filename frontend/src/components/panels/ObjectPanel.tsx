import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import {
  getWellData, saveWellEquipment, addRepair, deleteRepair,
  updateSensors, simulateSensors
} from '../../utils/wellData'
import type { RepairRecord } from '../../utils/wellData'
import { login, logout, getCurrentUser, isLoggedIn } from '../../utils/auth'

const inp: React.CSSProperties = {
  width: '100%', padding: '5px 8px', fontSize: 12,
  background: '#0f172a', color: '#e2e8f0',
  border: '1px solid #334155', borderRadius: 5, outline: 'none',
  marginBottom: 5, boxSizing: 'border-box',
}
const sec: React.CSSProperties = { marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #1e293b' }
const lbl: React.CSSProperties = { fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }
const btn = (bg: string): React.CSSProperties => ({ padding: '5px 10px', fontSize: 11, fontWeight: 600, background: bg, color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' })
const iBtn: React.CSSProperties = { padding: '3px 7px', fontSize: 11, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 4, cursor: 'pointer' }

function LoginModal({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const submit = () => { if (login(user, pass)) onClose(); else setErr('Неверный логин или пароль') }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#1e293b', borderRadius: 10, padding: 24, width: 280, border: '1px solid #334155' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>Вход</div>
        <input style={inp} placeholder="Логин" value={user} onChange={e => setUser(e.target.value)} autoFocus />
        <input style={inp} placeholder="Пароль" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        {err && <div style={{ fontSize: 11, color: '#f87171', marginBottom: 6 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={{ ...btn('#1d4ed8'), flex: 1 }} onClick={submit}>Войти</button>
          <button style={{ ...btn('#374151'), flex: 1 }} onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

function SensorBlock({ wellKey, wellNum }: { wellKey: string; wellNum: string }) {
  const [s, setS] = useState<{ pressure: number; temperature: number; updated_at: string } | null>(null)
  useEffect(() => {
    const refresh = () => {
      const v = simulateSensors(wellNum)
      updateSensors(wellKey, v.pressure, v.temperature)
      setS({ ...v, updated_at: new Date().toISOString() })
    }
    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [wellKey, wellNum])
  const time = s ? new Date(s.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'
  return (
    <div style={sec}>
      <div style={{ ...lbl, display: 'flex', justifyContent: 'space-between' }}>
        <span>Датчики (симуляция)</span>
        <span style={{ fontSize: 9, color: '#334155' }}>{time}</span>
      </div>
      <div style={row}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Давление</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#38bdf8' }}>{s?.pressure ?? '--'} бар</span>
      </div>
      <div style={row}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Температура</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#fb923c' }}>{s?.temperature ?? '--'} °C</span>
      </div>
    </div>
  )
}

function EquipmentBlock({ wellKey, canEdit, onAuth }: { wellKey: string; canEdit: boolean; onAuth: () => void }) {
  const [editing, setEditing] = useState(false)
  const [tick, setTick] = useState(0)
  const [fields, setFields] = useState({ cabinet_type: '', vfd_type: '', motor_type: '' })
  useEffect(() => {
    const d = getWellData(wellKey)
    setFields({ cabinet_type: d.cabinet_type, vfd_type: d.vfd_type, motor_type: d.motor_type })
  }, [wellKey, tick])
  const save = () => { saveWellEquipment(wellKey, fields); setEditing(false); setTick(t => t + 1) }
  const defs = [
    { key: 'cabinet_type', label: 'Тип шкафа' },
    { key: 'vfd_type', label: 'Тип ЧРП' },
    { key: 'motor_type', label: 'Тип двигателя' },
  ]
  return (
    <div style={sec}>
      <div style={{ ...lbl, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Оборудование</span>
        {!editing && <button style={iBtn} onClick={() => canEdit ? setEditing(true) : onAuth()}>Изменить</button>}
      </div>
      {editing ? (
        <>
          {defs.map(({ key, label }) => (
            <div key={key}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>{label}</div>
              <input style={inp} value={(fields as any)[key]}
                onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                placeholder={label} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button style={{ ...btn('#16a34a'), flex: 1 }} onClick={save}>Сохранить</button>
            <button style={{ ...btn('#374151'), flex: 1 }} onClick={() => setEditing(false)}>Отмена</button>
          </div>
        </>
      ) : defs.map(({ key, label }) => (
        <div key={key} style={row}>
          <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: (fields as any)[key] ? '#e2e8f0' : '#334155' }}>
            {(fields as any)[key] || '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

function RepairsBlock({ wellKey, canEdit, onAuth }: { wellKey: string; canEdit: boolean; onAuth: () => void }) {
  const [adding, setAdding] = useState(false)
  const [_tick, setTick] = useState(0)
  const [form, setForm] = useState<Omit<RepairRecord, 'id'>>({ date: '', type: 'KRS', desc: '' })
  const repairs = getWellData(wellKey).repairs
  const submit = () => {
    if (!form.date) return
    addRepair(wellKey, form)
    setForm({ date: '', type: 'KRS', desc: '' })
    setAdding(false)
    setTick(t => t + 1)
  }
  const remove = (id: string) => { deleteRepair(wellKey, id); setTick(t => t + 1) }
  return (
    <div style={sec}>
      <div style={{ ...lbl, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>КРС / ПРС (3 года)</span>
        {!adding && <button style={iBtn} onClick={() => canEdit ? setAdding(true) : onAuth()}>+ Добавить</button>}
      </div>
      {adding && (
        <div style={{ background: '#0f172a', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
            <input type="date" style={{ ...inp, marginBottom: 0, flex: 1 }}
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <select style={{ ...inp, marginBottom: 0, width: 70 }}
              value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'KRS' | 'PRS' }))}>
              <option value="KRS">КРС</option>
              <option value="PRS">ПРС</option>
            </select>
          </div>
          <input style={inp} placeholder="Описание работ" value={form.desc}
            onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ ...btn('#16a34a'), flex: 1 }} onClick={submit}>Добавить</button>
            <button style={{ ...btn('#374151'), flex: 1 }} onClick={() => setAdding(false)}>Отмена</button>
          </div>
        </div>
      )}
      {repairs.length === 0
        ? <div style={{ fontSize: 11, color: '#334155', textAlign: 'center', padding: '6px 0' }}>Нет записей</div>
        : repairs.map(r => (
          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '5px 0', borderBottom: '1px solid #0f172a', gap: 6 }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: r.type === 'KRS' ? '#f59e0b' : '#38bdf8', marginRight: 6 }}>
                {r.type === 'KRS' ? 'КРС' : 'ПРС'}
              </span>
              <span style={{ fontSize: 10, color: '#475569' }}>{r.date}</span>
              {r.desc && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{r.desc}</div>}
            </div>
            {canEdit && <button style={{ ...iBtn, color: '#ef4444', flexShrink: 0 }} onClick={() => remove(r.id)}>✕</button>}
          </div>
        ))
      }
    </div>
  )
}

export default function ObjectPanel() {
  const { selectedObject, setFrom, setTo, setActiveTab } = useStore()
  const [routing, setRouting] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [authed, setAuthed] = useState(isLoggedIn)
  const [, tick] = useState(0)
  const user = getCurrentUser()

  const onLoginClose = () => { setAuthed(isLoggedIn()); setShowLogin(false); tick(n => n + 1) }

  if (!selectedObject) {
    return <div style={{ padding: 20, color: '#475569', fontSize: 13, textAlign: 'center' }}>Выберите объект на карте</div>
  }

  const { name, type, lat, lon, properties } = selectedObject
  const isWell = type === 'well'
  const wellKey = isWell ? ('well_' + (properties?.well_num || name)) : ''
  const wellNum = String(properties?.well_num || '1000')

  const setAsRoute = (which: 'from' | 'to') => {
    const wp = { lat, lon, name }
    which === 'from' ? setFrom(wp) : setTo(wp)
    setActiveTab('route')
  }

  const applyPos = (myLat: number, myLon: number) => {
    ;(window as any).__FLY_TO?.([myLat, myLon])
    ;(window as any).__SET_MY_LOCATION?.([myLat, myLon])
    setFrom({ lat: myLat, lon: myLon, name: 'Моё местоположение' })
    setTo({ lat, lon, name })
    setTimeout(() => { ;(window as any).__BUILD_ROUTE?.(); setActiveTab('route') }, 150)
    setRouting(false)
  }

  const routeFromMe = () => {
    setRouting(true)
    const tryIP = async () => {
      for (const url of ['https://ipinfo.io/json', 'https://ipapi.co/json/', 'https://freeipapi.com/api/json']) {
        try {
          const d = await fetch(url, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
          const lt = d.lat ?? d.latitude ?? (d.loc?.split(',')[0])
          const ln = d.lon ?? d.longitude ?? (d.loc?.split(',')[1])
          if (lt && ln) { applyPos(+lt, +ln); return }
        } catch {}
      }
      setRouting(false); alert('Не удалось определить местоположение')
    }
    if (!navigator.geolocation) { tryIP(); return }
    navigator.geolocation.getCurrentPosition(
      pos => applyPos(pos.coords.latitude, pos.coords.longitude),
      () => tryIP(),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    )
  }

  return (
    <div style={{ padding: 12, overflowY: 'auto' }}>
      {showLogin && <LoginModal onClose={onLoginClose} />}

      <div style={{ fontSize: 15, fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
        {type === 'well' ? 'Скважина' : type === 'bkns' ? 'БКНС' : 'ГУ'} • {lat.toFixed(5)}, {lon.toFixed(5)}
      </div>

      <div style={{ ...sec, fontSize: 12, color: '#94a3b8' }}>
        {Object.entries(properties || {})
          .filter(([k, v]) => v && !['id','layer_type','OBJECTID','OBJECTID_1','Shape_Leng','Shape_Area','PERIMETER','GU_','GU_ID'].includes(k))
          .map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ color: '#475569' }}>{k}:</span>
              <span>{String(v)}</span>
            </div>
          ))}
      </div>

      {isWell && wellKey && (
        <>
          <SensorBlock wellKey={wellKey} wellNum={wellNum} />
          <EquipmentBlock wellKey={wellKey} canEdit={authed} onAuth={() => setShowLogin(true)} />
          <RepairsBlock wellKey={wellKey} canEdit={authed} onAuth={() => setShowLogin(true)} />
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        {authed
          ? <button style={iBtn} onClick={() => { logout(); setAuthed(false) }}>{user} · Выйти</button>
          : <button style={iBtn} onClick={() => setShowLogin(true)}>🔐 Войти для редактирования</button>
        }
      </div>

      <button onClick={routeFromMe} disabled={routing} style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 600, marginBottom: 8, background: routing ? '#1e3a5f' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 6, cursor: routing ? 'wait' : 'pointer', boxShadow: '0 2px 6px rgba(29,78,216,0.4)' }}>
        {routing ? '⏳ Определяю местоположение...' : '🎯 Маршрут от меня сюда'}
      </button>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setAsRoute('from')} style={{ flex: 1, padding: '7px', fontSize: 12, background: '#1e293b', color: '#22c55e', border: '1px solid #22c55e', borderRadius: 6, cursor: 'pointer' }}>📍 Откуда</button>
        <button onClick={() => setAsRoute('to')} style={{ flex: 1, padding: '7px', fontSize: 12, background: '#1e293b', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, cursor: 'pointer' }}>🏁 Куда</button>
      </div>
    </div>
  )
}
