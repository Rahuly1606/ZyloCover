// Auth API endpoints
import { apiClient } from './client'
import type { AuthResponse } from '../types/api'

export const authApi = {
    signup: async (data: {
        email: string
        password: string
        name: string
        phone: string
        platform: string
        work_zone: string
        avg_daily_income: number
        avg_daily_hours: number
        location?: {
            latitude: number
            longitude: number
            address?: string
        }
    }): Promise<AuthResponse> => {
        try {
            return await apiClient.post('/auth/signup', data)
        } catch (error: any) {
            if (error.detail?.includes('already registered')) {
                throw new Error('This email is already registered. Please use a different email or sign in.')
            }
            throw new Error(error.detail || 'Signup failed. Please try again.')
        }
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            return await apiClient.post('/auth/login', { email, password })
        } catch (error: any) {
            if (error.status === 401) {
                throw new Error('Invalid email or password. Please check your credentials and try again.')
            }
            if (error.detail?.includes('disabled')) {
                throw new Error('Your account has been disabled. Please contact support.')
            }
            throw new Error(error.detail || 'Login failed. Please try again.')
        }
    },

    adminLogin: async (email: string, password: string): Promise<{ admin_token: string }> => {
        try {
            return await apiClient.post('/auth/admin-login', { email, password })
        } catch (error: any) {
            if (error.status === 401) {
                throw new Error('Invalid admin credentials. Please check your email and password.')
            }
            throw new Error(error.detail || 'Admin login failed. Please try again.')
        }
    }
}
