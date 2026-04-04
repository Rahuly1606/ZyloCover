import React, { InputHTMLAttributes } from 'react'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex items-start">
        <input
          ref={ref}
          type="checkbox"
          className={`w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-2 focus:ring-purple-500 cursor-pointer ${className}`}
          {...props}
        />
        {label && (
          <label className="ml-3 text-sm text-gray-900 cursor-pointer">
            {label}
            {error && <p className="text-red-600">{error}</p>}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
