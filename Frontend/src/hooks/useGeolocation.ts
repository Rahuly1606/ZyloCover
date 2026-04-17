/**
 * useGeolocation Hook
 * =====================
 * Captures user's current location using Geolocation API
 * Handles browser compatibility and all error cases
 */

import { useState, useCallback } from 'react'

export interface Location {
    latitude: number
    longitude: number
    accuracy?: number
    timestamp?: number
}

export interface GeolocationError {
    code: number
    message: string
    type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN'
}

interface UseGeolocationReturn {
    location: Location | null
    loading: boolean
    error: GeolocationError | null
    getLocation: () => Promise<Location | null>
    clearError: () => void
}

const GEOLOCATION_TIMEOUT = 10000 // 10 seconds
const GEOLOCATION_MESSAGES = {
    PERMISSION_DENIED: {
        title: 'Location Permission Denied',
        message: 'Please enable location access in your browser settings to submit a claim.',
        code: 1
    },
    POSITION_UNAVAILABLE: {
        title: 'Location Unavailable',
        message: 'Your device could not determine your location. Please check your GPS/location services.',
        code: 2
    },
    TIMEOUT: {
        title: 'Location Request Timeout',
        message: 'Your location request took too long. Please check your location services and try again.',
        code: 3
    },
    UNKNOWN: {
        title: 'Location Error',
        message: 'An unknown error occurred while trying to get your location. Please try again.',
        code: 0
    }
}

export const useGeolocation = (): UseGeolocationReturn => {
    const [location, setLocation] = useState<Location | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<GeolocationError | null>(null)

    const clearError = useCallback(() => {
        setError(null)
    }, [])

    const getLocation = useCallback(async (): Promise<Location | null> => {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            const noSupportError: GeolocationError = {
                code: GEOLOCATION_MESSAGES.UNKNOWN.code,
                message: 'Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Safari.',
                type: 'UNKNOWN'
            }
            setError(noSupportError)
            return null
        }

        setLoading(true)
        setError(null)

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const newLocation: Location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    }
                    setLocation(newLocation)
                    setLoading(false)
                    setError(null)
                    resolve(newLocation)
                },
                (geoError) => {
                    let errorType: GeolocationError['type'] = 'UNKNOWN'
                    let message = ''

                    switch (geoError.code) {
                        case geoError.PERMISSION_DENIED:
                            errorType = 'PERMISSION_DENIED'
                            message = GEOLOCATION_MESSAGES.PERMISSION_DENIED.message
                            break
                        case geoError.POSITION_UNAVAILABLE:
                            errorType = 'POSITION_UNAVAILABLE'
                            message = GEOLOCATION_MESSAGES.POSITION_UNAVAILABLE.message
                            break
                        case geoError.TIMEOUT:
                            errorType = 'TIMEOUT'
                            message = GEOLOCATION_MESSAGES.TIMEOUT.message
                            break
                        default:
                            errorType = 'UNKNOWN'
                            message = GEOLOCATION_MESSAGES.UNKNOWN.message
                    }

                    const error: GeolocationError = {
                        code: geoError.code,
                        message,
                        type: errorType
                    }

                    setError(error)
                    setLocation(null)
                    setLoading(false)
                    resolve(null)
                },
                {
                    timeout: GEOLOCATION_TIMEOUT,
                    enableHighAccuracy: true,
                    maximumAge: 0 // Always get fresh location
                }
            )
        })
    }, [])

    return {
        location,
        loading,
        error,
        getLocation,
        clearError
    }
}
