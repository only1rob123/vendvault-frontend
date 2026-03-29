import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Zap, CheckCircle, PackagePlus, ShoppingCart, AlertTriangle,
  AlertCircle, RefreshCw, ChevronRight, Package, Truck, Calendar
} from 'lucide-react'
import api from '../lib/api'

function SectionHeader({ icon: Icon, title, count, color }) {
  const colors = {
    red:    { bg: 'bg-red-50',    border: 'border-red-200',   badge: 'bg-red-100 text-red-700',   icon: 'text-red-500' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700',  icon: 'text-blue-500' },
    green:  { bg: 'bg-green-50',  border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: 'text-green-500' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${c.bg} border-b ${c.border}`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={c.icon} />
        <h2 className="font-semibold text-sm text-gray-900">{title}</h2>
      </div>
      {count > 0 && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
          {count} item{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}

function AllClearRow({ message }) {
  return (
    <div className="px-4 py-4 flex items-center gap-2 text-green-700">
      <CheckCircle size={15} className="shrink-0" />
      <span className="text-sm">{message}</span>
    </div>
  )
}

export default function ActionCenter() {
  const navigate = useNavigate()
  const [slots, setSlots] = useState([])
  const [warehouse, setWarehouse] = useState([])
  const [orders, setOrders] = useState([])
  const [activeRun, setActiveRun] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const [s, w, o, run, exp] = await Promise.all([
        api.get('/reports/slots/performance?days=30'),
        api.get('/inventory/warehouse'),
        api.get('/purchases?status=ordered'),
        api.get('/delivery-runs/active').catch(() => ({ data: { run: null } })),
        api.get('/inventory/expiring?days=30').catch(() => ({ data: [] })),
      ])
      setSlots(s.data)
      setWarehouse(w.data)
      setOrders(o.data)
      setActiveRun(run.data.run)
      setExpiring(exp.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // --- Derived data ---

  // Slots that need restocking (empty or low ≤25%)
  const alertSlots = slots.filter(s => {
    if (!s.product_name) return false
    if (s.capacity === 0) return false
    return s.current_quantity === 0 || (s.current_quantity / s.capacity) <= 0.25
  })

  // Group by machine
  const slotsByMachine = alertSlots.reduce((acc, s) => {
    if (!acc[s.machine_id]) acc[s.machine_id] = { machine_name: s.machine_name, machine_id: s.machine_id, slots: [] }
    acc[s.machine_id].slots.push(s)
    return acc
  }, {})
  const machineGroups = Object.values(slotsByMachine)

  // Warehouse items below reorder threshold
  const reorderItems = warehouse.filter(w => w.quantity <= w.reorder_threshold)

  // Everything clear?
  const allClear = machineGroups.length === 0 && reorderItems.length === 0 && orders.length === 0 && !activeRun && expiring.length === 0

  const totalActions = alertSlots.length + reorderItems.length + orders.length + expiring.length + (activeRun ? 1 : 0)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-400">
        <RefreshCw size={20} className="animate-spin mr-2" /> Loading...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap size={22} className="text-brand-600" /> Action Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your daily operations checklist</p>
        </div>
        <button
          className="btn-secondary flex items-center gap-1.5 text-sm"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={`card p-4 ${alertSlots.length > 0 ? 'border-l-4 border-l-red-400' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={15} className={alertSlots.length > 0 ? 'text-red-500' : 'text-gray-400'} />
            <span className="text-xs text-gray-500 font-medium">Slots to Restock</span>
          </div>
          <div className={`text-3xl font-bold ${alertSlots.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {alertSlots.length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {alertSlots.filter(s => s.current_quantity === 0).length} empty ·{' '}
            {alertSlots.filter(s => s.current_quantity > 0).length} low
          </div>
        </div>

        <div className={`card p-4 ${reorderItems.length > 0 ? 'border-l-4 border-l-amber-400' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <Package size={15} className={reorderItems.length > 0 ? 'text-amber-500' : 'text-gray-400'} />
            <span className="text-xs text-gray-500 font-medium">Items to Reorder</span>
          </div>
          <div className={`text-3xl font-bold ${reorderItems.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {reorderItems.length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">warehouse stock low</div>
        </div>

        <div className={`card p-4 ${orders.length > 0 ? 'border-l-4 border-l-blue-400' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={15} className={orders.length > 0 ? 'text-blue-500' : 'text-gray-400'} />
            <span className="text-xs text-gray-500 font-medium">Orders to Receive</span>
          </div>
          <div className={`text-3xl font-bold ${orders.length > 0 ? 'text-blue-600' : 'text-green-600'}`}>
            {orders.length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {orders.length > 0
              ? `$${orders.reduce((s, o) => s + o.total_cost, 0).toFixed(2)} outstanding`
              : 'no pending orders'}
          </div>
        </div>

        <div className={`card p-4 ${activeRun ? 'border-l-4 border-l-amber-400' : ''} ${expiring.length > 0 ? 'border-l-4 border-l-orange-400' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <Truck size={15} className={activeRun ? 'text-amber-500' : 'text-gray-400'} />
            <span className="text-xs text-gray-500 font-medium">Delivery / Expiry</span>
          </div>
          <div className={`text-3xl font-bold ${activeRun || expiring.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {(activeRun ? 1 : 0) + expiring.length}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {activeRun ? '1 run active' : ''}{activeRun && expiring.length > 0 ? ' · ' : ''}{expiring.length > 0 ? `${expiring.length} expiring` : ''}{!activeRun && expiring.length === 0 ? 'all clear' : ''}
          </div>
        </div>
      </div>

      {/* All clear */}
      {allClear && (
        <div className="card p-10 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">All systems go!</h2>
          <p className="text-gray-500 mt-1 text-sm">No restocking needed, warehouse is stocked, no orders outstanding.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link to="/machines" className="btn-secondary text-sm">View Machines</Link>
            <Link to="/reports" className="btn-secondary text-sm">View Reports</Link>
          </div>
        </div>
      )}

      {/* Section 1: Machine Restocking */}
      {!allClear && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <SectionHeader
              icon={AlertCircle}
              title="Slots Needing Restock"
              count={alertSlots.length}
              color={alertSlots.length > 0 ? 'red' : 'green'}
            />
            {machineGroups.length === 0 ? (
              <AllClearRow message="All machine slots are adequately stocked" />
            ) : (
              machineGroups.map(group => (
                <div key={group.machine_id}>
                  {/* Machine sub-header */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {group.machine_name}
                    </span>
                    <button
                      className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                      onClick={() => navigate(`/load/${group.machine_id}`)}
                    >
                      <PackagePlus size={12} /> Load Machine
                    </button>
                  </div>
                  {/* Slots */}
                  {group.slots.map(slot => {
                    const isEmpty = slot.current_quantity === 0
                    const pct = slot.capacity > 0 ? (slot.current_quantity / slot.capacity) * 100 : 0
                    return (
                      <div key={slot.slot_id}
                        className="px-4 py-3 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <span className="font-mono text-sm font-bold text-gray-600 w-14 shrink-0">
                          {slot.slot_code}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{slot.product_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 max-w-[120px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isEmpty ? 'bg-red-500' : 'bg-amber-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold ${isEmpty ? 'text-red-600' : 'text-amber-600'}`}>
                              {slot.current_quantity}/{slot.capacity}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          isEmpty ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isEmpty ? 'Empty' : 'Low'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Section 2: Warehouse Reorder */}
          <div className="card overflow-hidden">
            <SectionHeader
              icon={Package}
              title="Warehouse Reorder"
              count={reorderItems.length}
              color={reorderItems.length > 0 ? 'amber' : 'green'}
            />
            {reorderItems.length === 0 ? (
              <AllClearRow message="All warehouse stock levels are above reorder thresholds" />
            ) : (
              <>
                {reorderItems.map(item => {
                  const isCritical = item.quantity === 0
                  const suggestedQty = Math.max(item.reorder_threshold * 2, 24)
                  return (
                    <div key={item.product_id}
                      className="px-4 py-3 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 capitalize">{item.category}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.quantity} in stock
                        </div>
                        <div className="text-xs text-gray-400">threshold: {item.reorder_threshold}</div>
                      </div>
                      <div className="text-right shrink-0 text-xs text-gray-400">
                        suggest {suggestedQty} units
                      </div>
                      <Link
                        to={`/purchases?product_id=${item.product_id}`}
                        className="btn-primary text-xs py-1 px-3 flex items-center gap-1 shrink-0"
                      >
                        <ShoppingCart size={12} /> Order Now
                      </Link>
                    </div>
                  )
                })}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <Link to="/purchases" className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:underline">
                    Go to Purchasing page to create orders <ChevronRight size={12} />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Section 3: Outstanding POs */}
          <div className="card overflow-hidden">
            <SectionHeader
              icon={ShoppingCart}
              title="Orders to Receive"
              count={orders.length}
              color={orders.length > 0 ? 'blue' : 'green'}
            />
            {orders.length === 0 ? (
              <AllClearRow message="No outstanding purchase orders" />
            ) : (
              <>
                {orders.map(order => {
                  const orderedAt = new Date(order.ordered_at)
                  const daysAgo = Math.floor((Date.now() - orderedAt) / 86400000)
                  return (
                    <div key={order.id}
                      className="px-4 py-3 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{order.product_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {order.quantity} units · ${Number(order.unit_cost).toFixed(2)}/ea · ${Number(order.total_cost).toFixed(2)} total
                          {order.supplier && ` · ${order.supplier}`}
                        </div>
                      </div>
                      <div className={`text-xs font-medium shrink-0 ${daysAgo >= 7 ? 'text-red-600' : daysAgo >= 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
                      </div>
                      <Link
                        to="/purchases"
                        className="btn-secondary text-xs py-1 px-3 flex items-center gap-1 shrink-0"
                      >
                        Receive <ChevronRight size={12} />
                      </Link>
                    </div>
                  )
                })}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <Link to="/purchases" className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:underline">
                    Manage all orders in Purchasing <ChevronRight size={12} />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Section 4: Active Delivery Run */}
          {activeRun && (
            <div className="card overflow-hidden">
              <SectionHeader icon={Truck} title="Delivery Run In Progress" count={1} color="amber" />
              <div className="px-4 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Run started {new Date(activeRun.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {(activeRun.items || []).reduce((s, i) => s + (i.quantity_remaining || 0), 0)} units still out across {(activeRun.items || []).length} products
                  </div>
                </div>
                <Link to="/delivery-runs" className="btn-primary text-xs py-1 px-3 flex items-center gap-1 shrink-0">
                  <Truck size={12} /> View Run <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Section 5: Expiring Soon */}
          {expiring.length > 0 && (
            <div className="card overflow-hidden">
              <SectionHeader icon={Calendar} title="Expiring Within 30 Days" count={expiring.length} color="amber" />
              {expiring.map(item => (
                <div key={item.product_id} className="px-4 py-3 flex items-center gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.quantity} in warehouse · expires {item.expiration_date}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    item.days_until_expiry <= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.days_until_expiry <= 0 ? 'Expired' : `${item.days_until_expiry}d left`}
                  </span>
                  <Link to="/inventory" className="btn-secondary text-xs py-1 px-2 shrink-0">
                    View <ChevronRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
