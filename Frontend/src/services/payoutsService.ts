import API from './api'

export const payoutsService = {
  getPayouts: (page = 1, size = 20) => 
    API.get('/payouts', { params: { page, size } }),

  getPayoutById: (id: number) => 
    API.get(`/payouts/${id}`),

  getSummary: () => 
    API.get('/payouts/summary/monthly'),

  getRecent: (days = 30) =>
    API.get(`/payouts/summary/monthly`)
}
