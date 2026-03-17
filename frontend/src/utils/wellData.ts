export interface RepairRecord { id: string; date: string; type: 'KRS' | 'PRS'; desc: string }
export interface WellEquipment {
  cabinet_type: string; vfd_type: string; motor_type: string
  repairs: RepairRecord[]
  sensors: { pressure: number; temperature: number; updated_at: string }
}
const KEY = 'kalamkas_well_data'
const THREE_YEARS = 3 * 365 * 24 * 60 * 60 * 1000

function load(): Record<string, WellEquipment> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function save(d: Record<string, WellEquipment>) { localStorage.setItem(KEY, JSON.stringify(d)) }

export function getWellData(k: string): WellEquipment {
  return load()[k] || { cabinet_type: '', vfd_type: '', motor_type: '', repairs: [], sensors: { pressure: 0, temperature: 0, updated_at: '' } }
}
export function saveWellEquipment(k: string, f: Pick<WellEquipment, 'cabinet_type' | 'vfd_type' | 'motor_type'>) {
  const a = load(); a[k] = { ...getWellData(k), ...f }; save(a)
}
export function addRepair(k: string, r: Omit<RepairRecord, 'id'>) {
  const a = load(); const well = getWellData(k)
  const list = well.repairs.filter(x => new Date(x.date).getTime() >= Date.now() - THREE_YEARS)
  list.push({ ...r, id: crypto.randomUUID() })
  list.sort((a, b) => b.date.localeCompare(a.date))
  a[k] = { ...well, repairs: list }; save(a)
}
export function deleteRepair(k: string, id: string) {
  const a = load(); const well = getWellData(k)
  a[k] = { ...well, repairs: well.repairs.filter(r => r.id !== id) }; save(a)
}
export function updateSensors(k: string, pressure: number, temperature: number) {
  const a = load()
  a[k] = { ...getWellData(k), sensors: { pressure, temperature, updated_at: new Date().toISOString() } }
  save(a)
}
export function simulateSensors(num: string | number): { pressure: number; temperature: number } {
  const seed = typeof num === 'number' ? num : (parseInt(String(num)) || 1000)
  const bP = 80 + (seed % 120); const bT = 40 + (seed % 50)
  const n = () => 1 + (Math.random() - 0.5) * 0.04
  return { pressure: parseFloat((bP * n()).toFixed(1)), temperature: parseFloat((bT * n()).toFixed(1)) }
}
