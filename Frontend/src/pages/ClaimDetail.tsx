import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/common/Button'
import { StatusBadge, LoadingSpinner, EmptyState } from '@/components/common'
import { claimsService } from '@/services/claimsService'
import { formatters } from '@/utils/formatters'

interface FraudDetail {
  layer: string
  description: string
  risk_score: number
  status: string
}

interface ClaimDetail {
  id: number
  policy_id: number
  trigger_type: string
  status: string
  claimed_amount: number
  approved_amount?: number
  created_at: string
  paid_at?: string
  fraud_score: number
  fraud_details?: FraudDetail[]
}

export const ClaimDetail = () => {
  const { claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedFraudLayer, setExpandedFraudLayer] = useState<string | null>(null)

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const result = await claimsService.getClaimById(parseInt(claimId as string))
        setClaim(result?.data)
      } catch (err) {
        console.error('Failed to load claim:', err)
      } finally {
        setLoading(false)
      }
    }
    if (claimId) fetchClaim()
  }, [claimId])

  if (loading) return <LoadingSpinner fullHeight />
  if (!claim) return <EmptyState title="Claim Not Found" description="This claim doesn't exist." icon={<XCircle className="h-10 w-10" />} />

  const riskColor = formatters.riskColorClass(claim.fraud_score * 100)
  const basePayout = claim.claimed_amount
  const fraudDeduction = claim.approved_amount ? basePayout - claim.approved_amount : 0
  const finalPayout = claim.approved_amount || basePayout

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 mb-20 md:mb-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Claim #{claim.id}</h1>
              <p className="text-gray-600 mt-2">Policy #{claim.policy_id}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={claim.status} />
              <Button variant="secondary" onClick={() => navigate('/claims')}>
                Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Claim Details */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Claim Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Trigger Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{claim.trigger_type.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-semibold text-gray-900">{formatters.dateTime(claim.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900 capitalize">{claim.status}</p>
                  </div>
                  {claim.paid_at && (
                    <div>
                      <p className="text-sm text-gray-600">Paid On</p>
                      <p className="font-semibold text-gray-900">{formatters.dateTime(claim.paid_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payout Calculation */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payout Calculation</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Base Claimed Amount</span>
                    <span className="font-semibold">{formatters.currency(basePayout)}</span>
                  </div>
                  {fraudDeduction > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Fraud Deduction</span>
                      <span className="font-semibold text-red-600">-{formatters.currency(fraudDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 bg-purple-50 px-3 py-2 rounded">
                    <span className="font-bold text-gray-900">Final Payout</span>
                    <span className="font-bold text-purple-600 text-lg">{formatters.currency(finalPayout)}</span>
                  </div>
                </div>
              </div>

              {/* Fraud Analysis */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Fraud Analysis</h2>
                <div className={`mb-6 p-4 rounded-lg ${
                  claim.fraud_score < 0.3 ? 'bg-green-50 border border-green-200' :
                  claim.fraud_score < 0.7 ? 'bg-amber-50 border border-amber-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Fraud Score</p>
                      <p className={`text-3xl font-bold ${riskColor}`}>
                        {(claim.fraud_score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className={`text-5xl ${
                      claim.fraud_score < 0.3 ? 'text-green-600' :
                      claim.fraud_score < 0.7 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {claim.fraud_score < 0.3 ? <CheckCircle2 className="h-10 w-10" /> : claim.fraud_score < 0.7 ? <AlertTriangle className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
                    </div>
                  </div>
                </div>

                {/* Fraud Layers */}
                <div className="space-y-2">
                  {(claim.fraud_details || []).map((layer, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFraudLayer(
                          expandedFraudLayer === layer.layer ? null : layer.layer
                        )}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{layer.layer}</p>
                          <p className="text-xs text-gray-600 mt-1">{layer.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-bold ${riskColor}`}>
                            {(layer.risk_score * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">{layer.status}</p>
                        </div>
                        <span className="text-gray-400 ml-4">
                          {expandedFraudLayer === layer.layer ? '▼' : '▶'}
                        </span>
                      </button>
                      {expandedFraudLayer === layer.layer && (
                        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
                          <p>Risk Assessment: {layer.description}</p>
                          <p className="mt-2">Score: {(layer.risk_score * 100).toFixed(1)}% | Status: {layer.status}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6 space-y-4">
                <div className="text-center pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Claim Amount</p>
                  <p className="text-3xl font-bold text-gray-900">{formatters.currency(claim.claimed_amount)}</p>
                </div>

                <div className="text-center pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Approved Payout</p>
                  <p className="text-2xl font-bold text-purple-600">{formatters.currency(finalPayout)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Quick Info</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Claim ID:</span>
                      <span className="font-mono font-semibold">#{claim.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Policy ID:</span>
                      <span className="font-mono font-semibold">#{claim.policy_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-semibold capitalize">{claim.status}</span>
                    </div>
                  </div>
                </div>

                <Button variant="primary" fullWidth className="mt-6">
                  Download Receipt
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
