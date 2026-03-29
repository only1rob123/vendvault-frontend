import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import api from '../lib/api'

function formatAge(startedAt) {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (h > 0) return `${h}h ${m}m ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

export default function ActiveRunBanner() {
  const [activeRun, setActiveRun] = useState(undefined) // undefined = not yet loaded

  const load = () => {
    api.get('/delivery-runs/active')
      .then(r => setActiveRun(r.data.run))
      .catch(() => setActiveRun(null))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!activeRun) return null

  const items = activeRun.items || []
  const totalRemaining = items.reduce((s, i) => s + (i.quantity_remaining || 0), 0)
  const products = items.length

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center gap-3">
      <Truck size={16} className="text-amber-600 shrink-0" />
      <div className="flex-1 text-sm text-amber-800">
        <span className="font-semibold">Delivery run in progress</span>
        {' · '}started {formatAge(activeRun.started_at)}
        {totalRemaining > 0 && ` · ${totalRemaining} unit${totalRemaining !== 1 ? 's' : ''} remaining across ${products} product${products !== 1 ? 's' : ''}`}
      </div>
      <Link to="/delivery-runs" className="text-amber-700 text-xs font-medium hover:underline shrink-0 whitespace-nowrap">
        View Run →
      </Link>
    </div>
  )
}
