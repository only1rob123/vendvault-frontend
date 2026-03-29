import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Locations from './pages/Locations'
import Machines from './pages/Machines'
import MachineDetail from './pages/MachineDetail'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Import from './pages/Import'
import Reports from './pages/Reports'
import Finance from './pages/Finance'
import Load from './pages/Load'
import Purchases from './pages/Purchases'
import ActionCenter from './pages/ActionCenter'
import DeliveryRuns from './pages/DeliveryRuns'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="actions" element={<ActionCenter />} />
            <Route path="locations" element={<Locations />} />
            <Route path="machines" element={<Machines />} />
            <Route path="machines/:id" element={<MachineDetail />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="import" element={<Import />} />
            <Route path="reports" element={<Reports />} />
            <Route path="finance" element={<Finance />} />
            <Route path="load" element={<Load />} />
            <Route path="load/:machineId" element={<Load />} />
            <Route path="delivery-runs" element={<DeliveryRuns />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
