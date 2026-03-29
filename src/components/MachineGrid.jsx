import { useState } from 'react'
import api from '../lib/api'

const CATEGORY_COLORS = {
  drink: 'bg-blue-100 border-blue-300 text-blue-800',
  snack: 'bg-orange-100 border-orange-300 text-orange-800',
  candy: 'bg-pink-100 border-pink-300 text-pink-800',
  healthy: 'bg-green-100 border-green-300 text-green-800',
  default: 'bg-gray-100 border-gray-300 text-gray-700',
}

function stockColor(qty, capacity) {
  if (!capacity || qty === undefined) return 'border-gray-200 bg-gray-50'
  const pct = qty / capacity
  if (qty === 0) return 'border-red-300 bg-red-50'
  if (pct <= 0.25) return 'border-amber-300 bg-amber-50'
  return 'border-green-300 bg-green-50'
}

function SlotModal({ slot, products, onClose, onSave }) {
  const [selectedProduct, setSelectedProduct] = useState(slot.product_id || '')
  const [qty, setQty] = useState(slot.current_quantity ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (selectedProduct !== (slot.product_id || '')) {
        await api.post(`/slots/${slot.id}/assign`, { product_id: selectedProduct || null })
      }
      if (qty !== slot.current_quantity) {
        await api.patch(`/slots/${slot.id}/stock`, { quantity: Number(qty) })
      }
      onSave()
    } catch (e) {
      alert(e.response?.data?.error || 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Slot {slot.slot_code}</h3>
          <p className="text-sm text-gray-500">Assign product &amp; update stock</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Product</label>
            <select className="input" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
              <option value="">— Unassigned —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Current Stock (units)</label>
            <input type="number" min="0" max={slot.capacity} className="input"
              value={qty} onChange={e => setQty(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Capacity: {slot.capacity} units</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MachineGrid({ machine, slots, products, onRefresh }) {
  const [editSlot, setEditSlot] = useState(null)

  if (!machine) return null

  // Build grid: rows × cols, fill in known slots
  const rows = machine.layout_rows || 5
  const cols = machine.layout_cols || 6

  // Group slots by row/col position
  const slotMap = {}
  for (const s of (slots || [])) {
    slotMap[`${s.row_index}-${s.col_index}`] = s
  }

  // Also list slots that don't fit the grid (by slot_code only)
  const positionedSlotIds = new Set(Object.values(slotMap).map(s => s.id))
  const unpositioned = (slots || []).filter(s => !positionedSlotIds.has(s.id) || true)
    .filter(s => slotMap[`${s.row_index}-${s.col_index}`]?.id === s.id)

  return (
    <div>
      {/* Visual grid */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Machine Layout — {machine.name}</h3>
          <div className="flex gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 border border-green-300 inline-block"></span>Stocked</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300 inline-block"></span>Low</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 border border-red-300 inline-block"></span>Empty</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block"></span>No product</span>
          </div>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
              const slot = slotMap[`${r}-${c}`]
              if (!slot) {
                return (
                  <div key={`empty-${r}-${c}`}
                    className="border-2 border-dashed border-gray-200 rounded-lg p-2 min-h-[72px] flex items-center justify-center">
                    <span className="text-xs text-gray-300">—</span>
                  </div>
                )
              }
              const hasProduct = !!slot.product_name
              const catColor = hasProduct ? (CATEGORY_COLORS[slot.category] || CATEGORY_COLORS.default) : 'bg-gray-50 border-gray-200 text-gray-400'
              const borderColor = stockColor(slot.current_quantity, slot.capacity)

              return (
                <button key={slot.id} onClick={() => setEditSlot(slot)}
                  className={`border-2 rounded-lg p-2 min-h-[72px] text-left transition-all hover:shadow-md hover:scale-[1.02] ${borderColor}`}
                  title={`Slot ${slot.slot_code}${slot.product_name ? ` — ${slot.product_name}` : ''}`}
                >
                  <div className="text-xs font-mono text-gray-400 mb-1">{slot.slot_code}</div>
                  {hasProduct ? (
                    <>
                      <div className="text-xs font-medium text-gray-800 leading-tight line-clamp-2">{slot.product_name}</div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`badge ${catColor} text-[10px]`}>{slot.category}</span>
                        <span className={`text-xs font-bold ${slot.current_quantity === 0 ? 'text-red-600' : slot.current_quantity <= slot.capacity * 0.25 ? 'text-amber-600' : 'text-green-600'}`}>
                          {slot.current_quantity}/{slot.capacity}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 italic">Unassigned</div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Slot list */}
      <div className="card mt-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-sm text-gray-900">All Slots</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(slots || []).length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No slots configured. Import sales data to auto-create slots.</p>
          )}
          {(slots || []).map(slot => (
            <div key={slot.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
              <div className="font-mono text-sm font-medium text-gray-700 w-16">{slot.slot_code}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{slot.product_name || <span className="text-gray-400 italic">Unassigned</span>}</div>
                {slot.sell_price && <div className="text-xs text-gray-400">${Number(slot.sell_price).toFixed(2)} sell · ${Number(slot.purchase_price).toFixed(2)} cost</div>}
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium ${slot.current_quantity === 0 ? 'text-red-600' : slot.current_quantity <= slot.capacity * 0.25 ? 'text-amber-600' : 'text-green-700'}`}>
                  {slot.current_quantity}/{slot.capacity}
                </div>
                <button className="btn-secondary text-xs py-1 px-2" onClick={() => setEditSlot(slot)}>Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editSlot && (
        <SlotModal
          slot={editSlot}
          products={products}
          onClose={() => setEditSlot(null)}
          onSave={() => { setEditSlot(null); onRefresh() }}
        />
      )}
    </div>
  )
}
