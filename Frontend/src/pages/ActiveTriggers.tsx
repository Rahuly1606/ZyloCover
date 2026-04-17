/**
 * Active Triggers Page
 * ====================
 * Shows active environmental triggers and allows users to submit claims with location verification
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { ClaimWithLocation } from '@/components/ClaimWithLocation'
import { useToast } from '@/hooks/use-toast'
import { triggersApi } from '@/api/triggers'
import type { TriggerEvent, Claim } from '@/types/api'

interface TriggerWithClaimState extends TriggerEvent {
    isSubmitting?: boolean
    submitted?: boolean
    submitError?: string
}

export const ActiveTriggers = () => {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [triggers, setTriggers] = useState<TriggerWithClaimState[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTrigger, setSelectedTrigger] = useState<number | null>(null)
    const [submittedClaims, setSubmittedClaims] = useState<Map<number, Claim>>(new Map())

    useEffect(() => {
        const fetchTriggers = async () => {
            try {
                const activeTriggers = await triggersApi.getActive()
                setTriggers(activeTriggers)
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Failed to load triggers",
                    description: "Could not fetch active environmental triggers",
                    duration: 4000
                })
            } finally {
                setLoading(false)
            }
        }
        fetchTriggers()
    }, [toast])

    const handleClaimSuccess = (triggerId: number, claim: Claim) => {
        setSubmittedClaims(prev => new Map(prev).set(triggerId, claim))
        setSelectedTrigger(null)

        toast({
            title: "✓ Claim Submitted Successfully",
            description: `Claim #${claim.claim_number} has been submitted and is being processed.`,
            duration: 4000
        })

        // Navigate to claim details after a short delay
        setTimeout(() => {
            navigate(`/claims/${claim.id}`)
        }, 1500)
    }

    const getTriggerEmoji = (type: string) => {
        switch (type) {
            case 'heavy_rain':
                return '🌧️'
            case 'extreme_heat':
                return '🔥'
            case 'high_aqi':
                return '🏭'
            case 'strong_winds':
                return '💨'
            case 'flash_flood':
                return '🌊'
            default:
                return '⚡'
        }
    }

    const getTriggerDescription = (type: string) => {
        switch (type) {
            case 'heavy_rain':
                return 'Heavy rainfall affecting delivery operations'
            case 'extreme_heat':
                return 'Extreme temperature conditions detected'
            case 'high_aqi':
                return 'Poor air quality limiting outdoor work'
            case 'strong_winds':
                return 'Strong winds affecting delivery routes'
            case 'flash_flood':
                return 'Flash flood warning in effect'
            default:
                return 'Environmental event detected'
        }
    }

    if (loading) {
        return (
            <AppShell>
                <div className="flex items-center justify-center min-h-screen">
                    <Clock className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            </AppShell>
        )
    }

    const hasTriggers = triggers.length > 0

    return (
        <AppShell>
            <div className="space-y-6 p-4 pt-6 pb-12">
                {/* Header */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass-card p-5 border border-purple-200"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground">Active Events</p>
                            <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
                                Environmental Triggers
                            </h1>
                            <p className="text-sm text-muted-foreground mt-2">
                                {hasTriggers
                                    ? `${triggers.length} active trigger${triggers.length !== 1 ? 's' : ''} affecting your area`
                                    : 'No active triggers at the moment'}
                            </p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                </motion.div>

                {/* Active Triggers List */}
                {hasTriggers ? (
                    <div className="space-y-3">
                        {triggers.map((trigger, idx) => {
                            const isSubmitted = submittedClaims.has(trigger.id)
                            const isSelected = selectedTrigger === trigger.id
                            const severity = ((trigger.measured_value / trigger.threshold_value - 1) * 100).toFixed(0)

                            return (
                                <motion.div
                                    key={trigger.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass-card border border-orange-300 overflow-hidden"
                                >
                                    {/* Trigger Header */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-orange-50/50 transition-colors"
                                        onClick={() => setSelectedTrigger(isSelected ? null : trigger.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4 flex-1">
                                                <span className="text-4xl">{getTriggerEmoji(trigger.trigger_type)}</span>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-900 capitalize">
                                                        {trigger.trigger_type.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-sm text-slate-600 mt-1">
                                                        {getTriggerDescription(trigger.trigger_type)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(trigger.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badge */}
                                            <div className="text-right">
                                                {isSubmitted ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Claimed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                                        <AlertCircle className="h-3 w-3" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Metrics Row */}
                                        <div className="grid grid-cols-3 gap-3 mt-4">
                                            <div className="bg-white/50 rounded-lg p-2">
                                                <p className="text-xs text-slate-600">Measured Value</p>
                                                <p className="font-bold text-slate-900">{trigger.measured_value.toFixed(1)}</p>
                                            </div>
                                            <div className="bg-white/50 rounded-lg p-2">
                                                <p className="text-xs text-slate-600">Threshold</p>
                                                <p className="font-bold text-slate-900">{trigger.threshold_value.toFixed(1)}</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-2">
                                                <p className="text-xs text-red-700 font-medium">Exceedance</p>
                                                <p className="font-bold text-red-600">+{severity}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Claim Submission Section */}
                                    {isSelected && !isSubmitted && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-orange-200 bg-orange-50/30 p-4"
                                        >
                                            <ClaimWithLocation
                                                triggerId={trigger.id}
                                                onSuccess={(claim) => handleClaimSuccess(trigger.id, claim)}
                                                disabled={isSubmitted}
                                            />
                                        </motion.div>
                                    )}

                                    {/* Submitted Claim Info */}
                                    {isSubmitted && submittedClaims.has(trigger.id) && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            className="border-t border-green-200 bg-green-50 p-4 space-y-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <span className="font-semibold text-green-900">Claim Successfully Submitted</span>
                                            </div>
                                            <p className="text-sm text-green-700">
                                                Claim #{submittedClaims.get(trigger.id)?.claim_number} is being processed
                                            </p>
                                            <button
                                                onClick={() => navigate(`/claims/${submittedClaims.get(trigger.id)?.id}`)}
                                                className="text-sm font-semibold text-green-700 hover:text-green-900 mt-2"
                                            >
                                                View Claim Details →
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    /* No Triggers State */
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="glass-card p-8 border border-blue-200 text-center"
                    >
                        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-semibold text-slate-900 text-lg">No Active Triggers</h3>
                        <p className="text-slate-600 mt-2">
                            Environmental conditions in your area are currently normal.
                            Claims are automatically generated when trigger thresholds are breached.
                        </p>
                    </motion.div>
                )}

                {/* Info Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3"
                >
                    <p className="text-sm font-semibold text-blue-900">📍 How Location Verification Works:</p>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li>✓ <strong>0-3 km (Safe)</strong>: You're at the disaster location - Low fraud risk</li>
                        <li>⚠ <strong>3-15 km (Moderate)</strong>: Acceptable working distance - Standard verification</li>
                        <li>✗ <strong>15+ km (Suspicious)</strong>: Far from disaster - Manual review required</li>
                    </ul>
                    <p className="text-xs text-blue-700 pt-2 border-t border-blue-200">
                        Your location is only used for fraud verification and is never shared with third parties.
                        All claims are processed securely and transparently.
                    </p>
                </motion.div>
            </div>
        </AppShell>
    )
}
