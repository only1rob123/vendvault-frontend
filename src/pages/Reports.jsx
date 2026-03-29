import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../lib/api'
import { Download } from 'lucide-react'
import { exportCsv } from '../lib/exportCsv'

const DAYS_OPTIONS = [7, 14, 30, 60, 90]
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

export default function Reports() {
  const [days, setDays] = useState(30)
  const [machines, setMachines] = useState([])
  const [machineFilter, setMachineFilter] = useState('')
  const [daily, setDaily] = useState([])
  const [velocity, setVelocity] = useState([])
  const [hourly, setHourly] = useState([])
  const [dow, setDow] = useState([])
  const [payment, setPayment] = useState([])
  const [monthly, setMonthly] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/machines').then(r => setMachines(r.data)) }, [])

  useEffect(() => {
    const mq = machineFilter ? `&machine_id=${machineFilter}` : ''
    setLoading(true)
    Promise.all([
      api.get(`/reports/revenue/daily?days=${days}${mq}`),
      api.get(`/reports/products/velocity?days=${days}${mq}`),
      api.get(`/reports/sales/by-hour?days=${days}${mq}`),
      api.get(`/reports/sales/by-dow?days=${days}${mq}`),
      api.get(`/reports/sales/by-payment?days=${days}${mq}`),
      api.get(`/reports/revenue/monthly`),
      api.get(`/reports/slots/performance?days=${days}${mq}`),
    ]).then(([d, v, h, dw, p, m, s]) => {
      setDaily(d.data); setVelocity(v.data); setHourly(h.data)
      setDow(dw.data.map(r => ({ ...r, day: DOW_LABELS[r.dow] })))
      setPayment(p.data); setMonthly(m.data); setSlots(s.data)
    }).finally(() => setLoading(false))
  }, [days, machineFilter])

  const HOURS_FULL = Array.from({ length: 24 }, (_, i) => {
    const existing = hourly.find(h => h.hour === i)
    return { hour: i < 12 ? (i === 0 ? '12am' : `${i}am`) : i === 12 ? '12pm' : `${i-12}pm`, transactions: existing?.transactions || 0 }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Sales analytics and insights</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input py-1.5 text-sm" value={machineFilter} onChange={e => setMachineFilter(e.target.value)}>
            <option value="">All machines</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="flex gap-1">
            {DAYS_OPTIONS.map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${days === d ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="space-y-4">
          {/* Revenue trend */}
          <div className="card p-4">
            <h2 className="font-semibold text-sm text-gray-900 mb-3">Daily Revenue — Last {days} Days</h2>
            {daily.length === 0 ? <p className="text-gray-400 text-sm py-8 text-center">No data for this period</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hour of day */}
            <div className="card p-4">
              <h2 className="font-semibold text-sm text-gray-900 mb-3">Sales by Hour of Day</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={HOURS_FULL} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={1} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="transactions" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Day of week */}
            <div className="card p-4">
              <h2 className="font-semibold text-sm text-gray-900 mb-3">Sales by Day of Week</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dow} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => [v, n === 'revenue' ? 'Revenue ($)' : 'Transactions']} />
                  <Bar dataKey="transactions" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Payment methods */}
            <div className="card p-4">
              <h2 className="font-semibold text-sm text-gray-900 mb-3">Payment Methods</h2>
              {payment.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No data</p> : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={payment} dataKey="transactions" nameKey="payment_method" cx="50%" cy="50%" outerRadius={65} label={({ payment_method, percent }) => `${payment_method} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {payment.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => [v, 'Transactions']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Monthly trend */}
            <div className="card p-4 lg:col-span-2">
              <h2 className="font-semibold text-sm text-gray-900 mb-3">Monthly Revenue (Seasonality)</h2>
              {monthly.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No data yet — build up over months</p> : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={monthly} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Product velocity */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Product Velocity — Last {days} Days</h2>
              <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={() => exportCsv(velocity, `product-velocity-${days}d.csv`, ['product_name', 'category', 'units_sold', 'revenue', 'gross_profit', 'daily_velocity'])}><Download size={13} /> Export</button>
            </div>
            {velocity.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No data for this period</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Product</th>
                      <th className="text-right pb-2 font-medium">Units Sold</th>
                      <th className="text-right pb-2 font-medium">Revenue</th>
                      <th className="text-right pb-2 font-medium">Gross Profit</th>
                      <th className="text-right pb-2 font-medium">Daily Velocity</th>
                      <th className="text-right pb-2 font-medium">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {velocity.map(p => (
                      <tr key={p.product_id} className="hover:bg-gray-50">
                        <td className="py-2">
                          <div className="font-medium text-gray-900">{p.product_name}</div>
                          <div className="text-xs text-gray-400">{p.category}</div>
                        </td>
                        <td className="text-right py-2 font-medium">{p.units_sold}</td>
                        <td className="text-right py-2">${p.revenue?.toFixed(2)}</td>
                        <td className="text-right py-2 text-green-600">${p.gross_profit?.toFixed(2)}</td>
                        <td className="text-right py-2 text-brand-600 font-medium">{p.daily_velocity}/day</td>
                        <td className="text-right py-2 text-green-600">
                          {p.sell_price > 0 ? ((p.sell_price - p.purchase_price) / p.sell_price * 100).toFixed(1) : '—'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Slot performance */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm text-gray-900">Slot Performance — Last {days} Days</h2>
              <button className="btn-secondary text-xs py-1 px-2 flex items-center gap-1" onClick={() => exportCsv(slots, `slot-performance-${days}d.csv`, ['slot_code', 'machine_name', 'product_name', 'units_sold', 'revenue', 'daily_velocity', 'current_quantity', 'capacity'])}><Download size={13} /> Export</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Slot</th>
                    <th className="text-left pb-2 font-medium">Machine</th>
                    <th className="text-left pb-2 font-medium">Product</th>
                    <th className="text-right pb-2 font-medium">Units Sold</th>
                    <th className="text-right pb-2 font-medium">Revenue</th>
                    <th className="text-right pb-2 font-medium">Daily Velocity</th>
                    <th className="text-right pb-2 font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {slots.map(s => (
                    <tr key={s.slot_id} className="hover:bg-gray-50">
                      <td className="py-2 font-mono text-sm font-medium text-gray-700">{s.slot_code}</td>
                      <td className="py-2 text-gray-600">{s.machine_name}</td>
                      <td className="py-2">
                        {s.product_name ? <span className="text-gray-900">{s.product_name}</span> : <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-2 text-right font-medium">{s.units_sold}</td>
                      <td className="py-2 text-right">${s.revenue?.toFixed(2) || '0.00'}</td>
                      <td className="py-2 text-right text-brand-600">{s.daily_velocity}/day</td>
                      <td className="py-2 text-right">
                        <span className={s.current_quantity === 0 ? 'text-red-600 font-medium' : s.current_quantity <= s.capacity * 0.25 ? 'text-amber-600' : 'text-green-600'}>
                          {s.current_quantity}/{s.capacity}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {slots.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-gray-400">No slot data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
