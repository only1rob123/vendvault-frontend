import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PackagePlus, CheckCircle, ArrowLeft, Plus, Minus, Truck } from 'lucide-react'
import api from '../lib/api'

// Stock level bar component
function StockBar({ current, capacity }) {
  const pct = capacity > 0 ? (current / capacity) * 100 : 0
  const color = current === 0 ? 'bg-red-500' : pct <= 25 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// Mobile slot card
function SlotCard({ slot, qty, onChange }) {
  const space = slot.capacity - slot.current_quantity
  const isDisabled = space === 0
  const loadQty = Number(qty) || 0

  const increment = () => { if (loadQty < space) onChange(String(loadQty + 1)) }
  const decrement = () => { if (loadQty > 0) onChange(String(loadQty - 1)) }

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-colors ${loadQty > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200'} ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{slot.slot_code}</span>
          <div className="font-semibold text-gray-900 mt-1.5">{slot.product_name}</div>
          <div className="text-xs text-gray-400 capitalize">{slot.category}</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${slot.current_quantity === 0 ? 'text-red-600' : slot.current_quantity <= slot.capacity * 0.25 ? 'text-amber-600' : 'text-green-700'}`}>
            {slot.current_quantity}<span className="text-xs font-normal text-gray-400">/{slot.capacity}</span>
          </div>
          <div className="text-xs text-gray-400">{isDisabled ? 'Full' : `${space} space`}</div>
        </div>
      </div>

      <StockBar current={slot.current_quantity} capacity={slot.capacity} />

      {!isDisabled && (
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={decrement}
            disabled={loadQty === 0}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <Minus size={18} />
          </button>
          <input
            type="number" min="0" max={space}
            value={qty}
            onChange={e => onChange(e.target.value)}
            className="flex-1 text-center text-xl font-bold border-2 border-gray-200 rounded-xl py-2 focus:border-brand-400 focus:outline-none"
            placeholder="0"
          />
          <button
            onClick={increment}
            disabled={loadQty >= space}
            className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-brand-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
      )}

      {loadQty > 0 && (
        <div className="mt-2 text-xs text-green-700 font-medium text-center">
          +{loadQty} unit{loadQty !== 1 ? 's' : ''} → {slot.current_quantity + loadQty}/{slot.capacity}
        </div>
      )}
    </div>
  )
}

export default function Load() {
  const { machineId: initialId } = useParams()
  const [machines, setMachines] = useState([])
  const [selectedId, setSelectedId] = useState(initialId || '')
  const [machine, setMachine] = useState(null)
  const [fromType, setFromType] = useState('warehouse')
  const [loadAmounts, setLoadAmounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [activeRun, setActiveRun] = useState(null)

  useEffect(() => {
    api.get('/machines').then(r => setMachines(r.data))
    api.get('/delivery-runs/active').then(r => {
      if (r.data.run) { setActiveRun(r.data.run); setFromType('delivery') }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) { setMachine(null); return }
    setLoading(true)
    setLoadAmounts({})
    setSuccess(null)
    api.get(`/machines/${selectedId}`)
      .then(r => setMachine(r.data))
      .finally(() => setLoading(false))
  }, [selectedId])

  const assignedSlots = (machine?.slots || []).filter(s => s.product_name)

  const setAmount = (slotId, val) => setLoadAmounts(prev => ({ ...prev, [slotId]: val }))

  const fillAll = () => {
    const fills = {}
    assignedSlots.forEach(s => {
      const space = s.capacity - s.current_quantity
      if (space > 0) fills[s.id] = space
    })
    setLoadAmounts(fills)
  }

  const handleSubmit = async () => {
    const items = Object.entries(loadAmounts)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([slot_id, quantity]) => {
        const slot = assignedSlots.find(s => s.id === slot_id)
        return { slot_id, product_id: slot?.product_id, quantity: Number(quantity) }
      })
    if (!items.length) return alert('Enter at least one quantity to load')
    setSaving(true)
    try {
      let totalLoaded
      if (fromType === 'delivery' && activeRun) {
        const r = await api.post(`/delivery-runs/${activeRun.id}/load-machine`, {
          machine_id: selectedId,
          items
        })
        totalLoaded = r.data.total_loaded
        // Refresh active run
        api.get('/delivery-runs/active').then(r2 => setActiveRun(r2.data.run))
      } else {
        const r = await api.post(`/machines/${selectedId}/restock`, {
          from_type: fromType,
          from_id: machine?.location_id,
          items: items.map(({ slot_id, quantity }) => ({ slot_id, quantity }))
        })
        totalLoaded = r.data.total_loaded
      }
      setSuccess(totalLoaded)
      setLoadAmounts({})
      api.get(`/machines/${selectedId}`).then(r => setMachine(r.data))
    } catch (e) {
      alert(e.response?.data?.error || 'Error loading products')
    } finally {
      setSaving(false)
    }
  }

  const totalUnits = Object.values(loadAmounts).reduce((s, v) => s + (Number(v) || 0), 0)
  const emptySlots = assignedSlots.filter(s => s.current_quantity === 0).length
  const lowSlots = assignedSlots.filter(s => s.current_quantity > 0 && s.current_quantity <= s.capacity * 0.25).length

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/machines" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} className="text-gray-500" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 flex items-center gap-2">
                <PackagePlus size={18} className="text-brand-600 shrink-0" />
                Load Machine
              </h1>
              {machine && (
                <p className="text-xs text-gray-500 truncate">{machine.name} · {machine.location_name}</p>
              )}
            </div>
          </div>

          {/* Active run badge */}
          {activeRun && (
            <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs text-amber-800">
              <Truck size={12} className="text-amber-600" />
              <span className="font-medium">Delivery run active</span> — loading from delivery stock
              <Link to="/delivery-runs" className="ml-auto text-amber-700 hover:underline">View Run</Link>
            </div>
          )}

          {/* Machine + Source selectors */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <select
              className="input py-2 text-sm"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">— Select machine —</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              className="input py-2 text-sm"
              value={fromType}
              onChange={e => setFromType(e.target.value)}
            >
              {activeRun && <option value="delivery">🚚 From Delivery Run</option>}
              <option value="warehouse">From Warehouse</option>
              <option value="onsite">From On-Site</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Success banner */}
        {success !== null && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800">
            <CheckCircle size={18} className="shrink-0" />
            <div>
              <div className="font-semibold">Load Complete!</div>
              <div className="text-sm">{success} units loaded into {machine?.name}</div>
            </div>
            <button className="ml-auto text-green-600 text-sm underline shrink-0" onClick={() => setSuccess(null)}>✕</button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 text-gray-400">Loading machine data...</div>
        )}

        {machine && !loading && (
          <>
            {/* Machine status summary */}
            {(emptySlots > 0 || lowSlots > 0) && (
              <div className="flex gap-2 mb-4">
                {emptySlots > 0 && (
                  <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{emptySlots}</div>
                    <div className="text-xs text-red-500">Empty slot{emptySlots !== 1 ? 's' : ''}</div>
                  </div>
                )}
                {lowSlots > 0 && (
                  <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">{lowSlots}</div>
                    <div className="text-xs text-amber-500">Low slot{lowSlots !== 1 ? 's' : ''}</div>
                  </div>
                )}
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-gray-700">{assignedSlots.length}</div>
                  <div className="text-xs text-gray-500">Total slots</div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 mb-4">
              <button className="flex-1 btn-secondary text-sm py-2" onClick={fillAll}>
                Fill All to Capacity
              </button>
              <button className="btn-secondary text-sm py-2 px-3" onClick={() => setLoadAmounts({})}>
                Clear
              </button>
            </div>

            {assignedSlots.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <PackagePlus size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No slots with products assigned.</p>
                <Link to={`/machines/${selectedId}`} className="text-brand-500 underline text-sm mt-1 block">
                  Set up machine layout →
                </Link>
              </div>
            ) : (
              /* Slot cards — mobile first */
              <div className="space-y-3">
                {assignedSlots.map(slot => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    qty={loadAmounts[slot.id] ?? ''}
                    onChange={val => setAmount(slot.id, val)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!selectedId && !loading && (
          <div className="text-center py-16 text-gray-400">
            <PackagePlus size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-500">Select a machine to begin</p>
            <p className="text-sm mt-1">Choose from the dropdown above</p>
          </div>
        )}
      </div>

      {/* Sticky bottom confirm bar — shows when units are ready */}
      {totalUnits > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <div className="font-bold text-gray-900">{totalUnits} units ready to load</div>
              <div className="text-xs text-gray-500">
                {Object.values(loadAmounts).filter(v => Number(v) > 0).length} slot{Object.values(loadAmounts).filter(v => Number(v) > 0).length !== 1 ? 's' : ''} · from {fromType === 'delivery' ? 'delivery run' : fromType}
              </div>
            </div>
            <button
              className="btn-primary text-base py-3 px-6"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Loading...' : 'Confirm Load'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
