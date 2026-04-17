import { apiClient } from '../api/client'

export const triggerService = {
  simulate: (data: any) =>
    apiClient.post<any>('/trigger/active', data),

  getEvents: (page = 1, size = 20) =>
    apiClient.get<any>('/trigger/active'),

  getEventById: (id: number) =>
    apiClient.get<any>('/trigger/active'),

  getCities: () =>
    apiClient.get<any>('/trigger/active'),

  getThresholds: () =>
    apiClient.get<any>('/trigger/active')
}
