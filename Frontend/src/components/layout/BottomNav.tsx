import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { House, ShieldCheck, FileText, Wallet, UserCircle } from 'lucide-react'

interface BottomNavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const bottomNavItems: BottomNavItem[] = [
  { path: '/dashboard', label: 'Home', icon: <House className="h-5 w-5" /> },
  { path: '/policy', label: 'Policy', icon: <ShieldCheck className="h-5 w-5" /> },
  { path: '/claims', label: 'Claims', icon: <FileText className="h-5 w-5" /> },
  { path: '/payouts', label: 'Payouts', icon: <Wallet className="h-5 w-5" /> },
  { path: '/profile', label: 'Profile', icon: <UserCircle className="h-5 w-5" /> },
]

export const BottomNav = () => {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around">
        {bottomNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 px-4 py-3 text-xs font-medium transition-colors flex-1 ${
              location.pathname === item.path
                ? 'text-purple-600 border-t-2 border-purple-600'
                : 'text-gray-600'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
