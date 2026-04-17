import { apiClient } from '../api/client'

interface AdminStats {
  total_workers: number
  active_policies: number
  total_claims: number
  total_payouts: number
  claims_pending: number
  flagged_claims: number
  loss_ratio: number
  avg_processing_time: number
}

interface ClaimAlert {
  id: number
  claim_id: number
  type: string
  risk_level: string
  created_at: string
}

interface AuditLog {
  id: number
  action: string
  entity_type: string
  entity_id: number
  user_id: number
  old_value?: string
  new_value?: string
  created_at: string
}

interface FlaggedClaim {
  id: number
  claim_id: number
  policy_id: number
  fraud_score: number
  risk_level: string
  flags: string[]
  created_at: string
  status: string
}

export const adminService = {
  // ═══════════════════════════════════════════════════════════════════
  // ANALYTICS & DASHBOARD
  // ═══════════════════════════════════════════════════════════════════

  getDashboard: () =>
    apiClient.get<any>('/admin/dashboard'),

  getAnalytics: () =>
    apiClient.get<any>('/admin/analytics'),

  getForecast: () =>
    apiClient.get<any>('/admin/forecast'),

  // ═══════════════════════════════════════════════════════════════════
  // FRAUD QUEUE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  getFlaggedClaims: (page = 1, size = 20, riskLevel?: string) =>
    apiClient.get<FlaggedClaim[]>('/admin/fraud-queue',
      { page, size, ...(riskLevel && { risk_level: riskLevel }) }
    ),

  approveFlaggedClaim: (claimId: number, notes?: string) =>
    apiClient.put(`/admin/fraud-queue/${claimId}/approve`, { notes }),

  rejectFlaggedClaim: (claimId: number, notes?: string) =>
    apiClient.put(`/admin/fraud-queue/${claimId}/reject`, { notes }),

  // ═══════════════════════════════════════════════════════════════════
  // USER APPROVAL & VERIFICATION
  // ═══════════════════════════════════════════════════════════════════

  getPendingApprovals: (page = 1, size = 20) =>
    apiClient.get('/admin/pending-approvals', { page, size }),

  getUserFullProfile: (userId: number) =>
    apiClient.get(`/admin/users/${userId}/full-profile`),

  approveUserVerification: (userId: number, decision: 'approve' | 'reject', notes?: string) =>
    apiClient.put(`/admin/users/${userId}/approve-verification`, { decision, notes }),

  getClaimFullDetails: (claimId: number) =>
    apiClient.get(`/admin/claims/${claimId}/full-details`),

  // ═══════════════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  getUsers: (page = 1, size = 20, search?: string, status?: string) =>
    apiClient.get('/admin/users',
      { page, size, ...(search && { search }), ...(status && { status }) }
    ),

  getUserDetails: (userId: number) =>
    apiClient.get(`/admin/users/${userId}`),

  blacklistUser: (userId: number, reason?: string) =>
    apiClient.put(`/admin/users/${userId}/blacklist`, { reason }),

  whitelistUser: (userId: number) =>
    apiClient.put(`/admin/users/${userId}/whitelist`, {}),

  getUserClaims: (userId: number, page = 1, size = 10) =>
    apiClient.get(`/admin/users/${userId}/claims`, { page, size }),

  // ═══════════════════════════════════════════════════════════════════
  // CLAIMS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  getClaims: (page = 1, size = 20, status?: string, triggerType?: string) =>
    apiClient.get('/admin/claims',
      { page, size, ...(status && { status }), ...(triggerType && { trigger_type: triggerType }) }
    ),

  getClaimDetails: (claimId: number) =>
    apiClient.get(`/admin/claims/${claimId}`),

  reviewClaim: (claimId: number, action: string, notes: string) =>
    apiClient.put(`/admin/claims/${claimId}/review`, { action, notes }),

  // ═══════════════════════════════════════════════════════════════════
  // POLICY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  getPolicies: (page = 1, size = 20, status?: string) =>
    apiClient.get('/admin/policies',
      { page, size, ...(status && { status }) }
    ),

  getPolicyDetails: (policyId: number) =>
    apiClient.get(`/admin/policies/${policyId}`),

  // ═══════════════════════════════════════════════════════════════════
  // PAYOUT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  getPayouts: (page = 1, size = 20, status?: string) =>
    apiClient.get('/admin/payouts',
      { page, size, ...(status && { status }) }
    ),

  getPayoutDetails: (payoutId: number) =>
    apiClient.get(`/admin/payouts/${payoutId}`),

  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  getThresholds: () =>
    apiClient.get('/admin/config/thresholds'),

  updateThresholds: (config: any) =>
    apiClient.put('/admin/config/thresholds', config),

  // ═══════════════════════════════════════════════════════════════════
  // AUDIT LOG
  // ═══════════════════════════════════════════════════════════════════

  getAuditLog: (page = 1, size = 20, action?: string) =>
    apiClient.get<AuditLog[]>('/admin/audit-log',
      { page, size, ...(action && { action }) }
    ),

  // ═══════════════════════════════════════════════════════════════════
  // SIMULATOR
  // ═══════════════════════════════════════════════════════════════════

  simulateTrigger: (data: any) =>
    apiClient.post('/admin/trigger/simulate', data),

  // ═══════════════════════════════════════════════════════════════════
  // LEGACY / STATS
  // ═══════════════════════════════════════════════════════════════════

  getStats: () =>
    apiClient.get<AdminStats>('/admin/stats'),

  getAlerts: (page = 1, size = 10) =>
    apiClient.get<ClaimAlert[]>('/admin/alerts', { page, size }),

  getLossRatio: () =>
    apiClient.get('/admin/analytics'),

  getRiskHeatmap: () =>
    apiClient.get('/admin/analytics'),

  createClaimFromSimulation: (data: any) =>
    apiClient.post('/admin/claims/from-simulation', data)
}
