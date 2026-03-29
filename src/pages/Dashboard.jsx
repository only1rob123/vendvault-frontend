import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, ShoppingCart, Monitor, AlertTriangle, TrendingUp, Package } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import StatCard from '../components/StatCard'
import api from '../lib/api'

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [daily, setDaily] = useState([])
  const [byMachine, setByMachine] = useState([])
  const [velocity, setVelocity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/kpis'),
      api.get('/reports/revenue/daily?days=30'),
      api.get('/reports/revenue/by-machine?days=30'),
      api.get('/reports/products/velocity?days=30'),
    ]).then(([k, d, m, v]) => {
      setKpis(k.data)
      setDaily(d.data)
      setByMachine(m.data)
      setVelocity(v.data.slice(0, 8))
    }).finally(() => setLoading(false))
  }, [])

  const monthTrend = kpis?.last_month_revenue > 0
    ? ((kpis.month_revenue - kpis.last_month_revenue) / kpis.last_month_revenue) * 100
    : null

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all vending operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Today's Revenue" value={`$${kpis?.today_revenue?.toFixed(2) || '0.00'}`}
          sub={`${kpis?.today_transactions || 0} sales`} icon={DollarSign} color="brand" />
        <StatCard title="Month Revenue" value={`$${kpis?.month_revenue?.toFixed(2) || '0.00'}`}
          sub={`${kpis?.month_transactions || 0} sales`} icon={TrendingUp} color="green"
          trend={monthTrend} />
        <StatCard title="Active Machines" value={kpis?.active_machines || 0}
          icon={Monitor} color="purple" />
        <StatCard title="Products" value={kpis?.active_products || 0}
          icon={Package} color="brand" />
        <StatCard title="Low Stock Slots" value={kpis?.low_stock_slots || 0}
          icon={AlertTriangle} color="amber" />
        <StatCard title="Empty Slots" value={kpis?.empty_slots || 0}
          icon={ShoppingCart} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue trend */}
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Daily Revenue — Last 30 Days</h2>
          {daily.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No sales data yet. <Link to="/import" className="text-brand-600 ml-1 underline">Import CSV data</Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`$${v}`, 'Revenue']} labelFormatter={l => `Date: ${l}`} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by machine */}
        <div className="card p-4">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Revenue by Machine</h2>
          {byMachine.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byMachine} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <XAxis dataKey="machine_name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-900">Top Products — Last 30 Days</h2>
          <Link to="/reports" className="text-xs text-brand-600 hover:underline">View all →</Link>
        </div>
        {velocity.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No sales data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Product</th>
                  <th className="text-right pb-2 font-medium">Units Sold</th>
                  <th className="text-right pb-2 font-medium">Revenue</th>
                  <th className="text-right pb-2 font-medium">Gross Profit</th>
                  <th className="text-right pb-2 font-medium">Daily Velocity</th>
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
                    <td className="text-right py-2 text-brand-600">{p.daily_velocity}/day</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
