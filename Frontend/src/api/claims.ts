// Claims API endpoints - with fraud transparency
import { apiClient } from './client'
import type { Claim, FraudAudit } from '../types/api'

export interface ClaimSubmissionPayload {
    trigger_id: number
    claim_latitude?: number
    claim_longitude?: number
}

export const claimsApi = {
    /**
     * Get all claims for logged-in user
     */
    getAll: async (): Promise<Claim[]> => {
        return apiClient.get('/claims/')
    },

    /**
     * Get claim details with full fraud audit trail (5 layers)
     */
    getAudit: async (claimId: number): Promise<FraudAudit> => {
        return apiClient.get(`/claims/${claimId}/audit`)
    },

    /**
     * Submit a claim with current location for location-based fraud detection
     */
    submitWithLocation: async (payload: ClaimSubmissionPayload): Promise<Claim> => {
        return apiClient.post('/claims/submit-with-location', payload)
    },

    /**
     * Manually trigger claim processing (admin only)
     */
    processTrigger: async (triggerId: number): Promise<{ processed: number }> => {
        return apiClient.post(`/claims/trigger/${triggerId}/process`)
    }
}