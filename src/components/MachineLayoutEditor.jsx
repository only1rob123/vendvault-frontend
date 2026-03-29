import { useState } from 'react'
import { Plus, Minus, Save, X, Pencil } from 'lucide-react'
import api from '../lib/api'

function CellModal({ cell, row, col, products, onClose, onSave }) {
  const [slotCode, setSlotCode] = useState(cell?.slot_code || '')
  const [productId, setProductId] = useState(cell?.product_id || '')
  const [capacity, setCapacity] = useState(cell?.capacity ?? 10)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Cell Row {row + 1}, Col {col + 1}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Assign Cantaloupe slot code and product</p>
          </div>
          <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Cantaloupe Slot Code</label>
            <input className="input font-mono" value={slotCode}
              onChange={e => setSlotCode(e.target.value)}
              placeholder="e.g. 0001, 1103, A1" autoFocus />
            <p className="text-xs text-gray-400 mt-1">The code Cantaloupe uses in transaction exports</p>
          </div>
          <div>
            <label className="label">Product</label>
            <select className="input" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">— Unassigned —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Capacity (units)</label>
            <input type="number" min="1" max="100" className="input"
              value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          {cell?.slot_code && (
            <button className="btn-danger text-xs py-2 px-3" onClick={() => onSave(null)}>
              Clear Slot
            </button>
          )}
          <button className="btn-primary"
            onClick={() => onSave(slotCode.trim() ? { slot_code: slotCode.trim(), product_id: productId, capacity } : null)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MachineLayoutEditor({ machine, slots, products, onSave, onCancel }) {
  const [rows, setRows] = useState(machine.layout_rows || 5)
  const [cols, setCols] = useState(machine.layout_cols || 6)
  const [name, setName] = useState(machine.name || '')
  const [machineType, setMachineType] = useState(machine.machine_type || 'snack')
  const [deviceId, setDeviceId] = useState(machine.cantaloupe_device_id || '')
  const [commission, setCommission] = useState(machine.commission_pct ?? 0)
  const [monthlyCost, setMonthlyCost] = useState(machine.monthly_fixed_cost ?? 0)
  const [editCell, setEditCell] = useState(null)
  const [saving, setSaving] = useState(false)

  // Build initial grid from existing slots
  const buildGrid = (r, c, existingSlots) => {
    const grid = Array.from({ length: r }, () => Array.from({ length: c }, () => null))
    for (const s of (existingSlots || [])) {
      if (s.row_index >= 0 && s.row_index < r && s.col_index >= 0 && s.col_index < c) {
        grid[s.row_index][s.col_index] = {
          slot_code: s.slot_code,
          product_id: s.product_id || '',
          capacity: s.capacity ?? 10,
        }
      }
    }
    return grid
  }

  const [cells, setCells] = useState(() => buildGrid(machine.layout_rows || 5, machine.layout_cols || 6, slots))

  const changeRows = (delta) => {
    const newRows = Math.max(1, Math.min(20, rows + delta))
    setRows(newRows)
    setCells(prev => Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => prev[r]?.[c] ?? null)
    ))
  }

  const changeCols = (delta) => {
    const newCols = Math.max(1, Math.min(20, cols + delta))
    setCols(newCols)
    setCells(prev => prev.map(row => Array.from({ length: newCols }, (_, c) => row[c] ?? null)))
  }

  const handleCellSave = (data) => {
    const { row, col } = editCell
    setCells(prev => {
      const next = prev.map(r => [...r])
      next[row][col] = data
      return next
    })
    setEditCell(null)
  }

  const updateCellField = (r, c, field, value) => {
    setCells(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = { ...next[r][c], [field]: value }
      return next
    })
  }

  const removeCell = (r, c) => {
    setCells(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = null
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cellsFlat = []
      cells.forEach((rowArr, r) => {
        rowArr.forEach((cell, c) => {
          if (cell?.slot_code?.trim()) {
            cellsFlat.push({ row: r, col: c, slot_code: cell.slot_code.trim(), product_id: cell.product_id || '', capacity: cell.capacity ?? 10 })
          }
        })
      })
      await api.post(`/machines/${machine.id}/layout`, {
        name, machine_type: machineType,
        cantaloupe_device_id: deviceId || null,
        commission_pct: Number(commission),
        monthly_fixed_cost: Number(monthlyCost),
        layout_rows: rows, layout_cols: cols,
        cells: cellsFlat
      })
      onSave()
    } catch (e) {
      alert(e.response?.data?.error || 'Error saving layout')
    } finally {
      setSaving(false)
    }
  }

  const configuredCount = cells.flat().filter(c => c?.slot_code).length

  return (
    <div className="space-y-4">
      {/* Machine settings */}
      <div className="card p-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <Pencil size={14} className="text-brand-500" /> Machine Settings
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 md:col-span-1">
            <label className="label">Machine Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={machineType} onChange={e => setMachineType(e.target.value)}>
              {['snack', 'drink', 'coffee', 'frozen', 'combo'].map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cantaloupe Device ID</label>
            <input className="input font-mono text-sm" value={deviceId}
              onChange={e => setDeviceId(e.target.value)} placeholder="e.g. VK100125641" />
          </div>
          <div>
            <label className="label">Commission %</label>
            <input type="number" min="0" max="100" step="0.1" className="input"
              value={commission} onChange={e => setCommission(e.target.value)} />
          </div>
          <div>
            <label className="label">Monthly Fixed Cost $</label>
            <input type="number" min="0" step="0.01" className="input"
              value={monthlyCost} onChange={e => setMonthlyCost(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Grid editor */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-sm text-gray-900">Layout Grid</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click any cell to assign a slot code. {configuredCount} slot{configuredCount !== 1 ? 's' : ''} configured.</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs">Rows:</span>
              <button className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                onClick={() => changeRows(-1)} disabled={rows <= 1}><Minus size={11} /></button>
              <span className="font-mono font-bold text-gray-900 w-5 text-center">{rows}</span>
              <button className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                onClick={() => changeRows(1)} disabled={rows >= 20}><Plus size={11} /></button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 text-xs">Cols:</span>
              <button className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                onClick={() => changeCols(-1)} disabled={cols <= 1}><Minus size={11} /></button>
              <span className="font-mono font-bold text-gray-900 w-5 text-center">{cols}</span>
              <button className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                onClick={() => changeCols(1)} disabled={cols >= 20}><Plus size={11} /></button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid gap-1.5 min-w-max" style={{ gridTemplateColumns: `repeat(${cols}, minmax(80px, 1fr))` }}>
            {cells.map((rowArr, r) =>
              rowArr.map((cell, c) => (
                <button key={`${r}-${c}`}
                  onClick={() => setEditCell({ row: r, col: c })}
                  className={`border-2 rounded-lg p-2 min-h-[68px] text-left transition-all group relative
                    ${cell?.slot_code
                      ? 'border-brand-300 bg-brand-50 hover:border-brand-500 hover:shadow-sm'
                      : 'border-dashed border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                >
                  {cell?.slot_code ? (
                    <div>
                      <div className="text-xs font-mono font-bold text-brand-700 leading-none">{cell.slot_code}</div>
                      <div className="text-xs text-gray-600 mt-1 leading-tight truncate max-w-[70px]">
                        {products.find(p => p.id === cell.product_id)?.name || <span className="text-gray-400 italic">No product</span>}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">cap: {cell.capacity}</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1 py-2">
                      <Plus size={14} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                      <span className="text-[10px] text-gray-300 group-hover:text-brand-400">Add</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* List view for configured slots */}
      {configuredCount > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-900">Configured Slots — Bulk Edit</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-20">Pos</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Slot Code</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Product</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 w-24">Capacity</th>
                  <th className="px-4 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cells.flatMap((rowArr, r) =>
                  rowArr.map((cell, c) => {
                    if (!cell?.slot_code) return null
                    return (
                      <tr key={`list-${r}-${c}`} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs text-gray-400 font-mono">R{r + 1}·C{c + 1}</td>
                        <td className="px-4 py-2">
                          <input className="input py-1.5 text-xs font-mono w-28"
                            value={cell.slot_code}
                            onChange={e => updateCellField(r, c, 'slot_code', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select className="input py-1.5 text-xs"
                            value={cell.product_id || ''}
                            onChange={e => updateCellField(r, c, 'product_id', e.target.value)}
                          >
                            <option value="">— Unassigned —</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input type="number" min="1" max="100" className="input py-1.5 text-xs w-20 text-right"
                            value={cell.capacity}
                            onChange={e => updateCellField(r, c, 'capacity', Number(e.target.value))}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button className="btn-danger text-xs py-1 px-2" onClick={() => removeCell(r, c)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  }).filter(Boolean)
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3 justify-end pt-1">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={15} />
          {saving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>

      {editCell !== null && (
        <CellModal
          cell={cells[editCell.row]?.[editCell.col]}
          row={editCell.row}
          col={editCell.col}
          products={products}
          onClose={() => setEditCell(null)}
          onSave={handleCellSave}
        />
      )}
    </div>
  )
}
