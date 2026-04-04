// Trigger API endpoints
import { apiClient } from './client'
import type { Trigger } from '../types/api'

export const triggersApi = {
    getActive: async (): Promise<Trigger[]> => {
        return apiClient.get('/trigger/active')
    }
}