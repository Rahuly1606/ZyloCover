import API from './api'

export const pricingService = {
  calculate: (coverage_tier: string) => 
    API.post('/pricing/calculate', { coverage_tier }),

  calculatePricing: () =>
    API.post('/pricing/calculate', {}),

  getTiers: () => 
    API.get('/pricing/coverage-tiers'),

  getPremiumBreakdown: (coverage_tier: string) =>
    API.post('/pricing/calculate', { coverage_tier })
}
