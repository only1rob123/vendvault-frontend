import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, MapPin, Monitor, Package, Warehouse,
  Upload, BarChart3, DollarSign, LogOut, PackagePlus, ShoppingCart, Zap, Truck,
  Menu, X
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

// Bottom tab bar — 4 primary driver screens + More
const bottomNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/actions', icon: Zap, label: 'Actions' },
  { to: '/load', icon: PackagePlus, label: 'Load' },
  { to: '/delivery-runs', icon: Truck, label: 'Runs' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const closeDrawer = () => setDrawerOpen(false)

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Desktop Sidebar (md+) ─────────────────────────── */}
      <aside className="hidden md:flex w-60 bg-gray-900 flex-col flex-shrink-0">
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

      {/* ── Mobile Drawer ─────────────────────────────────── */}
      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VV</span>
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">VendVault</div>
              <div className="text-gray-400 text-xs">by Brennan &amp; Co</div>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeDrawer}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer user + logout */}
        <div className="px-3 pb-8 border-t border-gray-700 pt-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              <div className="text-gray-500 text-xs truncate">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right column: header + content + bottom nav ───── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center gap-3 flex-shrink-0 z-10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-gray-500 hover:text-gray-900 p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">VV</span>
            </div>
            <span className="font-bold text-gray-900 text-base">VendVault</span>
          </div>
          <div className="ml-auto">
            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page content — pb-16 on mobile to clear the bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom nav bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-30 safe-area-inset-bottom">
          {bottomNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-xs font-medium ${isActive ? 'text-brand-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* More → opens drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Menu size={22} strokeWidth={1.8} />
            <span className="text-xs font-medium">More</span>
          </button>
        </nav>

      </div>
    </div>
  )
}
