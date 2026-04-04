// User API endpoints
import { apiClient } from './client'
import type { User, UserStats } from '../types/api'

export const userApi = {
    getProfile: async (): Promise<User> => {
        return apiClient.get('/user/profile')
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        return apiClient.put('/user/profile', {
            name: data.name,
            avg_daily_income: data.avg_daily_income,
            avg_daily_hours: data.avg_daily_hours,
            experience_months: data.experience_months,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
        })
    },

    getStats: async (): Promise<UserStats> => {
        return apiClient.get('/user/stats')
    }
}