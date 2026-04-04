// Policy API endpoints - 7-day policies with coverage tiers
import { apiClient } from './client'
import type { Policy } from '../types/api'

export const policyApi = {
    /**
     * Create 7-day policy with selected coverage tier
     * Actuarial calculation happens on backend
     */
    create: async (coverage_tier: "basic" | "standard" | "premium"): Promise<Policy> => {
        return apiClient.post('/policy/create', { coverage_tier })
    },

    /**
     * Get active policies for logged-in user
     */
    getActive: async (): Promise<Policy[]> => {
        return apiClient.get('/policy/active')
    },

    /**
     * Get specific policy by ID
     */
    getById: async (id: number): Promise<Policy> => {
        return apiClient.get(`/policy/${id}`)
    },

    /**
     * Get all policies for logged-in user (including expired)
     */
    getAll: async (): Promise<Policy[]> => {
        return apiClient.get('/policy/list/all')
    }
}