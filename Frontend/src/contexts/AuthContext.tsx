import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
    id: number
    name: string
    email: string
    phone: string
    employee_id: string
    job_verification_status: string
    city: string
    zone_risk: string
    avg_daily_income: number
    avg_weekly_income?: number
    is_blacklisted: boolean
    risk_score: number
    fraud_flags: number
    registered_latitude?: number
    registered_longitude?: number
    registered_address?: string
}

interface AuthContextType {
    isAuthenticated: boolean
    userId: number | null
    user: User | null
    token: string | null
    isAdmin: boolean
    adminToken: string | null
    login: (token: string, userId: number, user: User) => void
    logout: () => void
    adminLogin: (adminToken: string) => void
    adminLogout: () => void
    updateUser: (user: Partial<User>) => void
    isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userId, setUserId] = useState<number | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [adminToken, setAdminToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize auth state from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('access_token')
        const savedUserId = localStorage.getItem('user_id')
        const savedUser = localStorage.getItem('user_data')
        const savedAdminToken = localStorage.getItem('admin_token')

        if (savedToken && savedUserId) {
            setToken(savedToken)
            setUserId(parseInt(savedUserId))
            setIsAuthenticated(true)
            if (savedUser) {
                try {
                    setUser(JSON.parse(savedUser))
                } catch (e) {
                    console.error('Failed to parse user data from localStorage')
                }
            }
        }

        if (savedAdminToken) {
            setAdminToken(savedAdminToken)
            setIsAdmin(true)
        }

        setIsLoading(false)
    }, [])

    const login = (newToken: string, newUserId: number, newUser: User) => {
        localStorage.setItem('access_token', newToken)
        localStorage.setItem('user_id', String(newUserId))
        localStorage.setItem('user_data', JSON.stringify(newUser))
        setToken(newToken)
        setUserId(newUserId)
        setUser(newUser)
        setIsAuthenticated(true)
    }

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_data')
        setToken(null)
        setUserId(null)
        setUser(null)
        setIsAuthenticated(false)
    }

    const adminLogin = (newAdminToken: string) => {
        localStorage.setItem('admin_token', newAdminToken)
        setAdminToken(newAdminToken)
        setIsAdmin(true)
    }

    const adminLogout = () => {
        localStorage.removeItem('admin_token')
        setAdminToken(null)
        setIsAdmin(false)
    }

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates }
            setUser(updatedUser)
            localStorage.setItem('user_data', JSON.stringify(updatedUser))
        }
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userId,
            user,
            token,
            isAdmin,
            adminToken,
            login,
            logout,
            adminLogin,
            adminLogout,
            updateUser,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
