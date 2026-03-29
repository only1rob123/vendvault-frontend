import { useState } from 'react'
import QRCode from 'react-qr-code'
import { QrCode, X, Printer, Download } from 'lucide-react'

function QRModal({ machine, onClose }) {
  const url = `${window.location.origin}/load/${machine.id}`

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${machine.name}</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center; max-width: 300px; }
            h2 { font-size: 20px; font-weight: 700; margin: 16px 0 4px; color: #111827; }
            p { color: #6b7280; font-size: 13px; margin: 0 0 8px; }
            .url { font-family: monospace; font-size: 10px; color: #9ca3af; word-break: break-all; margin-top: 12px; }
            svg { display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${256} ${256}" width="200" height="200">
              ${document.getElementById('qr-svg-' + machine.id)?.innerHTML || ''}
            </svg>
            <h2>${machine.name}</h2>
            <p>${machine.location_name || ''}</p>
            <p style="font-size:11px;color:#9ca3af;">Scan to load machine</p>
            <div class="url">${url}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{machine.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Scan to open Load Machine</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-xl border-2 border-gray-100 shadow-inner">
            <QRCode
              id={`qr-svg-${machine.id}`}
              value={url}
              size={180}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 256 256"
            />
          </div>

          <div className="text-center">
            <div className="font-semibold text-gray-800 text-sm">{machine.name}</div>
            {machine.location_name && <div className="text-xs text-gray-500">{machine.location_name}</div>}
            <div className="text-xs font-mono text-gray-400 mt-1 break-all">{url}</div>
          </div>

          <p className="text-xs text-gray-400 text-center px-4">
            Stick this QR code on the machine. Scan with any phone to instantly open the load screen.
          </p>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Close</button>
          <button className="btn-primary flex-1" onClick={handlePrint}>
            <Printer size={15} /> Print QR
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MachineQR({ machine }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="btn-secondary flex items-center gap-1.5 text-sm"
        onClick={() => setOpen(true)}
        title="Show QR code for this machine"
      >
        <QrCode size={15} /> QR Code
      </button>
      {open && <QRModal machine={machine} onClose={() => setOpen(false)} />}
    </>
  )
}
