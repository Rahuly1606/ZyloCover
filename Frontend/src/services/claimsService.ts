import { apiClient } from '../api/client'

interface ClaimData {
  id: number
  [key: string]: any
}

export const claimsService = {
  getClaims: (page = 1, size = 20, filters: any = {}) =>
    apiClient.get<ClaimData[]>('/claims', { page, size, ...filters }),

  getClaimById: (id: number) =>
    apiClient.get<ClaimData>(`/claims/${id}/audit`),

  getStats: () =>
    apiClient.get<any>('/claims/stats'),

  getFraudDetails: (claimId: number) =>
    apiClient.get<ClaimData>(`/claims/${claimId}/audit`)
}
