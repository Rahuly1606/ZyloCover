import { apiClient } from '../api/client'

interface PolicyData {
  id: number
  coverage_tier: string
  premium_amount: number
  status: string
  valid_till: string
  created_at: string
}

export const policyService = {
  createPolicy: (coverage_tier: string) =>
    apiClient.post<PolicyData>('/policy/create', { coverage_tier }),

  getActive: () =>
    apiClient.get<PolicyData | null>('/policy/active'),

  getHistory: (page = 1, size = 20) =>
    apiClient.get<PolicyData[]>('/policy/list/all'),

  getById: (id: number) =>
    apiClient.get<PolicyData>(`/policy/${id}`),

  renew: (policyId: number, coverage_tier: string) =>
    apiClient.post<PolicyData>('/policy/create', { coverage_tier })
}
