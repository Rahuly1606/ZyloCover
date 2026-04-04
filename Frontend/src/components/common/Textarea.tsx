import React, { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  fullWidth?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = true, className = '', ...props }, ref) => {
    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          rows={4}
          {...props}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        {hint && !error && <p className="text-sm text-gray-600 mt-1">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
