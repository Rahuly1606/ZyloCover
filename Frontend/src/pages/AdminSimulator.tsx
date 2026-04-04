import React, { useState } from 'react'
import { CircleCheck, CloudRain, Info, TriangleAlert } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { adminService } from '@/services/adminService'
import { formatters } from '@/utils/formatters'

interface SimulationResult {
  trigger_value: number
  threshold: number
  multiplier: number
  base_payout: number
  final_payout: number
  trigger_type: string
  city: string
  status: 'triggered' | 'not_triggered'
}

const TRIGGER_TYPES = [
  { value: 'rainfall', label: 'Heavy Rainfall' },
  { value: 'hailstorm', label: 'Hailstorm' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'drought', label: 'Drought' },
  { value: 'frost', label: 'Frost' },
]

const CITIES = [
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'pune', label: 'Pune' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'hyderabad', label: 'Hyderabad' },
]

export const AdminSimulator = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    city: 'bangalore',
    trigger_type: 'rainfall',
    trigger_value: 150,
  })
  const [result, setResult] = useState<SimulationResult | null>(null)

  const handleSimulate = async () => {
    if (!formData.trigger_value || formData.trigger_value <= 0) {
      alert('Please enter a valid trigger value')
      return
    }

    setLoading(true)
    try {
      const response = await adminService.simulateTrigger({
        city: formData.city,
        trigger_type: formData.trigger_type,
        trigger_value: Number(formData.trigger_value),
      })
      setResult(response.data)
    } catch (err) {
      console.error('Simulation failed:', err)
      alert('Simulation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClaim = async () => {
    if (!result) return
    setLoading(true)
    try {
      await adminService.createClaimFromSimulation({
        trigger_type: formData.trigger_type,
        city: formData.city,
        trigger_value: formData.trigger_value,
        claimed_amount: result.final_payout,
      })
      alert('Claim created successfully!')
      setResult(null)
      setFormData({ city: 'bangalore', trigger_type: 'rainfall', trigger_value: 150 })
    } catch (err) {
      console.error('Failed to create claim:', err)
      alert('Failed to create claim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Trigger Simulator</h1>
          <p className="text-gray-600 mb-8">Simulate parametric insurance triggers and see automatic payouts</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Simulation Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 border border-gray-200 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Simulate Trigger</h2>

                <Select
                  label="City"
                  options={CITIES}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mb-4"
                />

                <Select
                  label="Trigger Type"
                  options={TRIGGER_TYPES}
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  className="mb-4"
                />

                <Input
                  label={`Trigger Value (${
                    formData.trigger_type === 'rainfall' ? 'mm' :
                    formData.trigger_type === 'frost' ? '°C' :
                    'index'
                  })`}
                  type="number"
                  value={formData.trigger_value}
                  onChange={(e) => setFormData({ ...formData, trigger_value: Number(e.target.value) })}
                  className="mb-6"
                />

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSimulate}
                  isLoading={loading}
                >
                  Simulate Trigger
                </Button>

                <p className="text-xs text-gray-500 mt-4">
                  Enter environmental values to see if they cross parametric thresholds and trigger automatic payouts.
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              {result ? (
                <div className="space-y-6">
                  {/* Trigger Status */}
                  <div className={`rounded-lg p-6 border-2 ${
                    result.status === 'triggered'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Trigger Status</p>
                        <p className={`text-3xl font-bold ${
                          result.status === 'triggered' ? 'text-green-600' : 'text-amber-600'
                        } flex items-center gap-2`}>
                          {result.status === 'triggered' ? <CircleCheck className="h-7 w-7" /> : <TriangleAlert className="h-7 w-7" />}
                          {result.status === 'triggered' ? 'TRIGGERED' : 'NOT TRIGGERED'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="text-2xl font-bold text-gray-900 capitalize">{result.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Threshold Analysis */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Threshold Analysis</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <span className="text-gray-600">Observed Value</span>
                        <span className="font-semibold text-gray-900">
                          {result.trigger_value.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <span className="text-gray-600">Threshold</span>
                        <span className="font-semibold text-gray-900">
                          {result.threshold.toFixed(2)}
                        </span>
                      </div>
                      <div className="relative pt-2">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              result.trigger_value >= result.threshold ? 'bg-green-500' : 'bg-amber-400'
                            }`}
                            style={{
                              width: `${Math.min((result.trigger_value / result.threshold) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {((result.trigger_value / result.threshold) * 100).toFixed(1)}% of threshold
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payout Calculation */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Automatic Payout Calculation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-600">Base Payout</span>
                        <span className="font-semibold">{formatters.currency(result.base_payout)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <div>
                          <span className="text-gray-600">Severity Multiplier</span>
                          <p className="text-xs text-gray-500">({result.trigger_type})</p>
                        </div>
                        <span className="font-bold text-orange-600">×{result.multiplier.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 bg-green-50 px-3 py-2 rounded border border-green-200">
                        <span className="font-bold text-gray-900">Final Payout</span>
                        <span className="font-bold text-green-600 text-xl">{formatters.currency(result.final_payout)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {result.status === 'triggered' && (
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleCreateClaim}
                        isLoading={loading}
                      >
                        Create Claim with {formatters.currency(result.final_payout)} Payout
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setResult(null)}
                    >
                      Run Another Simulation
                    </Button>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold inline-flex items-center gap-1"><Info className="h-4 w-4" />How It Works:</span> When weather data exceeds the parametric threshold for a location, affected workers automatically receive a payout matching crop/income loss estimates. No manual claims process needed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                  <CloudRain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">Enter trigger values to simulate</p>
                  <p className="text-gray-600">
                    See how parametric thresholds determine automatic payouts for workers
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
