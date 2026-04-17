import { apiClient } from '../api/client'

interface PricingData {
  weekly_premium: number
  max_payout: number
  [key: string]: any
}

export const pricingService = {
  calculate: (coverage_tier: string) =>
    apiClient.post<PricingData>('/pricing/calculate', { coverage_tier }),

  calculatePricing: () =>
    apiClient.post<PricingData>('/pricing/calculate', {}),

  getTiers: () =>
    apiClient.get<any>('/pricing/coverage-tiers'),

  getPremiumBreakdown: (coverage_tier: string) =>
    apiClient.post<PricingData>('/pricing/calculate', { coverage_tier })
}
