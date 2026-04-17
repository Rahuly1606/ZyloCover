// Auth API endpoints
import { apiClient } from './client'
import type { AuthResponse } from '../types/api'

export const authApi = {
    signup: async (data: {
        email: string
        password: string
        name: string
        phone: string
        employee_id: string
        job_proof_image?: string  // Base64 encoded image
        city: string
        zone_risk: string
        delivery_platform: string
        avg_daily_income: number
        avg_daily_hours?: number
        experience_months: number  // Months of delivery experience
        registered_latitude?: number
        registered_longitude?: number
        registered_address?: string
    }): Promise<AuthResponse> => {
        try {
            return await apiClient.post('/auth/signup', data)
        } catch (error: any) {
            if (error.detail?.includes('already registered')) {
                throw new Error('This email or employee ID is already registered. Please use different credentials.')
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
                throw new Error('Invalid admin email or password.')
            }
            if (error.status === 403) {
                throw new Error('Admin access required. This account does not have admin privileges.')
            }
            throw new Error(error.detail || 'Admin login failed. Please try again.')
        }
    }
}
