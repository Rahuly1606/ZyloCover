import { apiClient } from '../api/client'

interface Payout {
  id: number
  claim_id: number
  amount: number
  status: string
  created_at: string
  paid_at?: string
}

export const payoutsService = {
  getPayouts: (page = 1, size = 20) =>
    apiClient.get<Payout[]>('/payouts', { page, size }),

  getPayoutById: (id: number) =>
    apiClient.get<Payout>(`/payouts/${id}`),

  getSummary: () =>
    apiClient.get<any>('/payouts/summary/monthly'),

  getRecent: (days = 30) =>
    apiClient.get<any>(`/payouts/summary/monthly`)
}
