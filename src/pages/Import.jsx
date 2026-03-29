import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle, XCircle, Clock, FileText, Mail, RefreshCw, Play, Settings } from 'lucide-react'
import api from '../lib/api'

function DropZone({ onFile, accept, label, description }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleDrop = e => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300 hover:bg-gray-50'}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload size={24} className="text-gray-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
      <p className="text-xs text-gray-400 mt-2">Drag &amp; drop or click to browse</p>
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  )
}

function EmailPollerCard({ onImported }) {
  const [status, setStatus] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState(null)

  const loadStatus = () =>
    api.get('/email-poller/status').then(r => setStatus(r.data)).catch(() => setStatus(null))

  useEffect(() => { loadStatus() }, [])

  const trigger = async () => {
    setTriggering(true)
    setTriggerResult(null)
    try {
      const { data } = await api.post('/email-poller/trigger')
      setStatus(data.status)
      setTriggerResult(data.result)
      if (data.result?.imported > 0) onImported()
    } catch (e) {
      setTriggerResult({ error: e.response?.data?.error || 'Trigger failed' })
    } finally { setTriggering(false) }
  }

  if (!status) return null

  const { configured, enabled, running, lastRun, lastError, lastResult, totalImported, email, intervalMins } = status

  return (
    <div className="card overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail size={15} className={configured ? 'text-brand-600' : 'text-gray-400'} />
          <h2 className="font-semibold text-sm text-gray-900">Email Auto-Import</h2>
          {configured && enabled && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
          )}
          {configured && !enabled && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Standby</span>
          )}
          {!configured && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Not Configured</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {configured && (
            <button
              className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
              onClick={trigger}
              disabled={triggering || running}
            >
              {triggering || running
                ? <><RefreshCw size={12} className="animate-spin" /> Checking...</>
                : <><Play size={12} /> Check Now</>}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {!configured ? (
          <div className="flex items-start gap-3">
            <Settings size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-800 mb-1">Set up automatic email import</p>
              <p className="text-xs text-gray-500 mb-3">
                Add these variables to your backend <code className="bg-gray-100 px-1 rounded">.env</code> file to automatically import Cantaloupe CSV reports from your email inbox:
              </p>
              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto leading-relaxed">{`EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_COMPANY_ID=your-company-uuid
EMAIL_POLL_INTERVAL_MINS=15`}</pre>
              <p className="text-xs text-gray-400 mt-2">
                For Gmail, use an <strong>App Password</strong> (not your regular password). Enable 2FA in Google Account, then go to Security → App Passwords.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Watching</div>
                <div className="text-sm font-medium text-gray-900 truncate">{email}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Poll Interval</div>
                <div className="text-sm font-medium text-gray-900">Every {intervalMins} min</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-0.5">Total Imported</div>
                <div className="text-sm font-medium text-brand-600">{totalImported} rows</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Last check: {lastRun ? new Date(lastRun).toLocaleString() : 'Not yet'}</span>
              {lastResult && !lastError && (
                <span className="text-green-600">
                  Found {lastResult.found} email{lastResult.found !== 1 ? 's' : ''} · Imported {lastResult.imported} row{lastResult.imported !== 1 ? 's' : ''}
                </span>
              )}
              {lastError && (
                <span className="text-red-600">Error: {lastError}</span>
              )}
            </div>

            {triggerResult && (
              <div className={`text-xs rounded-lg px-3 py-2 ${
                triggerResult.error
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {triggerResult.error
                  ? `Error: ${triggerResult.error}`
                  : triggerResult.skipped
                    ? 'Already running — try again in a moment'
                    : `Checked inbox: found ${triggerResult.found} email${triggerResult.found !== 1 ? 's' : ''}, imported ${triggerResult.imported} row${triggerResult.imported !== 1 ? 's' : ''}`
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Import() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [log, setLog] = useState([])
  const [loadingLog, setLoadingLog] = useState(true)

  const loadLog = () => api.get('/imports/log').then(r => setLog(r.data)).finally(() => setLoadingLog(false))
  useEffect(() => { loadLog() }, [])

  const handleImport = async (file, type) => {
    setImporting(true); setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post(`/imports/${type}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult({ ...data, filename: file.name, type })
      loadLog()
    } catch (e) {
      setResult({ error: e.response?.data?.error || 'Import failed', filename: file.name })
    } finally { setImporting(false) }
  }

  const statusIcon = status => {
    if (status === 'complete') return <CheckCircle size={14} className="text-green-500" />
    if (status === 'error') return <XCircle size={14} className="text-red-500" />
    if (status === 'partial') return <CheckCircle size={14} className="text-amber-500" />
    return <Clock size={14} className="text-gray-400" />
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
        <p className="text-sm text-gray-500 mt-1">Upload Cantaloupe CSV exports to sync sales and activity data</p>
      </div>

      {/* Email Auto-Import */}
      <EmailPollerCard onImported={loadLog} />

      {importing && (
        <div className="mb-4 p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-brand-700 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          Importing...
        </div>
      )}

      {result && !importing && (
        <div className={`mb-4 p-4 rounded-xl border text-sm ${result.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
          {result.error ? (
            <p><strong>Error:</strong> {result.error}</p>
          ) : (
            <>
              <p className="font-medium mb-1">✓ Import complete — {result.filename}</p>
              <div className="flex gap-4 text-xs">
                <span>Total rows: <strong>{result.rows_total}</strong></span>
                <span>Imported: <strong>{result.rows_imported}</strong></span>
                <span>Skipped (duplicates): <strong>{result.rows_skipped}</strong></span>
                {result.rows_error > 0 && <span className="text-amber-600">Errors: <strong>{result.rows_error}</strong></span>}
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Transaction Line Item Export</h3>
          <p className="text-xs text-gray-500 mb-4">
            Individual sale transactions — the primary import. Powers product velocity, slot tracking, and revenue reports.
            In Seed Pro: <span className="font-mono">Reports → Transaction Line Item Export</span>
          </p>
          <DropZone
            onFile={f => handleImport(f, 'transaction-line-items')}
            accept=".csv"
            label="Transaction Line Item CSV"
            description="Daily export from Cantaloupe Seed Pro"
          />
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-1">Activity Analysis</h3>
          <p className="text-xs text-gray-500 mb-4">
            Monthly summary by machine and payment type. Used for seasonality and trend analysis.
            In Seed Pro: <span className="font-mono">Reports → Activity Analysis</span>
          </p>
          <DropZone
            onFile={f => handleImport(f, 'activity-analysis')}
            accept=".csv"
            label="Activity Analysis CSV"
            description="Monthly export from Cantaloupe Seed Pro"
          />
        </div>
      </div>

      {/* Import log */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <FileText size={15} className="text-gray-500" />
          <h2 className="font-semibold text-sm text-gray-900">Import History</h2>
        </div>
        {loadingLog ? <p className="px-4 py-4 text-sm text-gray-400">Loading...</p> : (
          log.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No imports yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">File</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Rows</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Imported</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Skipped</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {log.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700 truncate max-w-xs">{item.filename}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{item.import_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-right">{item.rows_total}</td>
                    <td className="px-4 py-2.5 text-right text-green-600">{item.rows_imported}</td>
                    <td className="px-4 py-2.5 text-right text-gray-400">{item.rows_skipped}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {statusIcon(item.status)}
                        <span className="text-xs">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{item.imported_at?.slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  )
}
