import { useEffect, useState } from 'react'
import { Plus, X, TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react'
import api from '../lib/api'
import { exportCsv } from '../lib/exportCsv'

function CostModal({ cost, machines, locations, onClose, onSave }) {
  const [form, setForm] = useState({
    cost_type: 'rent', description: '', amount: '', frequency: 'monthly',
    machine_id: '', location_id: '', effective_from: new Date().toISOString().slice(0, 10), ...cost
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.description || !form.amount || !form.effective_from) return alert('Description, amount, and effective from required')
    setSaving(true)
    try {
      const payload = { ...form, machine_id: form.machine_id || undefined, location_id: form.location_id || undefined }
      if (cost?.id) await api.put(`/finance/fixed-costs/${cost.id}`, payload)
      else await api.post('/finance/fixed-costs', payload)
      onSave()
    } catch (e) { alert(e.response?.data?.error || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{cost?.id ? 'Edit Cost' : 'Add Fixed Cost'}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.cost_type} onChange={e => set('cost_type', e.target.value)}>
                {['rent','commission_flat','maintenance','electricity','service_fee','insurance','other'].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="one_time">One Time</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description *</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Amount $ *</label>
            <input type="number" step="0.01" className="input" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="label">Machine (optional)</label>
            <select className="input" value={form.machine_id || ''} onChange={e => set('machine_id', e.target.value)}>
              <option value="">All machines at location</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location (optional)</label>
            <select className="input" value={form.location_id || ''} onChange={e => set('location_id', e.target.value)}>
              <option value="">Not location-specific</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Effective From *</label>
              <input type="date" className="input" value={form.effective_from} onChange={e => set('effective_from', e.target.value)} />
            </div>
            <div>
              <label className="label">Effective To</label>
              <input type="date" className="input" value={form.effective_to || ''} onChange={e => set('effective_to', e.target.value)} />
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

export default function Finance() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [pl, setPl] = useState([])
  const [costs, setCosts] = useState([])
  const [machines, setMachines] = useState([])
  const [locations, setLocations] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get(`/finance/pl?year=${year}&month=${month}`),
      api.get('/finance/fixed-costs'),
      api.get('/machines'),
      api.get('/locations'),
    ]).then(([p, c, m, l]) => {
      setPl(p.data); setCosts(c.data); setMachines(m.data); setLocations(l.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [year, month])

  const totalRevenue = pl.reduce((s, r) => s + r.gross_revenue, 0)
  const totalProfit = pl.reduce((s, r) => s + r.net_profit, 0)
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' })
  }))

  const deleteCost = async id => {
    if (!confirm('Delete this cost?')) return
    await api.delete(`/finance/fixed-costs/${id}`)
    load()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">P&amp;L by machine, fixed costs, and margins</p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="input py-1.5 text-sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="input py-1.5 text-sm" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> Add Cost
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalProfit.toFixed(2)}
                {totalProfit >= 0 ? <TrendingUp size={18} className="inline ml-1" /> : <TrendingDown size={18} className="inline ml-1" />}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-500 font-medium">Net Margin</p>
              <p className={`text-2xl font-bold mt-1 ${totalMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* P&L table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-900">P&amp;L by Machine — {months[month-1]?.label} {year}</h2>
              <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={() => exportCsv(pl, `pl-${months[month-1]?.label}-${year}.csv`, ['machine_name', 'location_name', 'period', 'gross_revenue', 'commission_amount', 'net_revenue', 'cogs', 'gross_profit', 'fixed_costs', 'net_profit', 'margin_pct', 'units_sold'])}><Download size={13} /> Export</button>
            </div>
            {pl.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">No data for this period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Machine</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Revenue</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Commission</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Net Revenue</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">COGS</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Gross Profit</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Fixed Costs</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Net Profit</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pl.map(row => (
                      <tr key={row.machine_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{row.machine_name}</div>
                          <div className="text-xs text-gray-400">{row.location_name}</div>
                        </td>
                        <td className="px-4 py-3 text-right">${row.gross_revenue?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">-${row.commission_amount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${row.net_revenue?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">-${row.cogs?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">${row.gross_profit?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">-${row.fixed_costs?.toFixed(2)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${row.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${row.net_profit?.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${row.margin_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.margin_pct?.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Fixed costs */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-900">Fixed Costs</h2>
              <button className="btn-secondary text-xs py-1 px-2" onClick={() => setModal({})}>
                <Plus size={12} /> Add
              </button>
            </div>
            {costs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No fixed costs configured</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Description</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Applies To</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Amount</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Frequency</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">From</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {costs.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.description}</td>
                      <td className="px-4 py-3 text-gray-500">{c.cost_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-gray-500">{c.machine_name || c.location_name || 'All'}</td>
                      <td className="px-4 py-3 text-right font-medium">${Number(c.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500">{c.frequency}</td>
                      <td className="px-4 py-3 text-gray-500">{c.effective_from}</td>
                      <td className="px-4 py-3 text-right flex gap-1 justify-end">
                        <button className="btn-secondary text-xs py-1 px-2" onClick={() => setModal(c)}>Edit</button>
                        <button className="btn-danger text-xs py-1 px-2" onClick={() => deleteCost(c.id)}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {modal !== null && (
        <CostModal cost={modal} machines={machines} locations={locations}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
