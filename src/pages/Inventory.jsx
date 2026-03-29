import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Warehouse, AlertTriangle, ArrowRight, Download, PackagePlus, Truck, Calendar } from 'lucide-react'
import api from '../lib/api'
import { exportCsv } from '../lib/exportCsv'
import ActiveRunBanner from '../components/ActiveRunBanner'
import ReceiveStockModal from '../components/ReceiveStockModal'

function TransferModal({ products, locations, onClose, onSave }) {
  const [form, setForm] = useState({ product_id: '', from_type: 'warehouse', to_type: 'onsite', to_id: '', quantity: 1 })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.product_id || !form.quantity) return alert('Product and quantity required')
    if (form.to_type === 'onsite' && !form.to_id) return alert('Select destination location')
    setSaving(true)
    try {
      await api.post('/inventory/transfer', {
        product_id: form.product_id, from_type: form.from_type,
        to_type: form.to_type, to_id: form.to_id || undefined, quantity: Number(form.quantity)
      })
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Transfer Stock</h3>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Product</label>
            <select className="input" value={form.product_id} onChange={e => set('product_id', e.target.value)}>
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <div>
              <label className="label">From</label>
              <select className="input" value={form.from_type} onChange={e => set('from_type', e.target.value)}>
                <option value="warehouse">Warehouse</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div className="text-center mt-5"><ArrowRight size={16} className="text-gray-400 mx-auto" /></div>
            <div>
              <label className="label">To</label>
              <select className="input" value={form.to_type} onChange={e => set('to_type', e.target.value)}>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>
          {form.to_type === 'onsite' && (
            <div>
              <label className="label">Destination Location</label>
              <select className="input" value={form.to_id} onChange={e => set('to_id', e.target.value)}>
                <option value="">Select location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Quantity</label>
            <input type="number" min={1} className="input" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Transfer'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const [warehouse, setWarehouse] = useState([])
  const [onsite, setOnsite] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(false)
  const [receiveModal, setReceiveModal] = useState(false)
  const [editQty, setEditQty] = useState({})
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get('/inventory/warehouse'),
      api.get('/inventory/onsite'),
      api.get('/products'),
      api.get('/locations'),
    ]).then(([w, o, p, l]) => {
      setWarehouse(w.data); setOnsite(o.data)
      setProducts(p.data); setLocations(l.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const saveWarehouseQty = async (productId, qty) => {
    await api.patch(`/inventory/warehouse/${productId}`, { quantity: Number(qty) })
    load()
    setEditQty({})
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Warehouse stock, on-site stock, and transfers</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={() => setReceiveModal(true)}>
            <PackagePlus size={15} /> Receive Stock
          </button>
          <Link to="/delivery-runs" className="btn-primary flex items-center gap-1.5 text-sm">
            <Truck size={15} /> Delivery Run
          </Link>
          <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={() => setModal(true)}>
            <ArrowRight size={15} /> Transfer
          </button>
        </div>
      </div>

      <ActiveRunBanner />

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-6">
          {/* Warehouse */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Warehouse size={16} className="text-brand-600" />
                <h2 className="font-semibold text-sm text-gray-900">Warehouse</h2>
              </div>
              <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={() => exportCsv(warehouse, 'warehouse-inventory.csv', ['product_name', 'category', 'sku', 'quantity', 'reorder_threshold', 'purchase_price'])}><Download size={13} /> Export</button>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Category</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">On Hand</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Reorder At</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Expires</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Value</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {warehouse.map(item => {
                  const daysToExpiry = item.earliest_expiry
                    ? Math.floor((new Date(item.earliest_expiry) - Date.now()) / 86400000)
                    : null
                  const expiryUrgent = daysToExpiry !== null && daysToExpiry <= 7
                  const expirySoon = daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry > 7
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity <= item.reorder_threshold ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-gray-500">{item.category}</td>
                      <td className="px-4 py-3 text-right">
                        {editQty[item.product_id] !== undefined ? (
                          <div className="flex items-center justify-end gap-1">
                            <input type="number" min={0} className="input w-20 py-1 text-right text-xs"
                              value={editQty[item.product_id]}
                              onChange={e => setEditQty(q => ({ ...q, [item.product_id]: e.target.value }))} />
                            <button className="btn-primary py-1 px-2 text-xs"
                              onClick={() => saveWarehouseQty(item.product_id, editQty[item.product_id])}>✓</button>
                            <button className="btn-secondary py-1 px-2 text-xs"
                              onClick={() => setEditQty(q => { const n = {...q}; delete n[item.product_id]; return n })}>✕</button>
                          </div>
                        ) : (
                          <span className={`font-medium ${item.quantity <= item.reorder_threshold ? 'text-amber-600' : 'text-gray-900'}`}>
                            {item.quantity <= item.reorder_threshold && <AlertTriangle size={12} className="inline mr-1" />}
                            {item.quantity}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.reorder_threshold}</td>
                      <td className="px-4 py-3 text-right">
                        {item.earliest_expiry ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                            expiryUrgent ? 'bg-red-100 text-red-700' :
                            expirySoon ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <Calendar size={10} />
                            {expiryUrgent ? `${daysToExpiry}d` : expirySoon ? `${daysToExpiry}d` : item.earliest_expiry}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">${(item.quantity * Number(item.purchase_price)).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="btn-secondary py-1 px-2 text-xs"
                          onClick={() => setEditQty(q => ({ ...q, [item.product_id]: item.quantity }))}>Edit</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* On-site */}
          {onsite.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-semibold text-sm text-gray-900">On-Site Storage</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Location</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {onsite.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{item.location_name}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <TransferModal products={products} locations={locations}
          onClose={() => setModal(false)} onSave={() => { setModal(false); load() }} />
      )}
      {receiveModal && (
        <ReceiveStockModal
          products={products}
          onClose={() => setReceiveModal(false)}
          onSave={() => load()}
        />
      )}
    </div>
  )
}
