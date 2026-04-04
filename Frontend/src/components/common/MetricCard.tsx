import { FC, ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  onClick?: () => void
  className?: string
}

export const MetricCard: FC<MetricCardProps> = ({ 
  label, 
  value, 
  unit = '', 
  icon, 
  onClick,
  className = '' 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}{unit}
          </p>
        </div>
        {icon && (
          <div className="text-purple-600 ml-3 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
