import API from './api'

export const triggerService = {
  simulate: (data: any) => 
    API.post('/trigger/active', data),

  getEvents: (page = 1, size = 20) => 
    API.get('/trigger/active'),

  getEventById: (id: number) => 
    API.get('/trigger/active'),

  getCities: () => 
    API.get('/trigger/active'),

  getThresholds: () =>
    API.get('/trigger/active')
}
