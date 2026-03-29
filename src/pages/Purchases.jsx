import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, X, ShoppingCart, CheckCircle, Package, Download } from 'lucide-react'
import api from '../lib/api'
import { exportCsv } from '../lib/exportCsv'

const STATUS_COLORS = {
  ordered: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

function POModal({ po, products, onClose, onSave }) {
  const [form, setForm] = useState({
    product_id: po?.product_id || '',
    quantity: po?.quantity || '',
    unit_cost: po?.unit_cost || '',
    supplier: po?.supplier || '',
    purchase_order_ref: po?.purchase_order_ref || '',
    notes: po?.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalCost = (Number(form.quantity) * Number(form.unit_cost)) || 0

  const handleSave = async () => {
    if (!form.product_id || !form.quantity || !form.unit_cost) {
      return alert('Product, quantity and unit cost are required')
    }
    setSaving(true)
    try {
      if (po?.id) {
        await api.put(`/purchases/${po.id}`, form)
      } else {
        await api.post('/purchases', form)
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{po?.id ? 'Edit Order' : 'New Purchase Order'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Product *</label>
            <select className="input" value={form.product_id} onChange={e => set('product_id', e.target.value)} disabled={!!po?.id}>
              <option value="">— Select product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" min="1" className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div>
              <label className="label">Unit Cost $ *</label>
              <input type="number" min="0" step="0.01" className="input" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} />
            </div>
          </div>
          {totalCost > 0 && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm flex justify-between">
              <span className="text-gray-500">Total Order Cost</span>
              <span className="font-bold text-gray-900">${totalCost.toFixed(2)}</span>
            </div>
          )}
          <div>
            <label className="label">Supplier</label>
            <input className="input" value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. Costco, Sam's Club" />
          </div>
          <div>
            <label className="label">PO Reference</label>
            <input className="input" value={form.purchase_order_ref} onChange={e => set('purchase_order_ref', e.target.value)} placeholder="Optional order number" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReceiveModal({ po, onClose, onSave }) {
  const [qtyReceived, setQtyReceived] = useState(po.quantity)
  const [saving, setSaving] = useState(false)

  const handleReceive = async () => {
    setSaving(true)
    try {
      await api.put(`/purchases/${po.id}/receive`, { quantity_received: Number(qtyReceived) })
      onSave()
    } catch (e) {
      alert(e.response?.data?.error || 'Error receiving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Receive Order</h3>
            <p className="text-sm text-gray-500 mt-0.5">{po.product_name}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Ordered</span><span className="font-medium">{po.quantity} units</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Unit cost</span><span className="font-medium">${Number(po.unit_cost).toFixed(2)}</span></div>
            {po.supplier && <div className="flex justify-between"><span className="text-gray-500">Supplier</span><span className="font-medium">{po.supplier}</span></div>}
          </div>
          <div>
            <label className="label">Quantity Received</label>
            <input type="number" min="1" max={po.quantity} className="input"
              value={qtyReceived} onChange={e => setQtyReceived(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Will be added to warehouse inventory</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleReceive} disabled={saving}>
            <CheckCircle size={15} />
            {saving ? 'Receiving...' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Purchases() {
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [receiveModal, setReceiveModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get('/purchases'),
      api.get('/products'),
    ]).then(([o, p]) => {
      setOrders(o.data)
      const activeProducts = p.data.filter(p => p.status === 'active')
      setProducts(activeProducts)
      // Auto-open modal if ?product_id= is in URL
      const pid = searchParams.get('product_id')
      if (pid) setModal({ product_id: pid })
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter)

  const totalPending = orders.filter(o => o.status === 'ordered').reduce((s, o) => s + o.total_cost, 0)
  const totalReceived = orders.filter(o => o.status === 'received').reduce((s, o) => s + o.total_cost, 0)

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return
    await api.delete(`/purchases/${id}`)
    load()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={22} className="text-brand-600" /> Purchasing
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track product orders and receive into warehouse inventory</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={() => exportCsv(orders, 'purchases.csv', ['product_name', 'category', 'quantity', 'unit_cost', 'total_cost', 'supplier', 'purchase_order_ref', 'status', 'ordered_at', 'received_at'])}><Download size={13} /> Export</button>
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium">Pending Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalPending.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{orders.filter(o => o.status === 'ordered').length} orders outstanding</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 font-medium">Total Purchased (All Time)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">${totalReceived.toFixed(2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{orders.filter(o => o.status === 'received').length} orders received</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {['all', 'ordered', 'received', 'cancelled'].map(s => (
          <button key={s}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setStatusFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders yet. Create your first purchase order to track product inventory.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Qty</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Unit Cost</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Supplier</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{o.product_name}</div>
                      {o.purchase_order_ref && <div className="text-xs text-gray-400">PO: {o.purchase_order_ref}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{o.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">${Number(o.unit_cost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold">${Number(o.total_cost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">{o.supplier || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{o.ordered_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {o.status === 'ordered' && (
                          <>
                            <button className="btn-primary text-xs py-1 px-2" onClick={() => setReceiveModal(o)}>
                              Receive
                            </button>
                            <button className="btn-secondary text-xs py-1 px-2" onClick={() => setModal(o)}>
                              Edit
                            </button>
                            <button className="btn-danger text-xs py-1 px-2" onClick={() => handleCancel(o.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal !== null && (
        <POModal po={modal} products={products} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
      {receiveModal && (
        <ReceiveModal po={receiveModal} onClose={() => setReceiveModal(null)} onSave={() => { setReceiveModal(null); load() }} />
      )}
    </div>
  )
}
