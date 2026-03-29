import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster, toast } from 'sonner'

// Override window.alert with non-blocking toast so Chrome automation isn't blocked
window.alert = (msg) => toast.error(msg)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster richColors position="top-right" />
  </React.StrictMode>,
)
