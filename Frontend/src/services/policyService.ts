import API from './api'

export const policyService = {
  createPolicy: (coverage_tier: string) => 
    API.post('/policy/create', { coverage_tier }),

  getActive: () => 
    API.get('/policy/active'),

  getHistory: (page = 1, size = 20) => 
    API.get('/policy/list/all'),

  getById: (id: number) => 
    API.get(`/policy/${id}`),

  renew: (policyId: number, coverage_tier: string) =>
    API.post('/policy/create', { coverage_tier })
}
