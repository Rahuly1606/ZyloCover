// API Client Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiError {
    status: number
    message: string
    detail?: string
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private getHeaders(): HeadersInit {
        const token = localStorage.getItem('access_token')
        const adminToken = localStorage.getItem('admin_token')
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(adminToken && { 'X-Admin-Token': adminToken })
        }
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers
                }
            })

            if (!response.ok) {
                const error: ApiError = {
                    status: response.status,
                    message: `HTTP ${response.status}`
                }

                try {
                    const data = await response.json()
                    error.detail = data.detail || data.message
                } catch (e) {
                    // Response wasn't JSON
                    error.detail = response.statusText
                }

                // Log error for debugging
                console.error(`API Error [${response.status}]:`, {
                    endpoint,
                    detail: error.detail,
                    method: options.method || 'GET'
                })

                throw error
            }

            return await response.json()
        } catch (error) {
            if (error instanceof ApiError) throw error
            
            const networkError = {
                status: 0,
                message: 'Network error',
                detail: error instanceof Error ? error.message : String(error)
            } as ApiError

            console.error('Network Error:', networkError)
            throw networkError
        }
    }

    get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' })
    }

    post<T>(endpoint: string, body?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        })
    }

    put<T>(endpoint: string, body?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined
        })
    }

    delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient(API_BASE_URL)
