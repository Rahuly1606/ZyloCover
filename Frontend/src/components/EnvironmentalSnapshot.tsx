// src/components/EnvironmentalSnapshot.tsx
// Display real-time weather and environmental data

import React, { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, AlertTriangle, Zap } from 'lucide-react'

interface EnvironmentalData {
  temp_c: number
  rainfall_mm: number
  aqi: number
  wind_kmph: number
  active_triggers: string[]
  data_source: 'openweathermap+waqi' | 'mock'
}

export function EnvironmentalSnapshot({ data, zone }: { data?: EnvironmentalData; zone?: string }) {
  if (!data) {
    return <div className="text-slate-400 text-sm">Loading environmental data...</div>
  }

  const getTempStatus = (temp: number) => {
    if (temp > 42) return { label: '🔥 High Heat', color: 'bg-red-100 text-red-800' }
    if (temp > 38) return { label: '⚠️ Warm', color: 'bg-orange-100 text-orange-800' }
    return { label: '✅ Normal', color: 'bg-green-100 text-green-800' }
  }

  const getRainfallStatus = (rain: number) => {
    if (rain > 75) return { label: '🌧️ Heavy Rain', color: 'bg-blue-100 text-blue-800' }
    if (rain > 50) return { label: '💧 Moderate Rain', color: 'bg-cyan-100 text-cyan-800' }
    return { label: '✅ Light/None', color: 'bg-sky-100 text-sky-800' }
  }

  const getAQIStatus = (aqi: number) => {
    if (aqi > 400) return { label: '💀 Severe', color: 'bg-purple-100 text-purple-800' }
    if (aqi > 300) return { label: '🚨 Very Poor', color: 'bg-red-100 text-red-800' }
    if (aqi > 200) return { label: '⚠️ Poor', color: 'bg-orange-100 text-orange-800' }
    if (aqi > 100) return { label: '😷 Moderate', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '✅ Good', color: 'bg-green-100 text-green-800' }
  }

  const getWindStatus = (wind: number) => {
    if (wind > 70) return { label: '🌪️ Strong', color: 'bg-red-100 text-red-800' }
    if (wind > 50) return { label: '💨 Moderate', color: 'bg-orange-100 text-orange-800' }
    return { label: '✅ Light', color: 'bg-green-100 text-green-800' }
  }

  const tempStatus = getTempStatus(data.temp_c)
  const rainStatus = getRainfallStatus(data.rainfall_mm)
  const aqiStatus = getAQIStatus(data.aqi)
  const windStatus = getWindStatus(data.wind_kmph)

  return (
    <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Live Environmental Conditions</h3>
          <p className="text-xs text-slate-500">
            {zone} • Data from:{' '}
            <span className={data.data_source === 'openweathermap+waqi' ? 'text-blue-600 font-medium' : 'text-amber-600 font-medium'}>
              {data.data_source === 'openweathermap+waqi' ? '🌐 Real API' : '📊 Calibrated Mock'}
            </span>
          </p>
        </div>
        <Cloud className="w-5 h-5 text-blue-500" />
      </div>

      {/* Grid: 2x2 metrics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Temperature */}
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Temperature</span>
            <span className={`text-xs px-2 py-1 rounded-full ${tempStatus.color}`}>{tempStatus.label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.temp_c.toFixed(1)}°C</p>
          <p className="text-xs text-slate-500 mt-1">Threshold: 42°C</p>
        </div>

        {/* Rainfall */}
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Rainfall</span>
            <span className={`text-xs px-2 py-1 rounded-full ${rainStatus.color}`}>{rainStatus.label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.rainfall_mm.toFixed(1)}mm</p>
          <p className="text-xs text-slate-500 mt-1">Threshold: 50mm</p>
        </div>

        {/* Air Quality Index */}
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Air Quality</span>
            <span className={`text-xs px-2 py-1 rounded-full ${aqiStatus.color}`}>{aqiStatus.label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.aqi.toFixed(0)}</p>
          <p className="text-xs text-slate-500 mt-1">Threshold: 300</p>
        </div>

        {/* Wind Speed */}
        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Wind Speed</span>
            <span className={`text-xs px-2 py-1 rounded-full ${windStatus.color}`}>{windStatus.label}</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.wind_kmph.toFixed(1)} km/h</p>
          <p className="text-xs text-slate-500 mt-1">Threshold: 60 km/h</p>
        </div>
      </div>

      {/* Active Triggers Alert */}
      {data.active_triggers && data.active_triggers.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 text-sm">⚠️ Active Triggers</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.active_triggers.map((trigger) => (
                  <span key={trigger} className="inline-flex items-center gap-1 px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    {trigger.replace('_', ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                ))}
              </div>
              <p className="text-xs text-red-700 mt-2">Claims may be auto-triggered. Check your dashboard.</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Source Info */}
      <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
        {data.data_source === 'openweathermap+waqi' ? (
          <p>✅ Real-time data from OpenWeatherMap & WAQI APIs • Last updated: now</p>
        ) : (
          <p>📊 Mock data (calibrated for {zone}) • Using fallback due to API unavailability</p>
        )}
      </div>
    </div>
  )
}
