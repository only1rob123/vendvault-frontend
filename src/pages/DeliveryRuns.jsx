import { useEffect, useState, useCallback } from 'react'
import {
  Truck, PackagePlus, RotateCcw, CheckCircle, XCircle,
  ChevronDown, ChevronUp, AlertTriangle, Clock, Package, X
} from 'lucide-react'
import api from '../lib/api'

// ─── Utility ──────────────────────────────────────────────────────────────────

function formatDuration(startedAt) {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    active: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ─── Complete Run Modal ────────────────────────────────────────────────────────

function CompleteRunModal({ run, items, onConfirm, onClose, saving }) {
  const totalPulled = items.reduce((s, i) => s + i.quantity_pulled, 0)
  const totalLoaded = items.reduce((s, i) => s + (i.quantity_loaded || 0), 0)
  const totalStored = items.reduce((s, i) => s + (i.quantity_stored || 0), 0)
  const totalReturned = items.reduce((s, i) => s + (i.quantity_returned || 0), 0)
  const totalRemaining = items.reduce((s, i) => s + (i.quantity_remaining || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            Complete Run
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">Review your run summary before completing:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-900">{totalPulled}</div>
              <div className="text-xs text-gray-500">Units Pulled</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{totalLoaded}</div>
              <div className="text-xs text-green-600">Loaded to Machines</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{totalStored}</div>
              <div className="text-xs text-blue-600">Stored On-site</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-700">{totalReturned}</div>
              <div className="text-xs text-purple-600">Returned to Warehouse</div>
            </div>
          </div>
          {totalRemaining > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <span className="font-semibold">{totalRemaining} units unaccounted for</span> will be
                written off as losses on completion.
              </div>
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
            onClick={onConfirm}
            disabled={saving}
          >
            {saving ? 'Completing...' : 'Complete Run'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Start New Run View ────────────────────────────────────────────────────────

function StartRunView({ warehouse, onStarted }) {
  const [pullQtys, setPullQtys] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (productId, val) => setPullQtys(prev => ({ ...prev, [productId]: val }))

  const totalProducts = Object.values(pullQtys).filter(v => Number(v) > 0).length
  const totalUnits = Object.values(pullQtys).reduce((s, v) => s + (Number(v) || 0), 0)
  const totalCost = warehouse.reduce((s, item) => {
    const qty = Number(pullQtys[item.product_id]) || 0
    return s + qty * (item.purchase_price || 0)
  }, 0)

  const handleStart = async () => {
    const items = Object.entries(pullQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity: Number(quantity) }))
    if (!items.length) return alert('Add at least one product to pull')
    setSaving(true)
    try {
      await api.post('/delivery-runs', { items })
      onStarted()
    } catch (e) {
      alert(e.response?.data?.error || 'Error starting run')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Package size={15} className="text-brand-600" />
            Warehouse Pull List
          </h2>
          {totalUnits > 0 && (
            <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-1 rounded-full">
              {totalProducts} products · {totalUnits} units · ~${totalCost.toFixed(2)}
            </span>
          )}
        </div>
        {warehouse.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            No warehouse inventory available. Add stock to the warehouse first.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">In Warehouse</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 w-32">Pull Qty</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Cost Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {warehouse.map(item => {
                const pullQty = Number(pullQtys[item.product_id]) || 0
                const cost = pullQty * (item.purchase_price || 0)
                return (
                  <tr key={item.product_id} className={`hover:bg-gray-50 ${pullQty > 0 ? 'bg-brand-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={pullQtys[item.product_id] ?? ''}
                        onChange={e => set(item.product_id, e.target.value)}
                        placeholder="0"
                        className="input w-24 text-right py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {pullQty > 0 ? `$${cost.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalUnits > 0 && (
        <div className="card p-4 flex items-center justify-between bg-brand-50 border-brand-200">
          <div>
            <div className="font-semibold text-brand-900">{totalProducts} products · {totalUnits} units</div>
            <div className="text-sm text-brand-700">Estimated cost: ~${totalCost.toFixed(2)}</div>
          </div>
          <button className="btn-primary" onClick={handleStart} disabled={saving}>
            <Truck size={16} />
            {saving ? 'Starting...' : 'Start Run'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Active Run Dashboard ──────────────────────────────────────────────────────

function ActiveRunDashboard({ activeRun, machines, locations, onRefresh, onComplete, onCancel }) {
  const run = activeRun.run
  const items = run?.items || []

  // Load machine state
  const [selectedMachineId, setSelectedMachineId] = useState('')
  const [machineDetail, setMachineDetail] = useState(null)
  const [machineLoading, setMachineLoading] = useState(false)
  const [loadQtys, setLoadQtys] = useState({})
  const [loadSaving, setLoadSaving] = useState(false)

  // Store on-site state
  const [storeOpen, setStoreOpen] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [storeQtys, setStoreQtys] = useState({})
  const [storeSaving, setStoreSaving] = useState(false)

  // Return state
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnQtys, setReturnQtys] = useState({})
  const [returnSaving, setReturnSaving] = useState(false)

  // Complete modal
  const [showComplete, setShowComplete] = useState(false)
  const [completeSaving, setCompleteSaving] = useState(false)

  const totalPulled = items.reduce((s, i) => s + i.quantity_pulled, 0)
  const totalRemaining = items.reduce((s, i) => s + (i.quantity_remaining || 0), 0)
  const productsOut = items.filter(i => (i.quantity_remaining || 0) > 0).length

  // Load machine slots when machine selected
  useEffect(() => {
    if (!selectedMachineId) { setMachineDetail(null); return }
    setMachineLoading(true)
    setLoadQtys({})
    api.get(`/machines/${selectedMachineId}`)
      .then(r => setMachineDetail(r.data))
      .finally(() => setMachineLoading(false))
  }, [selectedMachineId])

  const assignedSlots = (machineDetail?.slots || []).filter(s => s.product_name)

  // For a slot, cap load qty by both available slot space and delivery item remaining qty
  const getSlotMax = (slot) => {
    const space = slot.capacity - slot.current_quantity
    const deliveryItem = items.find(i => i.product_id === slot.product_id)
    const itemRemaining = deliveryItem ? (deliveryItem.quantity_remaining || 0) : 0
    return Math.min(space, itemRemaining)
  }

  const setLoadQty = (slotId, val) => setLoadQtys(prev => ({ ...prev, [slotId]: val }))

  const handleLoadMachine = async () => {
    const slotLoads = Object.entries(loadQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([slot_id, quantity]) => {
        const slot = assignedSlots.find(s => s.id === slot_id)
        return { slot_id, product_id: slot?.product_id, quantity: Number(quantity) }
      })
    if (!slotLoads.length) return alert('Enter at least one quantity to load')
    setLoadSaving(true)
    try {
      await api.post(`/delivery-runs/${run.id}/load-machine`, {
        machine_id: selectedMachineId,
        items: slotLoads
      })
      setLoadQtys({})
      setSelectedMachineId('')
      setMachineDetail(null)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Error loading machine')
    } finally {
      setLoadSaving(false)
    }
  }

  const handleStoreOnsite = async () => {
    if (!selectedLocationId) return alert('Select a location')
    const storeItems = Object.entries(storeQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity: Number(quantity) }))
    if (!storeItems.length) return alert('Enter at least one quantity to store')
    setStoreSaving(true)
    try {
      await api.post(`/delivery-runs/${run.id}/store-onsite`, {
        location_id: selectedLocationId,
        items: storeItems
      })
      setStoreQtys({})
      setSelectedLocationId('')
      setStoreOpen(false)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Error storing inventory')
    } finally {
      setStoreSaving(false)
    }
  }

  const handleReturn = async () => {
    const returnItems = Object.entries(returnQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity: Number(quantity) }))
    if (!returnItems.length) return alert('Enter at least one quantity to return')
    setReturnSaving(true)
    try {
      await api.post(`/delivery-runs/${run.id}/return`, { items: returnItems })
      setReturnQtys({})
      setReturnOpen(false)
      onRefresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Error returning inventory')
    } finally {
      setReturnSaving(false)
    }
  }

  const handleComplete = async () => {
    setCompleteSaving(true)
    try {
      await api.post(`/delivery-runs/${run.id}/complete`)
      setShowComplete(false)
      onComplete()
    } catch (e) {
      alert(e.response?.data?.error || 'Error completing run')
    } finally {
      setCompleteSaving(false)
    }
  }

  const handleCancel = () => {
    if (!window.confirm('Cancel this run? This will return all remaining items to the warehouse.')) return
    onCancel()
  }

  const itemsWithRemaining = items.filter(i => (i.quantity_remaining || 0) > 0)

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="card p-4 bg-amber-50 border-amber-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Truck size={18} className="text-amber-700" />
            </div>
            <div>
              <div className="font-semibold text-amber-900 flex items-center gap-2">
                Run in progress
                <span className="text-xs font-normal text-amber-700 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDuration(run.started_at)}
                </span>
              </div>
              <div className="text-sm text-amber-700">
                {totalRemaining} units out on delivery across {productsOut} products
                &nbsp;·&nbsp; {totalPulled} total pulled
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 text-sm"
              onClick={() => setShowComplete(true)}
            >
              <CheckCircle size={15} />
              Complete Run
            </button>
            <button
              className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 text-sm"
              onClick={handleCancel}
            >
              <XCircle size={15} />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-sm text-gray-900">Run Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Pulled</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Loaded</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Stored</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Returned</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => {
              const remaining = item.quantity_remaining || 0
              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${remaining > 0 ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.product_name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity_pulled}</td>
                  <td className="px-4 py-3 text-right text-green-700">{item.quantity_loaded || 0}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{item.quantity_stored || 0}</td>
                  <td className="px-4 py-3 text-right text-purple-700">{item.quantity_returned || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${remaining > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                      {remaining > 0 && <AlertTriangle size={12} className="inline mr-1" />}
                      {remaining}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 1. Load a Machine */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <PackagePlus size={15} className="text-brand-600" />
          <h2 className="font-semibold text-sm text-gray-900">Load a Machine</h2>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="label">Select Machine</label>
            <select
              className="input"
              value={selectedMachineId}
              onChange={e => setSelectedMachineId(e.target.value)}
            >
              <option value="">— Select machine —</option>
              {machines.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.location_name}</option>
              ))}
            </select>
          </div>

          {machineLoading && (
            <p className="text-sm text-gray-400 py-2">Loading slots...</p>
          )}

          {machineDetail && !machineLoading && assignedSlots.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No product-assigned slots on this machine.</p>
          )}

          {machineDetail && !machineLoading && assignedSlots.length > 0 && (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Slot</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Product</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">In Machine</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Space</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">On Truck</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-28">Load Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assignedSlots.map(slot => {
                    const maxQty = getSlotMax(slot)
                    const deliveryItem = items.find(i => i.product_id === slot.product_id)
                    const onTruck = deliveryItem ? (deliveryItem.quantity_remaining || 0) : 0
                    const isDisabled = maxQty === 0
                    return (
                      <tr key={slot.id} className={`hover:bg-gray-50 ${isDisabled ? 'opacity-50' : ''}`}>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                            {slot.slot_code}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-gray-900">{slot.product_name}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600">
                          {slot.current_quantity}/{slot.capacity}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">
                          {slot.capacity - slot.current_quantity}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-medium ${onTruck > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          {onTruck}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            min={0}
                            max={maxQty}
                            disabled={isDisabled}
                            value={loadQtys[slot.id] ?? ''}
                            onChange={e => setLoadQty(slot.id, e.target.value)}
                            placeholder="0"
                            className="input w-24 text-right py-1.5 text-sm disabled:opacity-40"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="flex justify-end">
                <button
                  className="btn-primary"
                  onClick={handleLoadMachine}
                  disabled={loadSaving}
                >
                  <PackagePlus size={15} />
                  {loadSaving ? 'Loading...' : 'Load Machine'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Store at Location */}
      <div className="card overflow-hidden">
        <button
          className="w-full px-4 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
          onClick={() => setStoreOpen(o => !o)}
        >
          <div className="flex items-center gap-2">
            <Package size={15} className="text-blue-600" />
            <h2 className="font-semibold text-sm text-gray-900">Store at Location</h2>
          </div>
          {storeOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {storeOpen && (
          <div className="p-4 space-y-3">
            <div>
              <label className="label">Select Location</label>
              <select
                className="input"
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(e.target.value)}
              >
                <option value="">— Select location —</option>
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {itemsWithRemaining.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No items with remaining quantity.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Product</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Remaining</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-28">Store Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {itemsWithRemaining.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{item.product_name}</td>
                        <td className="px-3 py-2.5 text-right text-amber-700 font-medium">{item.quantity_remaining}</td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity_remaining}
                            value={storeQtys[item.product_id] ?? ''}
                            onChange={e => setStoreQtys(prev => ({ ...prev, [item.product_id]: e.target.value }))}
                            placeholder="0"
                            className="input w-24 text-right py-1.5 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <button
                    className="btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    onClick={handleStoreOnsite}
                    disabled={storeSaving}
                  >
                    {storeSaving ? 'Storing...' : 'Store at Location'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Return to Warehouse */}
      <div className="card overflow-hidden">
        <button
          className="w-full px-4 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
          onClick={() => setReturnOpen(o => !o)}
        >
          <div className="flex items-center gap-2">
            <RotateCcw size={15} className="text-purple-600" />
            <h2 className="font-semibold text-sm text-gray-900">Return to Warehouse</h2>
          </div>
          {returnOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {returnOpen && (
          <div className="p-4 space-y-3">
            {itemsWithRemaining.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No items with remaining quantity.</p>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Product</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Remaining</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 w-28">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {itemsWithRemaining.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{item.product_name}</td>
                        <td className="px-3 py-2.5 text-right text-amber-700 font-medium">{item.quantity_remaining}</td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            min={0}
                            max={item.quantity_remaining}
                            value={returnQtys[item.product_id] ?? ''}
                            onChange={e => setReturnQtys(prev => ({ ...prev, [item.product_id]: e.target.value }))}
                            placeholder="0"
                            className="input w-24 text-right py-1.5 text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <button
                    className="btn bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
                    onClick={handleReturn}
                    disabled={returnSaving}
                  >
                    <RotateCcw size={15} />
                    {returnSaving ? 'Returning...' : 'Return to Warehouse'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showComplete && (
        <CompleteRunModal
          run={run}
          items={items}
          onConfirm={handleComplete}
          onClose={() => setShowComplete(false)}
          saving={completeSaving}
        />
      )}
    </div>
  )
}

// ─── History View ──────────────────────────────────────────────────────────────

function HistoryView({ history }) {
  const [expanded, setExpanded] = useState(null)

  if (history.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-400">
        <Truck size={40} className="mx-auto mb-3 opacity-20" />
        <p className="font-medium text-gray-500">No delivery runs yet</p>
        <p className="text-sm mt-1">Start your first run to see history here.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-sm text-gray-900">Run History</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Date Started</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Items</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Units Pulled</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Units Loaded</th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Duration</th>
            <th className="px-4 py-2.5 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {history.map(run => {
            const isExpanded = expanded === run.id
            const duration = run.completed_at
              ? (() => {
                  const diff = Math.floor((new Date(run.completed_at) - new Date(run.started_at)) / 1000)
                  const h = Math.floor(diff / 3600)
                  const m = Math.floor((diff % 3600) / 60)
                  return h > 0 ? `${h}h ${m}m` : `${m}m`
                })()
              : run.status === 'active'
              ? formatDuration(run.started_at)
              : '—'

            return (
              <>
                <tr
                  key={run.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : run.id)}
                >
                  <td className="px-4 py-3 text-gray-900">
                    {new Date(run.started_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-4 py-3 text-right text-gray-700">{run.item_count ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{run.units_pulled ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{run.units_loaded ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{duration}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${run.id}-detail`}>
                    <td colSpan={7} className="px-4 pb-4 bg-gray-50">
                      <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                          <div className="text-lg font-bold text-gray-900">{run.units_pulled ?? 0}</div>
                          <div className="text-xs text-gray-500">Units Pulled</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                          <div className="text-lg font-bold text-green-700">{run.units_loaded ?? 0}</div>
                          <div className="text-xs text-gray-500">Loaded</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                          <div className="text-lg font-bold text-blue-700">{run.units_stored ?? 0}</div>
                          <div className="text-xs text-gray-500">Stored</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                          <div className="text-lg font-bold text-purple-700">{run.units_returned ?? 0}</div>
                          <div className="text-xs text-gray-500">Returned</div>
                        </div>
                      </div>
                      {run.completed_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Completed: {new Date(run.completed_at).toLocaleString()}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DeliveryRuns() {
  const [activeRun, setActiveRun] = useState(null)
  const [history, setHistory] = useState([])
  const [view, setView] = useState('default') // 'default' | 'new' | 'history'
  const [loading, setLoading] = useState(true)
  const [machines, setMachines] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouse, setWarehouse] = useState([])
  const [cancelSaving, setCancelSaving] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [activeRes, historyRes, machinesRes, locationsRes, warehouseRes] = await Promise.all([
        api.get('/delivery-runs/active').catch(() => ({ data: null })),
        api.get('/delivery-runs'),
        api.get('/machines'),
        api.get('/locations'),
        api.get('/inventory/warehouse'),
      ])
      const active = activeRes.data
      setActiveRun(active && active.run ? active : null)
      setHistory(historyRes.data)
      setMachines(machinesRes.data)
      setLocations(locationsRes.data)
      setWarehouse(warehouseRes.data)
    } catch (e) {
      console.error('Failed to load delivery runs data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Set view based on active run presence after initial load
  useEffect(() => {
    if (!loading) {
      if (activeRun) setView('dashboard')
      else if (view === 'dashboard') setView('default')
    }
  }, [loading, activeRun]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRunStarted = async () => {
    await refreshActiveRun()
    setView('dashboard')
  }

  const handleComplete = () => {
    setActiveRun(null)
    setView('history')
    loadAll()
  }

  const handleCancel = async () => {
    if (!activeRun) return
    setCancelSaving(true)
    try {
      await api.post(`/delivery-runs/${activeRun.run.id}/cancel`)
      setActiveRun(null)
      setView('default')
      loadAll()
    } catch (e) {
      alert(e.response?.data?.error || 'Error cancelling run')
    } finally {
      setCancelSaving(false)
    }
  }

  const refreshActiveRun = async () => {
    try {
      const r = await api.get('/delivery-runs/active')
      setActiveRun(r.data && r.data.run ? r.data : null)
    } catch {
      setActiveRun(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  const currentView = activeRun ? 'dashboard' : view

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck size={22} className="text-brand-600" />
            Delivery Runs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage restocking trips from warehouse to machines</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={view === 'history' && !activeRun ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView(v => v === 'history' ? 'default' : 'history')}
          >
            History
          </button>
          {!activeRun && (
            <button
              className="btn-primary"
              onClick={() => setView('new')}
            >
              <Truck size={15} />
              Start New Run
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {cancelSaving && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
          Cancelling run and returning items to warehouse...
        </div>
      )}

      {currentView === 'dashboard' && activeRun && (
        <ActiveRunDashboard
          activeRun={activeRun}
          machines={machines}
          locations={locations}
          onRefresh={refreshActiveRun}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}

      {currentView === 'new' && !activeRun && (
        <StartRunView
          warehouse={warehouse.filter(w => w.quantity > 0)}
          onStarted={handleRunStarted}
        />
      )}

      {currentView === 'history' && !activeRun && (
        <HistoryView history={history} />
      )}

      {currentView === 'default' && !activeRun && (
        <div className="card p-10 text-center text-gray-400">
          <Truck size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-medium text-gray-600 text-lg mb-1">No active delivery run</p>
          <p className="text-sm mb-5">Pull products from the warehouse and restock your machines in one trip.</p>
          <button className="btn-primary mx-auto" onClick={() => setView('new')}>
            <Truck size={15} />
            Start New Run
          </button>
        </div>
      )}
    </div>
  )
}
