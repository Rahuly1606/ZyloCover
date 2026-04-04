import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, SlidersHorizontal, ShieldAlert, ClipboardList } from 'lucide-react'

interface AdminNavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const adminNavItems: AdminNavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: '/admin/simulator', label: 'Simulator', icon: <SlidersHorizontal className="h-5 w-5" /> },
  { path: '/admin/fraud-queue', label: 'Fraud Queue', icon: <ShieldAlert className="h-5 w-5" /> },
  { path: '/admin/audit', label: 'Audit Log', icon: <ClipboardList className="h-5 w-5" /> },
]

export const AdminSidebar = () => {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {adminNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-orange-600">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
