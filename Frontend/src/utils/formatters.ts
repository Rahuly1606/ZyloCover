import { format, parseISO } from 'date-fns'

export const formatters = {
  // Format currency with ₹ symbol
  currency: (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '₹0.00'
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },

  // Format date like "4 Apr 2026, 2:30 PM"
  dateTime: (date: string | Date): string => {
    try {
      const d = typeof date === 'string' ? parseISO(date) : date
      return format(d, 'dd MMM yyyy, h:mm a')
    } catch (e) {
      return 'Invalid date'
    }
  },

  // Format date (alias for dateTime)
  formatDate: (date: string | Date): string => {
    try {
      const d = typeof date === 'string' ? parseISO(date) : date
      return format(d, 'dd MMM yyyy, h:mm a')
    } catch (e) {
      return 'Invalid date'
    }
  },

  // Format date like "4 Apr"
  shortDate: (date: string | Date): string => {
    try {
      const d = typeof date === 'string' ? parseISO(date) : date
      return format(d, 'dd MMM')
    } catch (e) {
      return 'Invalid date'
    }
  },

  // Format date like "April 4, 2026"
  longDate: (date: string | Date): string => {
    try {
      const d = typeof date === 'string' ? parseISO(date) : date
      return format(d, 'MMMM d, yyyy')
    } catch (e) {
      return 'Invalid date'
    }
  },

  // Format numbers with commas
  number: (num: number): string => {
    return num.toLocaleString('en-IN')
  },

  // Format percentage
  percentage: (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`
  },

  // Get color for risk score (0-100)
  riskColor: (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'gray'
    if (score < 30) return 'green'
    if (score < 60) return 'amber'
    return 'red'
  },

  // Get text color class for risk
  riskColorClass: (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'text-gray-600'
    if (score < 30) return 'text-green-600'
    if (score < 60) return 'text-amber-600'
    return 'text-red-600'
  },

  // Get background color class for risk
  riskBgColorClass: (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'bg-gray-100'
    if (score < 30) return 'bg-green-100'
    if (score < 60) return 'bg-amber-100'
    return 'bg-red-100'
  },

  // Get color for status
  statusColor: (status: string): string => {
    const colors: Record<string, string> = {
      active: 'teal',
      approved: 'green',
      triggered: 'amber',
      fraud_check: 'amber',
      fraud_flagged: 'orange',
      rejected: 'red',
      processing: 'blue',
      pending: 'gray',
      paid: 'green',
      expired: 'gray',
      cancelled: 'gray',
    }
    return colors[status] || 'gray'
  },

  // Simple abbreviation (first letter of each word)
  initials: (name: string | null | undefined): string => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
}
