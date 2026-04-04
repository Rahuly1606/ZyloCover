import API from './api'

export const adminService = {
  getDashboard: () => 
    API.get('/admin/dashboard'),

  getAnalytics: () => 
    API.get('/admin/analytics'),

  getPolicies: (filters: any = {}) => 
    API.get('/admin/analytics', { params: filters }),

  getClaims: (filters: any = {}) => 
    API.get('/admin/analytics', { params: filters }),

  getFraudQueue: (page = 1, size = 20) => 
    API.get('/admin/analytics', { params: { page, size } }),

  reviewClaim: (claimId: number, action: string, notes: string) => 
    API.put(`/admin/claims/${claimId}/review`, { action, notes }),

  simulateTrigger: (data: any) => 
    API.post('/admin/trigger/simulate', data),

  getLossRatio: () => 
    API.get('/admin/analytics'),

  getRiskHeatmap: () => 
    API.get('/admin/analytics'),

  getAuditLog: (page = 1, size = 20) =>
    API.get('/admin/analytics', { params: { page, size } })
}
