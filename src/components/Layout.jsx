import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, MapPin, Monitor, Package, Warehouse,
  Upload, BarChart3, DollarSign, LogOut, PackagePlus, ShoppingCart, Zap, Truck
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/actions', icon: Zap, label: 'Action Center' },
  { to: '/locations', icon: MapPin, label: 'Locations' },
  { to: '/machines', icon: Monitor, label: 'Machines' },
  { to: '/load', icon: PackagePlus, label: 'Load Machine' },
  { to: '/delivery-runs', icon: Truck, label: 'Delivery Runs' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/inventory', icon: Warehouse, label: 'Inventory' },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchasing' },
  { to: '/import', icon: Upload, label: 'Import Data' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/finance', icon: DollarSign, label: 'Finance' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-900 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VV</span>
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">VendVault</div>
              <div className="text-gray-400 text-xs">by Brennan &amp; Co</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-gray-700 pt-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400">
            <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.name}</div>
              <div className="text-gray-500 text-xs truncate">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="hover:text-white transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
