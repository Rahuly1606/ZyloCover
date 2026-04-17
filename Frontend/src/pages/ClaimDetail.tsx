import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, XCircle, MapPin } from 'lucide-react'
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

interface AIFraudExplanation {
  decision: 'approved' | 'flagged' | 'rejected'
  decision_rationale?: {
    risk_factors?: Array<{
      name: string
      impact_percentage: number
      direction: 'positive' | 'negative'
    }>
  }
  fraud_probability: number
  model_confidence: number
  detection_method: string  // 'ai_xgboost' or 'rules_engine'
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
  fraud_explanation?: AIFraudExplanation
  // Location fields
  claim_latitude?: number
  claim_longitude?: number
  location_distance_km?: number
  location_mismatch_flag?: 'nearby' | 'moderate' | 'far' | null
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
        setClaim(result as ClaimDetail)
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

              {/* Location Analysis */}
              {claim.claim_latitude && claim.claim_longitude && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    Location Verification
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Claim Latitude</p>
                      <p className="font-mono font-semibold text-gray-900">{claim.claim_latitude.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Claim Longitude</p>
                      <p className="font-mono font-semibold text-gray-900">{claim.claim_longitude.toFixed(6)}</p>
                    </div>
                  </div>

                  {claim.location_distance_km !== undefined && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">Distance from Base Location</p>
                        <p className="font-bold text-gray-900">{claim.location_distance_km.toFixed(2)} km</p>
                      </div>
                    </div>
                  )}

                  {claim.location_mismatch_flag && (
                    <div className={`p-4 rounded-lg border-2 ${claim.location_mismatch_flag === 'nearby'
                      ? 'bg-green-50 border-green-300'
                      : claim.location_mismatch_flag === 'moderate'
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-red-50 border-red-300'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {claim.location_mismatch_flag === 'nearby' ? '✓' :
                            claim.location_mismatch_flag === 'moderate' ? '⚠' : '✗'}
                        </div>
                        <div>
                          <p className={`font-semibold ${claim.location_mismatch_flag === 'nearby'
                            ? 'text-green-900'
                            : claim.location_mismatch_flag === 'moderate'
                              ? 'text-amber-900'
                              : 'text-red-900'
                            }`}>
                            {claim.location_mismatch_flag === 'nearby'
                              ? 'Claim Submitted from Safe Location'
                              : claim.location_mismatch_flag === 'moderate'
                                ? 'Claim Submitted from Moderate Distance'
                                : 'Claim Submitted from Suspicious Distance'}
                          </p>
                          <p className={`text-sm mt-1 ${claim.location_mismatch_flag === 'nearby'
                            ? 'text-green-700'
                            : claim.location_mismatch_flag === 'moderate'
                              ? 'text-amber-700'
                              : 'text-red-700'
                            }`}>
                            {claim.location_mismatch_flag === 'nearby'
                              ? 'User is within 3km of the disaster location (Low fraud risk). This indicates the user was at the affected location when the trigger event occurred.'
                              : claim.location_mismatch_flag === 'moderate'
                                ? 'User is 3-15km away from the disaster location. This is acceptable for gig workers who may be working in the broader area. Standard verification applies.'
                                : 'User is 15+km away from the disaster location. This raises fraud concerns and requires manual review. The claim has been flagged for additional verification.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fraud Analysis */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Fraud Analysis</h2>
                <div className={`mb-6 p-4 rounded-lg ${claim.fraud_score < 0.3 ? 'bg-green-50 border border-green-200' :
                  claim.fraud_score < 0.7 ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Fraud Score</p>
                      <p className={`text-3xl font-bold ${riskColor}`}>
                        {(claim.fraud_score * 100).toFixed(1)}%
                      </p>
                      {claim.fraud_explanation && (
                        <p className="text-xs text-gray-500 mt-2">
                          Model: {claim.fraud_explanation.detection_method === 'ai_xgboost' ? 'AI (XGBoost)' : 'Rules Engine'} |
                          Confidence: {(claim.fraud_explanation.model_confidence * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                    <div className={`text-5xl ${claim.fraud_score < 0.3 ? 'text-green-600' :
                      claim.fraud_score < 0.7 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                      {claim.fraud_score < 0.3 ? <CheckCircle2 className="h-10 w-10" /> : claim.fraud_score < 0.7 ? <AlertTriangle className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
                    </div>
                  </div>
                </div>

                {/* AI SHAP Explainability */}
                {claim.fraud_explanation?.decision_rationale?.risk_factors && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">Top Risk Factors (SHAP)</h3>
                    <div className="space-y-2">
                      {claim.fraud_explanation.decision_rationale.risk_factors.slice(0, 5).map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{factor.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded overflow-hidden">
                              <div
                                className={`h-full ${factor.direction === 'negative' ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.abs(factor.impact_percentage)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold w-12 text-right ${factor.direction === 'negative' ? 'text-red-600' : 'text-green-600'
                              }`}>
                              {factor.direction === 'negative' ? '-' : '+'}{Math.abs(factor.impact_percentage).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-blue-700 mt-3">
                      Decision: <span className="font-semibold">{claim.fraud_explanation.decision.toUpperCase()}</span>
                    </p>
                  </div>
                )}

                {/* Fraud Layers */}
                {claim.fraud_details && (
                  <div className="space-y-2">
                    {claim.fraud_details.map((layer, idx) => (
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
                )}
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
