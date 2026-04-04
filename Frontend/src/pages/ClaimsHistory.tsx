import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { claimsApi } from '@/api/claims'
import type { Claim, FraudAudit } from '@/types/api'
import { toast } from 'sonner'
import { 
    Loader2, 
    AlertCircle, 
    CheckCircle,
    ClipboardList,
    ChevronDown,
    TrendingUp,
    Eye,
    CloudRain,
    Thermometer,
    Wind,
    Waves,
    Power,
    HelpCircle
} from 'lucide-react'

export const ClaimsHistory: React.FC = () => {
    const [loading, setLoading] = useState(true)
    const [claims, setClaims] = useState<Claim[]>([])
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
    const [auditTrail, setAuditTrail] = useState<FraudAudit | null>(null)
    const [loadingAudit, setLoadingAudit] = useState(false)
    const [showAuditDialog, setShowAuditDialog] = useState(false)

    useEffect(() => {
        const loadClaims = async () => {
            try {
                setLoading(true)
                const data = await claimsApi.getAll()
                // Sort by date descending
                setClaims(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
            } catch (error) {
                toast.error('Failed to load claims')
            } finally {
                setLoading(false)
            }
        }
        loadClaims()
    }, [])

    const handleViewAudit = async (claim: Claim) => {
        try {
            setSelectedClaim(claim)
            setLoadingAudit(true)
            const audit = await claimsApi.getAudit(claim.id)
            setAuditTrail(audit)
            setShowAuditDialog(true)
        } catch (error) {
            toast.error('Failed to load fraud audit trail')
        } finally {
            setLoadingAudit(false)
        }
    }

    const getStatusIcon = (status: string) => {
        if (status === 'paid') {
            return <CheckCircle className="w-5 h-5 text-green-600" />
        } else if (status === 'rejected') {
            return <AlertCircle className="w-5 h-5 text-red-600" />
        }
        return <ClipboardList className="w-5 h-5 text-blue-600" />
    }

    const getStatusBadge = (status: string) => {
        if (status === 'paid') {
            return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>
        } else if (status === 'rejected') {
            return <Badge variant="destructive">Rejected</Badge>
        } else if (status === 'flagged') {
            return <Badge variant="secondary">Flagged - Review Pending</Badge>
        }
        return <Badge variant="outline">{status}</Badge>
    }

    const getFraudScoreBadge = (score: number) => {
        if (score < 40) {
            return <Badge className="bg-green-500 hover:bg-green-600">Low Risk ({score})</Badge>
        } else if (score < 70) {
            return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium Risk ({score})</Badge>
        }
        return <Badge className="bg-red-500 hover:bg-red-600">High Risk ({score})</Badge>
    }

    const getFraudDecisionLabel = (decision: string) => {
        if (decision === 'approved') return 'Approved'
        if (decision === 'rejected') return 'Rejected'
        return 'Flagged'
    }

    const getTriggerIcon = (triggerType: string) => {
        const icons: Record<string, React.ReactNode> = {
            rain: <CloudRain className="h-5 w-5" />,
            heat: <Thermometer className="h-5 w-5" />,
            aqi: <Wind className="h-5 w-5" />,
            wind: <Wind className="h-5 w-5" />,
            flood: <Waves className="h-5 w-5" />,
            blackout: <Power className="h-5 w-5" />,
        }
        return icons[triggerType] || <HelpCircle className="h-5 w-5" />
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <ClipboardList className="w-8 h-8 text-blue-600" />
                        <h1 className="text-4xl font-bold text-slate-900">Claims History</h1>
                    </div>
                    <p className="text-lg text-slate-600">
                        View all your claims with complete fraud detection transparency
                    </p>
                </div>

                {claims.length === 0 ? (
                    <Card className="border-2 border-dashed">
                        <CardContent className="pt-12 pb-12 text-center">
                            <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Claims Yet</h3>
                            <p className="text-slate-600">
                                When environmental triggers affect your work area, automatic claims will appear here
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-1">Total Claims</p>
                                    <p className="text-3xl font-bold text-slate-900">{claims.length}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-1">Paid</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {claims.filter(c => c.status === 'paid').length}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-1">Total Payout</p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        ₹{claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0).toFixed(0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="text-sm text-slate-600 mb-1">Approval Rate</p>
                                    <p className="text-3xl font-bold text-purple-600">
                                        {Math.round((claims.filter(c => c.status === 'paid').length / claims.length) * 100)}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Claims List */}
                        <div className="space-y-4">
                            {claims.map((claim) => (
                                <Card key={claim.id} className="hover:shadow-lg transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            {/* Claim Icon */}
                                            <Avatar className="h-12 w-12 flex-shrink-0">
                                                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                                                    {getTriggerIcon(claim.trigger_type)}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Claim Details */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 text-lg">
                                                            {claim.claim_number}
                                                        </h3>
                                                        <p className="text-sm text-slate-600">
                                                            {new Date(claim.created_at).toLocaleDateString()} at{' '}
                                                            {new Date(claim.created_at).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    {getStatusBadge(claim.status)}
                                                </div>

                                                {/* Trigger & Severity Info */}
                                                <div className="bg-slate-50 rounded-lg p-3 mb-3 space-y-2">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-slate-600">Trigger Type</p>
                                                            <p className="font-semibold text-slate-900 capitalize">
                                                                {claim.trigger_type}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-600">Trigger Value</p>
                                                            <p className="font-semibold text-slate-900">
                                                                {claim.trigger_measured_value.toFixed(1)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-600">Severity</p>
                                                            <p className="font-semibold text-slate-900 capitalize">
                                                                {claim.severity_band} ({(claim.severity_multiplier * 100).toFixed(0)}%)
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-600">Amount</p>
                                                            <p className="font-semibold text-slate-900">
                                                                ₹{claim.amount.toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fraud Score & Decision */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div>
                                                            <p className="text-xs text-slate-600 mb-1">Fraud Analysis</p>
                                                            {getFraudScoreBadge(claim.fraud_score)}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-600 mb-1">Decision</p>
                                                            <Badge variant="outline">
                                                                {getFraudDecisionLabel(claim.fraud_decision)}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* View Audit Button */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewAudit(claim)}
                                                        className="gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View Audit Trail
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fraud Audit Dialog */}
                <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Fraud Audit Trail - {selectedClaim?.claim_number}
                            </DialogTitle>
                        </DialogHeader>

                        {loadingAudit ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                            </div>
                        ) : auditTrail ? (
                            <div className="space-y-6">
                                {/* Overall Score & Decision */}
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-600 mb-1">Fraud Score</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-blue-600">
                                                    {auditTrail.fraud_score}
                                                </span>
                                                <span className="text-slate-600">/100</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600 mb-1">Decision</p>
                                            <p className="text-xl font-bold capitalize">
                                                {auditTrail.decision === 'approved' && (
                                                    <span className="text-green-600">APPROVED</span>
                                                )}
                                                {auditTrail.decision === 'flagged' && (
                                                    <span className="text-yellow-600">FLAGGED</span>
                                                )}
                                                {auditTrail.decision === 'rejected' && (
                                                    <span className="text-red-600">REJECTED</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Scoring Criteria Explanation */}
                                <Alert>
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertDescription className="text-sm">
                                        <strong>Decision Criteria:</strong> Score 0-39 = Approved (auto-pay), 40-69 = Flagged (admin review), 70+ = Rejected (fraud flag recorded)
                                    </AlertDescription>
                                </Alert>

                                {/* 5 Layers Breakdown */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-slate-900 text-lg">Fraud Detection Layers</h3>
                                    {auditTrail.layers.map((layer, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 space-y-2">
                                            {/* Layer Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-semibold">
                                                        Layer {layer.layer}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{layer.name}</p>
                                                        <p className="text-sm text-slate-600">{layer.reason}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {layer.status === 'passed' && (
                                                        <Badge className="bg-green-500 hover:bg-green-600">Pass</Badge>
                                                    )}
                                                    {layer.status === 'warning' && (
                                                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>
                                                    )}
                                                    {layer.status === 'failed' && (
                                                        <Badge className="bg-red-500 hover:bg-red-600">Fail</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score Contribution */}
                                            {layer.score > 0 && (
                                                <div className="bg-red-50 rounded p-2 flex items-center justify-between">
                                                    <span className="text-sm text-red-700">Points added by this layer:</span>
                                                    <span className="text-lg font-bold text-red-600">+{layer.score}</span>
                                                </div>
                                            )}
                                            {layer.score === 0 && (
                                                <div className="bg-green-50 rounded p-2 flex items-center justify-between">
                                                    <span className="text-sm text-green-700">Clean check:</span>
                                                    <span className="text-lg font-bold text-green-600">+0</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Explanation */}
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="pt-4">
                                        <h4 className="font-semibold text-blue-900 mb-2">Understanding These Checks</h4>
                                        <ul className="space-y-2 text-sm text-blue-800">
                                            <li>
                                                <strong>Layer 1 - Duplicate Check:</strong> Prevents claiming for the same trigger twice in 24 hours
                                            </li>
                                            <li>
                                                <strong>Layer 2 - Policy Age:</strong> Detects adverse selection (buying policies right before known weather)
                                            </li>
                                            <li>
                                                <strong>Layer 3 - GPS Zone:</strong> Verifies your location matches the trigger event (within 15km)
                                            </li>
                                            <li>
                                                <strong>Layer 4 - Frequency:</strong> Detects pattern abuse (claiming more than once per week)
                                            </li>
                                            <li>
                                                <strong>Layer 5 - Anomaly:</strong> Composite check for new accounts, unusual patterns, rapid claims
                                            </li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                {/* Close Button */}
                                <Button onClick={() => setShowAuditDialog(false)} className="w-full">
                                    Close
                                </Button>
                            </div>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
