import { apiClient } from '../api/client'

interface UserProfile {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: any
}

export const userService = {
  getProfile: () => apiClient.get<UserProfile>('/user/profile'),

  updateLocation: (lat: number, lng: number) =>
    apiClient.put<UserProfile>('/user/profile', { latitude: lat, longitude: lng }),

  updateProfile: (data: any) =>
    apiClient.put<UserProfile>('/user/profile', data),

  updateIncome: (avg_daily_income: number) =>
    apiClient.put<UserProfile>('/user/profile', { avg_daily_income })
}
