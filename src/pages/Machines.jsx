import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Monitor, AlertTriangle, X, ChevronRight } from 'lucide-react'
import MachineQR from '../components/MachineQR'
import api from '../lib/api'

function MachineModal({ machine, locations, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', machine_type: 'snack', location_id: locations[0]?.id || '',
    cantaloupe_device_id: '', serial_number: '', model: '',
    layout_rows: 5, layout_cols: 6, commission_pct: 0, monthly_fixed_cost: 0,
    ...machine
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.location_id) return alert('Name and location required')
    setSaving(true)
    try {
      if (machine?.id) await api.put(`/machines/${machine.id}`, form)
      else await api.post('/machines', form)
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{machine?.id ? 'Edit Machine' : 'New Machine'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Location *</label>
            <select className="input" value={form.location_id} onChange={e => set('location_id', e.target.value)}>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Machine Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Snack Machine" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.machine_type} onChange={e => set('machine_type', e.target.value)}>
              {['snack','drinks','combo'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cantaloupe Device ID</label>
            <input className="input" value={form.cantaloupe_device_id || ''} onChange={e => set('cantaloupe_device_id', e.target.value)} placeholder="e.g. VK100125641" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Grid Rows</label>
              <input type="number" className="input" value={form.layout_rows} onChange={e => set('layout_rows', Number(e.target.value))} min={1} max={12} />
            </div>
            <div>
              <label className="label">Grid Cols</label>
              <input type="number" className="input" value={form.layout_cols} onChange={e => set('layout_cols', Number(e.target.value))} min={1} max={15} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Commission %</label>
              <input type="number" className="input" value={form.commission_pct} onChange={e => set('commission_pct', Number(e.target.value))} min={0} max={100} step={0.1} />
            </div>
            <div>
              <label className="label">Monthly Fixed Cost $</label>
              <input type="number" className="input" value={form.monthly_fixed_cost} onChange={e => set('monthly_fixed_cost', Number(e.target.value))} min={0} step={0.01} />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Machines() {
  const [machines, setMachines] = useState([])
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [params] = useSearchParams()

  const load = () => {
    const qs = params.get('location_id') ? `?location_id=${params.get('location_id')}` : ''
    Promise.all([api.get(`/machines${qs}`), api.get('/locations')])
      .then(([m, l]) => { setMachines(m.data); setLocations(l.data) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const typeColor = { snack: 'bg-orange-100 text-orange-700', drinks: 'bg-blue-100 text-blue-700', combo: 'bg-purple-100 text-purple-700' }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machines</h1>
          <p className="text-sm text-gray-500 mt-1">All vending machines across locations</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Add Machine
        </button>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map(m => (
            <Link key={m.id} to={`/machines/${m.id}`} className="card p-5 hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-gray-100 rounded-lg"><Monitor size={20} className="text-gray-600" /></div>
                <span className={`badge ${typeColor[m.machine_type] || 'bg-gray-100 text-gray-600'}`}>{m.machine_type}</span>
              </div>
              <h3 className="font-semibold text-gray-900">{m.name}</h3>
              <p className="text-sm text-gray-500">{m.location_name} · {m.city}, {m.state}</p>
              {m.cantaloupe_device_id && <p className="text-xs font-mono text-gray-400 mt-1">{m.cantaloupe_device_id}</p>}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                <span>{m.slot_count} slots</span>
                {m.empty_slots > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle size={12} /> {m.empty_slots} empty
                  </span>
                )}
                {m.low_slots > 0 && (
                  <span className="flex items-center gap-1 text-amber-600">
                    {m.low_slots} low
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className={`badge ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.status}</span>
                <div className="flex items-center gap-2">
                  <span onClick={e => e.preventDefault()}>
                    <MachineQR machine={m} />
                  </span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
          {machines.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              No machines yet. <button className="text-brand-600 underline" onClick={() => setModal({})}>Add your first machine</button>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <MachineModal machine={modal} locations={locations} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
