import API from './api'

export const claimsService = {
  getClaims: (page = 1, size = 20, filters: any = {}) => 
    API.get('/claims', { params: { page, size, ...filters } }),

  getClaimById: (id: number) => 
    API.get(`/claims/${id}/audit`),

  getStats: () => 
    API.get('/claims/stats'),

  getFraudDetails: (claimId: number) =>
    API.get(`/claims/${claimId}/audit`)
}
