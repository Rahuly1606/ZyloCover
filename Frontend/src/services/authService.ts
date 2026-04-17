import { apiClient } from '../api/client'

interface SignupData {
  name: string
  email: string
  phone: string
  password: string
  city: string
  zone_risk: string
  delivery_platform: string
  avg_daily_income: number
}

interface LoginData {
  email: string
  password: string
}

interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    name: string
    email: string
    phone: string
    employee_id: string
    job_verification_status: string
    city: string
    zone_risk: string
    avg_daily_income: number
    is_blacklisted: boolean
    risk_score: number
    fraud_flags: number
    registered_latitude?: number
    registered_longitude?: number
    registered_address?: string
  }
}

interface AdminAuthResponse {
  admin_token: string
}

export const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/signup', data)
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', { email, password })
  },

  adminLogin: async (email: string, password: string): Promise<AdminAuthResponse> => {
    return apiClient.post<AdminAuthResponse>('/auth/admin-login', { email, password })
  }
}
