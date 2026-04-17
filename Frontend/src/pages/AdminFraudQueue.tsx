import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, FileText, XCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Button } from '@/components/common/Button'
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/common'
import { adminService } from '@/services/adminService'
import { formatters } from '@/utils/formatters'

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

export const AdminFraudQueue = () => {
  const [claims, setClaims] = useState<FlaggedClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaim, setSelectedClaim] = useState<FlaggedClaim | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const result = await adminService.getFlaggedClaims(1, 50)
        setClaims((result || []) as FlaggedClaim[])
      } catch (err) {
        console.error('Failed to load flagged claims:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchClaims()
  }, [])

  const handleApprove = async (claimId: number) => {
    setActionLoading(true)
    try {
      await adminService.approveFlaggedClaim(claimId)
      setClaims(claims.filter(c => c.claim_id !== claimId))
      setSelectedClaim(null)
    } catch (err) {
      console.error('Failed to approve:', err)
      alert('Failed to approve claim')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (claimId: number) => {
    setActionLoading(true)
    try {
      await adminService.rejectFlaggedClaim(claimId)
      setClaims(claims.filter(c => c.claim_id !== claimId))
      setSelectedClaim(null)
    } catch (err) {
      console.error('Failed to reject:', err)
      alert('Failed to reject claim')
    } finally {
      setActionLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'text-red-600'
    if (level === 'medium') return 'text-amber-600'
    return 'text-yellow-600'
  }

  if (loading) return <LoadingSpinner fullHeight />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Fraud Queue</h1>
          <p className="text-gray-600 mb-8">Review and approve/reject flagged claims ({claims.length} pending)</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-1">
              {claims.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {claims.map(claim => (
                    <button
                      key={claim.id}
                      onClick={() => setSelectedClaim(claim)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedClaim?.id === claim.id
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-900">Claim #{claim.claim_id}</p>
                        <div className={`text-xs font-bold px-2 py-1 rounded ${claim.risk_level === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                          }`}>
                          {claim.risk_level.toUpperCase()}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{formatters.dateTime(claim.created_at)}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Flagged Claims"
                  description="All claims have been reviewed."
                  icon={<CheckCircle2 className="h-10 w-10" />}
                />
              )}
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedClaim ? (
                <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-6">
                  {/* Header */}
                  <div className="pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Claim #{selectedClaim.claim_id}</h3>
                        <p className="text-sm text-gray-600">Policy #{selectedClaim.policy_id}</p>
                      </div>
                      <div className={`text-3xl font-bold ${getRiskColor(selectedClaim.risk_level)}`}>
                        {(selectedClaim.fraud_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className={`p-4 rounded-lg border-2 ${selectedClaim.risk_level === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                    }`}>
                    <h4 className={`font-bold mb-3 ${selectedClaim.risk_level === 'high' ? 'text-red-900' : 'text-amber-900'
                      } flex items-center gap-2`}>
                      <AlertTriangle className="h-4 w-4" />
                      Risk Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Risk Level:</span> {selectedClaim.risk_level.toUpperCase()}</p>
                      <p><span className="font-semibold">Fraud Score:</span> {(selectedClaim.fraud_score * 100).toFixed(1)}%</p>
                      <p><span className="font-semibold">Flagged:</span> {formatters.dateTime(selectedClaim.created_at)}</p>
                    </div>
                  </div>

                  {/* Fraud Flags */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3">Detection Flags</h4>
                    <div className="space-y-2">
                      {selectedClaim.flags.length > 0 ? (
                        selectedClaim.flags.map((flag, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{flag}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-sm">No specific flags detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-900">
                      <span className="font-semibold">Review Notes:</span> Carefully review all fraud indicators. Approve if legitimate or reject if fraudulent. Your decision is recorded in the audit log.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleApprove(selectedClaim.claim_id)}
                      isLoading={actionLoading}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve Claim
                    </Button>
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={() => handleReject(selectedClaim.claim_id)}
                      isLoading={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Claim
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">Select a claim to review</p>
                  <p className="text-gray-600">
                    Choose a flagged claim from the list to view details and make a decision.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
