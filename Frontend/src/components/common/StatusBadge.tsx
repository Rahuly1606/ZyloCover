import { FC } from 'react'

interface StatusBadgeProps {
  status: string
  className?: string
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const statusMap: Record<string, string> = {
    // Policy statuses
    active: 'bg-green-100 text-green-800 border border-green-300',
    expired: 'bg-gray-100 text-gray-800 border border-gray-300',
    cancelled: 'bg-gray-100 text-gray-800 border border-gray-300',
    
    // Claim statuses
    approved: 'bg-green-100 text-green-800 border border-green-300',
    triggered: 'bg-amber-100 text-amber-800 border border-amber-300',
    fraud_check: 'bg-amber-100 text-amber-800 border border-amber-300',
    fraud_flagged: 'bg-orange-100 text-orange-800 border border-orange-300',
    rejected: 'bg-red-100 text-red-800 border border-red-300',
    processing: 'bg-blue-100 text-blue-800 border border-blue-300',
    pending: 'bg-gray-100 text-gray-800 border border-gray-300',
    paid: 'bg-green-100 text-green-800 border border-green-300',
    
    // Generic
    success: 'bg-green-100 text-green-800 border border-green-300',
    warning: 'bg-amber-100 text-amber-800 border border-amber-300',
    error: 'bg-red-100 text-red-800 border border-red-300',
    info: 'bg-blue-100 text-blue-800 border border-blue-300',
  }

  const bgColor = statusMap[status] || 'bg-gray-100 text-gray-800 border border-gray-300'
  const displayText = status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${bgColor} ${className}`}>
      {displayText}
    </span>
  )
}
