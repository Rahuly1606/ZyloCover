// src/components/WeatherAlert.tsx
// Real-time alerts for environmental triggers

import React from 'react'
import { AlertCircle, TrendingUp, Clock } from 'lucide-react'

interface Trigger {
  trigger_type: string
  severity_pct: number
  payout_multiplier: number
}

export function WeatherAlert({ triggers }: { triggers?: Trigger[] }) {
  if (!triggers || triggers.length === 0) {
    return null
  }

  const getTriggerIcon = (type: string) => {
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
      case 'curfew':
        return '🚔'
      case 'platform_outage':
        return '⚠️'
      default:
        return '⚡'
    }
  }

  const getTriggerDescription = (type: string) => {
    switch (type) {
      case 'heavy_rain':
        return 'Heavy rainfall detected - income loss coverage activated'
      case 'extreme_heat':
        return 'Extreme temperature conditions - delivery may be restricted'
      case 'high_aqi':
        return 'Poor air quality - outdoor work limited'
      case 'strong_winds':
        return 'Strong winds affecting delivery operations'
      case 'flash_flood':
        return 'Flash flood warning - high income loss risk'
      case 'curfew':
        return 'Curfew in effect - no deliveries possible'
      case 'platform_outage':
        return 'Platform outage - delivery services unavailable'
      default:
        return 'Environmental event detected'
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-orange-600" />
        Active Coverage Triggers
      </h3>

      {triggers.map((trigger, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-lg p-3 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{getTriggerIcon(trigger.trigger_type)}</span>
              <div className="flex-1">
                <p className="font-semibold text-orange-900">
                  {trigger.trigger_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
                <p className="text-sm text-orange-700">{getTriggerDescription(trigger.trigger_type)}</p>
              </div>
            </div>
          </div>

          {/* Severity and Multiplier */}
          <div className="grid grid-cols-2 gap-3 bg-white rounded-lg p-2">
            <div>
              <span className="text-xs font-medium text-slate-600">Severity</span>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="font-bold text-red-600">{trigger.severity_pct.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-600">Payout</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="font-bold text-green-600">{trigger.payout_multiplier.toFixed(2)}x</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-orange-600">
            <Clock className="w-3 h-3" />
            Your claim is being processed automatically
          </div>
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
        💡 <strong>How it works:</strong> When environmental conditions breach thresholds, your policy automatically initiates claims.
        You'll see payouts in your account within minutes.
      </div>
    </div>
  )
}
