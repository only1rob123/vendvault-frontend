import { useState } from 'react'
import { X, Package } from 'lucide-react'
import api from '../lib/api'

export default function ReceiveStockModal({ products, onClose, onSave }) {
  const [form, setForm] = useState({
    product_id: '',
    quantity: '',
    pricing_mode: 'unit',   // 'unit' or 'box'
    unit_cost: '',
    box_quantity: '',
    box_price: '',
    expiration_date: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const computedUnitCost = form.pricing_mode === 'box' && form.box_quantity && form.box_price
    ? (Number(form.box_price) / Number(form.box_quantity)).toFixed(4)
    : null

  const handleSubmit = async () => {
    if (!form.product_id) return setError('Select a product')
    if (!form.quantity || Number(form.quantity) <= 0) return setError('Enter a valid quantity')
    setError(null)
    setSaving(true)
    try {
      const payload = {
        product_id: form.product_id,
        quantity: Number(form.quantity),
        expiration_date: form.expiration_date || undefined,
        notes: form.notes || undefined,
      }
      if (form.pricing_mode === 'unit' && form.unit_cost !== '') {
        payload.unit_cost = Number(form.unit_cost)
      } else if (form.pricing_mode === 'box' && form.box_quantity && form.box_price) {
        payload.box_quantity = Number(form.box_quantity)
        payload.box_price = Number(form.box_price)
      }
      await api.post('/inventory/warehouse/receive', payload)
      onSave()
      onClose()
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to receive stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package size={17} className="text-brand-600" /> Receive Stock
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product */}
          <div>
            <label className="label">Product</label>
            <select className="input" value={form.product_id} onChange={e => set('product_id', e.target.value)}>
              <option value="">Select product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku || p.category})</option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="label">Quantity Received</label>
            <input
              type="number" min="1" className="input"
              placeholder="e.g. 48"
              value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
            />
          </div>

          {/* Pricing mode toggle */}
          <div>
            <label className="label">Cost Basis</label>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${form.pricing_mode === 'unit' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                onClick={() => set('pricing_mode', 'unit')}
              >Unit Cost</button>
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${form.pricing_mode === 'box' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                onClick={() => set('pricing_mode', 'box')}
              >Box Pricing</button>
            </div>
          </div>

          {form.pricing_mode === 'unit' ? (
            <div>
              <label className="label">Unit Cost ($) <span className="text-gray-400 font-normal">optional</span></label>
              <input
                type="number" min="0" step="0.01" className="input"
                placeholder="0.00"
                value={form.unit_cost}
                onChange={e => set('unit_cost', e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Units per Box</label>
                <input
                  type="number" min="1" className="input"
                  placeholder="e.g. 24"
                  value={form.box_quantity}
                  onChange={e => set('box_quantity', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Price per Box ($)</label>
                <input
                  type="number" min="0" step="0.01" className="input"
                  placeholder="0.00"
                  value={form.box_price}
                  onChange={e => set('box_price', e.target.value)}
                />
              </div>
              {computedUnitCost && (
                <div className="col-span-2 text-xs text-gray-500 -mt-1">
                  = <strong className="text-gray-800">${computedUnitCost}</strong> per unit
                </div>
              )}
            </div>
          )}

          {/* Expiration date */}
          <div>
            <label className="label">Expiration Date <span className="text-gray-400 font-normal">optional</span></label>
            <input
              type="date" className="input"
              value={form.expiration_date}
              onChange={e => set('expiration_date', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-gray-400 font-normal">optional</span></label>
            <input
              type="text" className="input"
              placeholder="e.g. Costco delivery, PO #123"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Receiving...' : 'Receive Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
