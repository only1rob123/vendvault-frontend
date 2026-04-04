import { useEffect, useState } from 'react'
import { Plus, Search, X, Download, Zap, RotateCcw, Archive } from 'lucide-react'
import api from '../lib/api'
import { exportCsv } from '../lib/exportCsv'

const CATEGORIES = ['snack', 'drink', 'candy', 'healthy', 'other']
const CAT_COLORS = {
  drink: 'bg-blue-100 text-blue-700', snack: 'bg-orange-100 text-orange-700',
  candy: 'bg-pink-100 text-pink-700', healthy: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-600'
}

// ── Curated quick-add product library ────────────────────────────────────────
const QUICK_PRODUCTS = {
  snack: [
    { name: "Lay's Classic", sku: 'LAYS-CL',  category: 'snack', unit_size: '1.5oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Doritos Nacho Cheese', sku: 'DOR-NC', category: 'snack', unit_size: '1.75oz', purchase_price: '0.90', sell_price: '1.50' },
    { name: 'Cheetos Crunchy', sku: 'CHT-CR', category: 'snack', unit_size: '2oz', purchase_price: '0.90', sell_price: '1.50' },
    { name: 'Fritos Original', sku: 'FRI-OR', category: 'snack', unit_size: '1.5oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Ruffles Cheddar & Sour Cream', sku: 'RUF-CSC', category: 'snack', unit_size: '1.5oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Sun Chips Harvest Cheddar', sku: 'SUN-HC', category: 'snack', unit_size: '1.5oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Pringles Original', sku: 'PRG-OR', category: 'snack', unit_size: '2.5oz', purchase_price: '1.10', sell_price: '2.00' },
    { name: 'Planters Salted Peanuts', sku: 'PLN-SP', category: 'snack', unit_size: '1.75oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Goldfish Cheddar', sku: 'GDF-CH', category: 'snack', unit_size: '1.5oz', purchase_price: '0.80', sell_price: '1.50' },
    { name: 'Chex Mix Original', sku: 'CHX-OR', category: 'snack', unit_size: '1.75oz', purchase_price: '0.85', sell_price: '1.50' },
  ],
  drink: [
    { name: 'Coca-Cola Classic', sku: 'COC-CL', category: 'drink', unit_size: '20oz', purchase_price: '0.75', sell_price: '1.75' },
    { name: 'Diet Coke', sku: 'COC-DC', category: 'drink', unit_size: '20oz', purchase_price: '0.75', sell_price: '1.75' },
    { name: 'Pepsi', sku: 'PEP-OR', category: 'drink', unit_size: '20oz', purchase_price: '0.75', sell_price: '1.75' },
    { name: 'Mountain Dew', sku: 'PEP-MD', category: 'drink', unit_size: '20oz', purchase_price: '0.75', sell_price: '1.75' },
    { name: 'Sprite', sku: 'COC-SP', category: 'drink', unit_size: '20oz', purchase_price: '0.75', sell_price: '1.75' },
    { name: 'Dr Pepper', sku: 'DRP-OR', category: 'drink', unit_size: '20oz', purchase_price: '0.75', sell_price: '1.75' },
    { name: 'Monster Energy Original', sku: 'MON-OR', category: 'drink', unit_size: '16oz', purchase_price: '1.80', sell_price: '3.50' },
    { name: 'Monster Energy Zero', sku: 'MON-ZR', category: 'drink', unit_size: '16oz', purchase_price: '1.80', sell_price: '3.50' },
    { name: 'Red Bull Energy', sku: 'RDB-OR', category: 'drink', unit_size: '8.4oz', purchase_price: '1.80', sell_price: '3.50' },
    { name: 'Gatorade Lemon-Lime', sku: 'GAT-LL', category: 'drink', unit_size: '20oz', purchase_price: '0.90', sell_price: '2.00' },
    { name: 'Gatorade Fruit Punch', sku: 'GAT-FP', category: 'drink', unit_size: '20oz', purchase_price: '0.90', sell_price: '2.00' },
    { name: 'Gatorade Orange', sku: 'GAT-OR', category: 'drink', unit_size: '20oz', purchase_price: '0.90', sell_price: '2.00' },
    { name: 'Aquafina Water', sku: 'AQF-WR', category: 'drink', unit_size: '16.9oz', purchase_price: '0.50', sell_price: '1.50' },
    { name: 'Dasani Water', sku: 'DAS-WR', category: 'drink', unit_size: '20oz', purchase_price: '0.50', sell_price: '1.50' },
    { name: 'Arizona Green Tea', sku: 'AZT-GT', category: 'drink', unit_size: '20oz', purchase_price: '0.50', sell_price: '1.50' },
    { name: 'Snapple Lemon Tea', sku: 'SNP-LT', category: 'drink', unit_size: '16oz', purchase_price: '1.00', sell_price: '2.25' },
  ],
  candy: [
    { name: 'Snickers', sku: 'SNK-OR', category: 'candy', unit_size: '1.86oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: "M&M's Milk Chocolate", sku: 'MMS-MC', category: 'candy', unit_size: '1.69oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: "M&M's Peanut", sku: 'MMS-PN', category: 'candy', unit_size: '1.74oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: "Reese's Peanut Butter Cups", sku: 'RES-PB', category: 'candy', unit_size: '1.5oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Twix', sku: 'TWX-OR', category: 'candy', unit_size: '1.79oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Kit Kat', sku: 'KIT-OR', category: 'candy', unit_size: '1.5oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Skittles Original', sku: 'SKT-OR', category: 'candy', unit_size: '2.17oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Starburst Original', sku: 'STB-OR', category: 'candy', unit_size: '2.07oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Hershey Bar', sku: 'HRS-ML', category: 'candy', unit_size: '1.55oz', purchase_price: '0.80', sell_price: '1.50' },
    { name: 'Milky Way', sku: 'MLW-OR', category: 'candy', unit_size: '1.84oz', purchase_price: '0.85', sell_price: '1.50' },
  ],
  healthy: [
    { name: 'Kind Bar Almond & Coconut', sku: 'KND-AC', category: 'healthy', unit_size: '1.4oz', purchase_price: '1.20', sell_price: '2.50' },
    { name: 'Clif Bar Chocolate Chip', sku: 'CLF-CC', category: 'healthy', unit_size: '2.4oz', purchase_price: '1.10', sell_price: '2.50' },
    { name: 'Clif Bar Crunchy Peanut Butter', sku: 'CLF-PB', category: 'healthy', unit_size: '2.4oz', purchase_price: '1.10', sell_price: '2.50' },
    { name: 'Nature Valley Oats & Honey', sku: 'NVL-OH', category: 'healthy', unit_size: '1.5oz', purchase_price: '0.70', sell_price: '1.50' },
    { name: "Baked Lay's Original", sku: 'BKL-OR', category: 'healthy', unit_size: '1.125oz', purchase_price: '0.85', sell_price: '1.50' },
    { name: 'Special K Protein Bar', sku: 'SPK-PR', category: 'healthy', unit_size: '1.59oz', purchase_price: '0.90', sell_price: '2.00' },
    { name: 'RXBar Chocolate Sea Salt', sku: 'RXB-CS', category: 'healthy', unit_size: '1.83oz', purchase_price: '1.50', sell_price: '3.00' },
    { name: 'Larabar Apple Pie', sku: 'LRB-AP', category: 'healthy', unit_size: '1.6oz', purchase_price: '1.20', sell_price: '2.75' },
    { name: 'Trail Mix Fruit & Nut', sku: 'TRL-FN', category: 'healthy', unit_size: '2oz', purchase_price: '1.00', sell_price: '2.25' },
    { name: 'PopCorners Sea Salt', sku: 'PPC-SS', category: 'healthy', unit_size: '1oz', purchase_price: '0.80', sell_price: '1.75' },
  ],
}

