/**
 * Claim Submission with Location
 * ==============================
 * Captures current location and submits claim with location-based fraud detection
 */

import React, { useState } from 'react'
import { MapPin, Loader2, AlertCircle, CheckCircle2, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useToast } from '@/hooks/use-toast'
import { claimsApi } from '@/api/claims'
import type { Claim } from '@/types/api'

interface ClaimWithLocationProps {
    triggerId: number
    onSuccess: (claim: Claim) => void
    onError?: (error: string) => void
    disabled?: boolean
}

const LOCATION_RISK_DESCRIPTIONS: Record<string, {
    title: string
    icon: React.ReactNode
    description: string
    color: string
}> = {
    nearby: {
        title: '✓ Safe Location',
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        description: 'You are within 3km of the event location (low fraud risk)',
        color: 'border-green-200 bg-green-50'
    },
    moderate: {
        title: '⚠ Moderate Distance',
        icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
        description: 'You are 3-15km away (acceptable for gig workers)',
        color: 'border-amber-200 bg-amber-50'
    },
    far: {
        title: '✗ Suspicious Distance',
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        description: 'You are 15+km away (higher fraud risk - claim will be manually reviewed)',
        color: 'border-red-200 bg-red-50'
    }
}

export const ClaimWithLocation: React.FC<ClaimWithLocationProps> = ({
    triggerId,
    onSuccess,
    onError,
    disabled = false
}) => {
    const { location, loading: geoLoading, error: geoError, getLocation, clearError: clearGeoError } = useGeolocation()
    const { toast } = useToast()
    const [submitting, setSubmitting] = useState(false)
    const [locationRisk, setLocationRisk] = useState<string | null>(null)
    const [showLocationPreview, setShowLocationPreview] = useState(false)

    const handleCaptureLocation = async () => {
        clearGeoError()
        setLocationRisk(null)

        toast({
            title: "📍 Capturing Location",
            description: "Please wait while we access your device location...",
            duration: 2000
        })

        const loc = await getLocation()

        if (!loc) {
            toast({
                variant: "destructive",
                title: geoError?.message.split('\n')[0] || "Location Error",
                description: geoError?.message.split('\n').slice(1).join(' ') || "Could not get your location",
                duration: 5000
            })
            onError?.(geoError?.message || 'Failed to get location')
            return
        }

        toast({
            title: "✓ Location Captured",
            description: `Latitude: ${loc.latitude.toFixed(4)}, Longitude: ${loc.longitude.toFixed(4)}`,
            duration: 3000
        })

        setShowLocationPreview(true)
    }

    const handleSubmitClaim = async () => {
        if (!location) {
            toast({
                variant: "destructive",
                title: "Location Required",
                description: "Please capture your current location before submitting the claim",
                duration: 4000
            })
            return
        }

        setSubmitting(true)

        try {
            toast({
                title: "📤 Submitting Claim",
                description: "Processing your claim with location verification...",
                duration: 3000
            })

            const claim = await claimsApi.submitWithLocation({
                trigger_id: triggerId,
                claim_latitude: location.latitude,
                claim_longitude: location.longitude
            })

            // Determine location risk based on response
            if (claim.location_mismatch_flag) {
                setLocationRisk(claim.location_mismatch_flag)
            }

            toast({
                title: "✓ Claim Submitted Successfully!",
                description: `Claim #${claim.claim_number} has been submitted and is being processed.`,
                duration: 4000
            })

            onSuccess(claim)
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || error.message || 'Failed to submit claim'

            toast({
                variant: "destructive",
                title: "Claim Submission Failed",
                description: errorMsg,
                duration: 5000
            })

            onError?.(errorMsg)
        } finally {
            setSubmitting(false)
        }
    }

    const isLoading = geoLoading || submitting
    const isDisabledState = disabled || isLoading

    return (
        <div className="space-y-4">
            {/* Location Status Section */}
            <div className="glass-card p-4 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-slate-900">Location Verification</span>
                    </div>
                    {location && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>

                <p className="text-sm text-slate-600">
                    We require your current location to process your claim. This helps us detect fraudulent claims and ensure accuracy.
                </p>

                {/* Location Captured Display */}
                {location && showLocationPreview && (
                    <div className="bg-white rounded-lg border border-purple-200 p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs text-slate-600 font-medium">Latitude</p>
                                <p className="text-sm font-mono font-bold text-slate-900">{location.latitude.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-600 font-medium">Longitude</p>
                                <p className="text-sm font-mono font-bold text-slate-900">{location.longitude.toFixed(6)}</p>
                            </div>
                        </div>
                        {location.accuracy && (
                            <div>
                                <p className="text-xs text-slate-600 font-medium">Accuracy</p>
                                <p className="text-sm text-slate-700">±{location.accuracy.toFixed(0)} meters</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Geolocation Error Display */}
                {geoError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                        <div className="flex gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900 text-sm">{geoError.message.split('\n')[0]}</p>
                                <p className="text-sm text-red-700 mt-1">
                                    {geoError.message.split('\n').slice(1).join(' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                    {!location ? (
                        <Button
                            onClick={handleCaptureLocation}
                            disabled={isDisabledState}
                            className="flex-1 gap-2"
                            variant="default"
                        >
                            {geoLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Capturing...
                                </>
                            ) : (
                                <>
                                    <Navigation className="h-4 w-4" />
                                    Capture My Location
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleCaptureLocation}
                            disabled={isDisabledState}
                            variant="outline"
                            className="flex-1 gap-2"
                        >
                            <Navigation className="h-4 w-4" />
                            Recapture Location
                        </Button>
                    )}
                </div>
            </div>

            {/* Location Risk Assessment */}
            {locationRisk && LOCATION_RISK_DESCRIPTIONS[locationRisk] && (
                <div className={`glass-card p-4 border ${LOCATION_RISK_DESCRIPTIONS[locationRisk].color} space-y-2`}>
                    <div className="flex items-start gap-3">
                        {LOCATION_RISK_DESCRIPTIONS[locationRisk].icon}
                        <div>
                            <p className="font-semibold text-slate-900">
                                {LOCATION_RISK_DESCRIPTIONS[locationRisk].title}
                            </p>
                            <p className="text-sm text-slate-700 mt-1">
                                {LOCATION_RISK_DESCRIPTIONS[locationRisk].description}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            {location && (
                <Button
                    onClick={handleSubmitClaim}
                    disabled={isDisabledState}
                    className="w-full gap-2"
                    size="lg"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Submitting Claim...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-5 w-5" />
                            Submit Claim
                        </>
                    )}
                </Button>
            )}

            {/* Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-900">📍 Why We Need Your Location:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li>✓ Verify you're at the affected trigger location</li>
                    <li>✓ Detect fraudulent claims filed from distant locations</li>
                    <li>✓ Ensure claim accuracy for parametric insurance</li>
                    <li>✓ Comply with insurance regulations</li>
                </ul>
            </div>
        </div>
    )
}
