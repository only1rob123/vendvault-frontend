import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MapPin, Monitor, Pencil, X } from 'lucide-react'
import api from '../lib/api'

function LocationModal({ location, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zip: '', notes: '', ...location })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name) return alert('Name required')
    setSaving(true)
    try {
      if (location?.id) await api.put(`/locations/${location.id}`, form)
      else await api.post('/locations', form)
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{location?.id ? 'Edit Location' : 'New Location'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-5 space-y-3">
          {[['name','Location Name *'], ['address','Address'], ['city','City'], ['state','State'], ['zip','ZIP'], ['notes','Notes']].map(([k, label]) => (
            <div key={k}>
              <label className="label">{label}</label>
              <input className="input" value={form[k] || ''} onChange={e => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Locations() {
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/locations').then(r => { setLocations(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-500 mt-1">Properties where machines are deployed</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Add Location
        </button>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-brand-50 rounded-lg"><MapPin size={18} className="text-brand-600" /></div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-gray-100 rounded-lg" onClick={() => setModal(loc)}>
                    <Pencil size={14} className="text-gray-400" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{loc.name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{[loc.city, loc.state].filter(Boolean).join(', ')}</p>
              {loc.address && <p className="text-xs text-gray-400 mt-1">{loc.address}</p>}
              <div className="flex items-center gap-1 mt-3 text-sm text-gray-600">
                <Monitor size={14} />
                <Link to={`/machines?location_id=${loc.id}`} className="hover:text-brand-600">
                  {loc.machine_count} machine{loc.machine_count !== 1 ? 's' : ''}
                </Link>
              </div>
              <span className={`badge mt-2 ${loc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {loc.status}
              </span>
            </div>
          ))}
          {locations.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              No locations yet. <button className="text-brand-600 underline" onClick={() => setModal({})}>Add your first location</button>
            </div>
          )}
        </div>
      )}

      {modal !== null && (
        <LocationModal location={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
