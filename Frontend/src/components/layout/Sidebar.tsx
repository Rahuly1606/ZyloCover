import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShieldCheck, FileText, Wallet, UserCircle } from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: '/policy', label: 'Policy', icon: <ShieldCheck className="h-5 w-5" /> },
  { path: '/claims', label: 'Claims', icon: <FileText className="h-5 w-5" /> },
  { path: '/payouts', label: 'Payouts', icon: <Wallet className="h-5 w-5" /> },
  { path: '/profile', label: 'Profile', icon: <UserCircle className="h-5 w-5" /> },
]

export const Sidebar = () => {
  const location = useLocation()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="text-purple-600">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
