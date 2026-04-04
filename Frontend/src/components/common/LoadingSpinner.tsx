import { FC } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullHeight?: boolean
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  fullHeight = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className={`flex items-center justify-center ${fullHeight ? 'min-h-screen' : 'py-12'}`}>
      <div className={`animate-spin rounded-full border-b-2 border-t-2 border-purple-600 ${sizeClasses[size]}`}></div>
    </div>
  )
}
