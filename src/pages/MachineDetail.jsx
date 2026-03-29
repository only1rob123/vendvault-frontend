import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart2, Pencil, PackagePlus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import MachineGrid from '../components/MachineGrid'
import MachineLayoutEditor from '../components/MachineLayoutEditor'
import MachineQR from '../components/MachineQR'
import api from '../lib/api'

export default function MachineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [machine, setMachine] = useState(null)
  const [products, setProducts] = useState([])
  const [velocity, setVelocity] = useState([])
  const [hourly, setHourly] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const load = () => {
    Promise.all([
      api.get(`/machines/${id}`),
      api.get('/products'),
      api.get(`/reports/products/velocity?machine_id=${id}&days=30`),
      api.get(`/reports/sales/by-hour?machine_id=${id}&days=30`),
    ]).then(([m, p, v, h]) => {
      setMachine(m.data)
      setProducts(p.data.filter(p => p.status === 'active'))
      setVelocity(v.data.slice(0, 10))
      setHourly(h.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [id])

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!machine) return <div className="p-8 text-red-500">Machine not found</div>

  const HOURS = Array.from({ length: 24 }, (_, i) => {
    const existing = hourly.find(h => h.hour === i)
    const label = i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`
    return { hour: label, transactions: existing?.transactions || 0, revenue: existing?.revenue || 0 }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link to="/machines" className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{machine.name}</h1>
          <p className="text-sm text-gray-500">
            {machine.location_name} · {machine.city}, {machine.state}
            {machine.cantaloupe_device_id && <span className="font-mono ml-2 text-gray-400">{machine.cantaloupe_device_id}</span>}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!editMode && (
            <>
              <MachineQR machine={machine} />
              <button
                className="btn-secondary flex items-center gap-1.5 text-sm"
                onClick={() => navigate(`/load/${id}`)}
              >
                <PackagePlus size={15} /> Load Machine
              </button>
              <button
                className="btn-primary flex items-center gap-1.5 text-sm"
                onClick={() => setEditMode(true)}
              >
                <Pencil size={14} /> Edit Layout
              </button>
            </>
          )}
        </div>
      </div>

      {editMode ? (
        /* Edit mode — full width layout editor */
        <MachineLayoutEditor
          machine={machine}
          slots={machine.slots}
          products={products}
          onSave={() => { setEditMode(false); load() }}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        /* View mode */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <MachineGrid machine={machine} slots={machine.slots} products={products} onRefresh={load} />
          </div>

          <div className="space-y-4">
            {/* Machine info */}
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Machine Info</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Type', machine.machine_type],
                  ['Grid', `${machine.layout_rows} × ${machine.layout_cols}`],
                  ['Commission', `${machine.commission_pct}%`],
                  ['Monthly Cost', `$${machine.monthly_fixed_cost?.toFixed(2)}`],
                  ['Status', machine.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* 30-day velocity */}
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <BarChart2 size={15} /> Top Products · 30 days
              </h3>
              {velocity.length === 0 ? (
                <p className="text-xs text-gray-400">No sales data yet</p>
              ) : (
                <div className="space-y-2">
                  {velocity.map(p => (
                    <div key={p.product_id}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-700 font-medium truncate pr-2">{p.product_name}</span>
                        <span className="text-gray-500 shrink-0">{p.units_sold} units</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${Math.min(100, (p.units_sold / (velocity[0]?.units_sold || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hour of day */}
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Sales by Hour</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={HOURS.filter((_, i) => i >= 6 && i <= 22)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={v => [v, 'Sales']} />
                  <Bar dataKey="transactions" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
