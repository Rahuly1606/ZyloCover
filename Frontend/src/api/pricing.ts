// Pricing API endpoints - Actuarial premium calculation
import { apiClient } from './client'
import type { PricingResponse, CoverageTier } from '../types/api'

export const pricingApi = {
    /**
     * Calculate premium with full actuarial breakdown
     * Returns: pure → gross → experience-rated → final premium
     */
    calculate: async (params: {
        daily_income: number
        city: string
        zone: string
        platform: string
        coverage_tier: "basic" | "standard" | "premium"
    }): Promise<PricingResponse> => {
        return apiClient.post('/pricing/calculate', params)
    },

    /**
     * Get coverage tier options with details
     */
    getCoverageTiers: async (): Promise<CoverageTier[]> => {
        return apiClient.get('/pricing/coverage-tiers')
    }
}