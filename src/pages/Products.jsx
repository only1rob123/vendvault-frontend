import { useEffect, useState } from 'react'
import { Plus, Search, Package, X, Download } from 'lucide-react'
import api from '../lib/api'
import { exportCsv } from '../lib/exportCsv'

const CATEGORIES = ['snack', 'drink', 'candy', 'healthy', 'other']
const CAT_COLORS = {
  drink: 'bg-blue-100 text-blue-700', snack: 'bg-orange-100 text-orange-700',
  candy: 'bg-pink-100 text-pink-700', healthy: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-600'
}

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: 'snack',
    purchase_price: '', sell_price: '', unit_size: '', ...product
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name) return alert('Name required')
    setSaving(true)
    try {
      if (product?.id) await api.put(`/products/${product.id}`, form)
      else await api.post('/products', form)
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setSaving(false) }
  }

  const margin = form.sell_price && form.purchase_price
    ? (((form.sell_price - form.purchase_price) / form.sell_price) * 100).toFixed(1)
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{product?.id ? 'Edit Product' : 'New Product'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="label">Product Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">SKU</label>
              <input className="input" value={form.sku || ''} onChange={e => set('sku', e.target.value)} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Purchase Price $</label>
              <input type="number" step="0.01" className="input" value={form.purchase_price}
                onChange={e => set('purchase_price', e.target.value)} />
            </div>
            <div>
              <label className="label">Sell Price $</label>
              <input type="number" step="0.01" className="input" value={form.sell_price}
                onChange={e => set('sell_price', e.target.value)} />
            </div>
          </div>
          {margin && (
            <p className="text-xs text-green-600 font-medium">Margin: {margin}%</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unit Size</label>
              <input className="input" value={form.unit_size || ''} onChange={e => set('unit_size', e.target.value)} placeholder="e.g. 1.5oz" />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input className="input" value={form.barcode || ''} onChange={e => set('barcode', e.target.value)} />
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

export default function Products() {
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/products').then(r => { setProducts(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || p.category === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Product catalogue — assign to machine slots</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={() => exportCsv(products, 'products.csv', ['name', 'sku', 'category', 'purchase_price', 'sell_price', 'size', 'status'])}><Download size={13} /> Export</button>
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === c ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Buy</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Sell</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Margin</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Warehouse</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Active Slots</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => {
                const margin = p.sell_price > 0 ? ((p.sell_price - p.purchase_price) / p.sell_price * 100).toFixed(1) : '—'
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-400">{p.sku || ''} {p.unit_size ? `· ${p.unit_size}` : ''}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${CAT_COLORS[p.category] || CAT_COLORS.other}`}>{p.category}</span></td>
                    <td className="px-4 py-3 text-right">${p.purchase_price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${p.sell_price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{margin}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.warehouse_qty <= 12 ? 'text-amber-600 font-medium' : 'text-gray-700'}>{p.warehouse_qty}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.active_slots}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-secondary py-1 px-2 text-xs" onClick={() => setModal(p)}>Edit</button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ProductModal product={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
