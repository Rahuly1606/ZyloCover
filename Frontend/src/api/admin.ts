// Admin API endpoints - Real-time KPI dashboard
import { apiClient } from './client'
import type { AdminDashboardResponse } from '../types/api'

export const adminApi = {
    /**
     * Get comprehensive admin dashboard with all KPIs
     * Returns: financial metrics, operational metrics, geographic analysis, risk analysis
     */
    getAnalytics: async (): Promise<AdminDashboardResponse> => {
        return apiClient.get('/admin/analytics')
    },

    /**
     * Legacy dashboard endpoint (for compatibility)
     */
    getDashboard: async (): Promise<AdminDashboardResponse> => {
        return apiClient.get('/admin/dashboard')
    }
}