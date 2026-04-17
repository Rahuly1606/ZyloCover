// API Client Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiError {
    status: number
    message: string
    detail?: string
}

function isApiError(value: unknown): value is ApiError {
    return (
        typeof value === 'object' &&
        value !== null &&
        'status' in value &&
        'message' in value
    )
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private getHeaders(): HeadersInit {
        // Clean up: Remove conflicting tokens from other projects
        const conflictingKeys = ['token', 'authState', 'faceattend_auth_token', 'faceattend_user', 'user', 'userId', 'dt_solved'];
        conflictingKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.warn(`[ZyloCover] Removing conflicting key: ${key}`);
                localStorage.removeItem(key);
            }
        });

        // Fix adminToken → admin_token if exists
        if (localStorage.getItem('adminToken') && !localStorage.getItem('admin_token')) {
            const token = localStorage.getItem('adminToken');
            if (token) {
                localStorage.setItem('admin_token', token);
                localStorage.removeItem('adminToken');
                console.log('[ZyloCover] Fixed: adminToken → admin_token');
            }
        }

        const token = localStorage.getItem('access_token');
        const adminToken = localStorage.getItem('admin_token');
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
            console.log('[ZyloCover Auth]', {
                hasAccessToken: !!token,
                hasAdminToken: !!adminToken,
                accessTokenPreview: token ? token.substring(0, 20) + '...' : null,
                adminTokenPreview: adminToken ? adminToken.substring(0, 20) + '...' : null
            });
        }
        
        return {
            'Content-Type': 'application/json',
            ...(adminToken && { 'X-Admin-Token': adminToken }),
            ...(token && !adminToken && { Authorization: `Bearer ${token}` }),
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
                    method: options.method || 'GET',
                    hasToken: !!localStorage.getItem('access_token'),
                    hasAdminToken: !!localStorage.getItem('admin_token')
                })

                // Handle 401 Unauthorized
                if (response.status === 401) {
                    console.error('[ZyloCover] 401 Unauthorized - Token may be expired or invalid');
                    console.error('[ZyloCover] Please clear localStorage and login again');
                    console.error('[ZyloCover] Or visit: http://localhost:5173/fix-storage.html');
                }

                throw error
            }

            return await response.json()
        } catch (error) {
            if (isApiError(error)) throw error

            const networkError = {
                status: 0,
                message: 'Network error',
                detail: error instanceof Error ? error.message : String(error)
            } as ApiError

            console.error('Network Error:', networkError)
            throw networkError
        }
    }

    get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        let url = endpoint
        if (params) {
            const queryParams = new URLSearchParams()
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(v => queryParams.append(key, String(v)))
                    } else {
                        queryParams.set(key, String(value))
                    }
                }
            })
            const queryString = queryParams.toString()
            if (queryString) url = `${endpoint}?${queryString}`
        }
        return this.request<T>(url, { method: 'GET' })
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
