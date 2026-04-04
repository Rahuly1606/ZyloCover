import API from './api'

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
  data: any
  access_token: string
  user: {
    id: number
    name: string
    email: string
    phone: string
    city: string
    zone_risk: string
    avg_daily_income: number
    avg_weekly_income: number
    is_blacklisted: boolean
    risk_score: number
    fraud_flags: number
  }
}

interface AdminAuthResponse {
  admin_token: string
}

export const authService = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    return API.post('/auth/signup', data)
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    return API.post('/auth/login', { email, password })
  },

  adminLogin: async (email: string, password: string): Promise<AdminAuthResponse> => {
    return API.post('/auth/admin-login', { email, password })
  }
}