// ── Quick Add Modal ───────────────────────────────────────────────────────────
function QuickAddModal({ existingNames, onClose, onAdded }) {
  const [tab, setTab] = useState('snack')
  const [selected, setSelected] = useState({})
  const [saving, setSaving] = useState(false)

  const toggle = (sku) => setSelected(s => ({ ...s, [sku]: !s[sku] }))
  const selectedCount = Object.values(selected).filter(Boolean).length

  const handleAdd = async () => {
    const toAdd = Object.entries(QUICK_PRODUCTS)
      .flatMap(([, items]) => items)
      .filter(p => selected[p.sku] && !existingNames.has(p.name.toLowerCase()))
    if (!toAdd.length) return onClose()
    setSaving(true)
    try {
      await Promise.all(toAdd.map(p => api.post('/products', p)))
      onAdded()
    } catch (e) { alert(e.response?.data?.error || 'Error adding products') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Quick Add Common Products</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select products to add to your catalogue</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-5 pt-4 border-b border-gray-100 shrink-0">
          {Object.keys(QUICK_PRODUCTS).map(cat => (
            <button key={cat} onClick={() => setTab(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg border-b-2 -mb-px capitalize transition-colors ${tab === cat ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="space-y-1.5">
            {QUICK_PRODUCTS[tab].map(p => {
              const alreadyExists = existingNames.has(p.name.toLowerCase())
              const isSelected = !!selected[p.sku]
              return (
                <label key={p.sku}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${alreadyExists ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' : isSelected ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="checkbox" checked={isSelected} disabled={alreadyExists}
                    onChange={() => !alreadyExists && toggle(p.sku)}
                    className="w-4 h-4 text-brand-600 rounded border-gray-300" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.unit_size}</div>
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">
                    ${p.purchase_price} / ${p.sell_price}
                  </div>
                  {alreadyExists && <span className="text-xs text-gray-400 shrink-0">already added</span>}
                </label>
              )
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-sm text-gray-500">{selectedCount} product{selectedCount !== 1 ? 's' : ''} selected</p>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd} disabled={saving || selectedCount === 0}>
              {saving ? 'Adding...' : `Add ${selectedCount || ''} Product${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Product Edit Modal ────────────────────────────────────────────────────────
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
          {margin && <p className="text-xs text-green-600 font-medium">Margin: {margin}%</p>}
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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Products() {
  const [products, setProducts] = useState([])
  const [modal, setModal] = useState(null)
  const [quickAdd, setQuickAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [loading, setLoading] = useState(true)

  const load = () => api.get('/products').then(r => { setProducts(r.data); setLoading(false) })
  useEffect(() => { load() }, [])

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || p.category === catFilter
    const matchStatus = statusFilter === 'active' ? (p.status !== 'retired') : (p.status === 'retired')
    return matchSearch && matchCat && matchStatus
  })

  const handleRetire = async (p) => {
    if (!confirm(`Retire "${p.name}"? It will be hidden from slot assignments.`)) return
    try { await api.put(`/products/${p.id}`, { ...p, status: 'retired' }); load() }
    catch (e) { alert(e.response?.data?.error || 'Error') }
  }

  const handleRestore = async (p) => {
    try { await api.put(`/products/${p.id}`, { ...p, status: 'active' }); load() }
    catch (e) { alert(e.response?.data?.error || 'Error') }
  }

  const existingNames = new Set(products.map(p => p.name.toLowerCase()))

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Product catalogue — assign to machine slots</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
            onClick={() => exportCsv(products, 'products.csv', ['name', 'sku', 'category', 'purchase_price', 'sell_price', 'unit_size', 'status'])}>
            <Download size={13} /> Export
          </button>
          <button className="btn-secondary flex items-center gap-1.5" onClick={() => setQuickAdd(true)}>
            <Zap size={15} /> Quick Add
          </button>
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-3 border-b border-gray-200">
        {[['active', 'Active'], ['retired', 'Retired']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${statusFilter === val ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {products.filter(p => val === 'active' ? p.status !== 'retired' : p.status === 'retired').length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${catFilter === c ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
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
                const margin = Number(p.sell_price) > 0 ? ((Number(p.sell_price) - Number(p.purchase_price)) / Number(p.sell_price) * 100).toFixed(1) : '—'
                const retired = p.status === 'retired'
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 ${retired ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {p.name}
                        {retired && <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">retired</span>}
                      </div>
                      <div className="text-xs text-gray-400">{p.sku || ''} {p.unit_size ? `· ${p.unit_size}` : ''}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${CAT_COLORS[p.category] || CAT_COLORS.other}`}>{p.category}</span></td>
                    <td className="px-4 py-3 text-right">${Number(p.purchase_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${Number(p.sell_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{margin}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.warehouse_qty <= 12 ? 'text-amber-600 font-medium' : 'text-gray-700'}>{p.warehouse_qty}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.active_slots}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button className="btn-secondary py-1 px-2 text-xs" onClick={() => setModal(p)}>Edit</button>
                        {retired ? (
                          <button className="py-1 px-2 text-xs rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-1"
                            onClick={() => handleRestore(p)} title="Restore product">
                            <RotateCcw size={11} /> Restore
                          </button>
                        ) : (
                          <button className="py-1 px-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center gap-1"
                            onClick={() => handleRetire(p)} title="Retire product">
                            <Archive size={11} /> Retire
                          </button>
                        )}
                      </div>
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
      {quickAdd && (
        <QuickAddModal existingNames={existingNames} onClose={() => setQuickAdd(false)} onAdded={() => { setQuickAdd(false); load() }} />
      )}
    </div>
  )
}
