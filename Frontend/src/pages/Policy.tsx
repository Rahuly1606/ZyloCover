import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { LoadingSpinner, EmptyState, StatusBadge, MetricCard } from '@/components/common'
import { policyService } from '@/services/policyService'
import { pricingService } from '@/services/pricingService'
import { formatters } from '@/utils/formatters'

type Tab = 'active' | 'buy' | 'history'

interface PolicyData {
  id: number
  coverage_tier: string
  premium_amount: number
  status: string
  valid_till: string
  created_at: string
}

interface Tier {
  name: string
  max_claim: number
  premium_week: number
  premium_year: number
  color: string
}

const tiers: Record<string, Tier> = {
  basic: {
    name: 'Basic',
    max_claim: 2000,
    premium_week: 99,
    premium_year: 99 * 52,
    color: 'text-blue-600',
  },
  standard: {
    name: 'Standard',
    max_claim: 5000,
    premium_week: 199,
    premium_year: 199 * 52,
    color: 'text-purple-600',
  },
  premium: {
    name: 'Premium',
    max_claim: 10000,
    premium_week: 349,
    premium_year: 349 * 52,
    color: 'text-purple-600',
  },
}

export const Policy = () => {
  const [tab, setTab] = useState<Tab>('active')
  const [policy, setPolicy] = useState<PolicyData | null>(null)
  const [policies, setPolicies] = useState<PolicyData[]>([])
  const [pricing, setPricing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState('standard')
  const [expandedTierIndex, setExpandedTierIndex] = useState<number | null>(null)
  const [calculatingPricing, setCalculatingPricing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policyResult, policiesResult] = await Promise.all([
          policyService.getActive().catch(() => null),
          policyService.getHistory(1, 10),
        ])
        setPolicy(policyResult?.data || null)
        setPolicies(policiesResult?.data || [])
      } catch (err) {
        console.error('Failed to load policies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSelectTier = async (tierKey: string) => {
    setSelectedTier(tierKey)
    setCalculatingPricing(true)
    try {
      const result = await pricingService.calculate(tierKey)
      setPricing(result.data)
    } catch (err) {
      console.error('Failed to calculate pricing:', err)
    } finally {
      setCalculatingPricing(false)
    }
  }

  const handleBuyPolicy = async () => {
    try {
      await policyService.createPolicy(selectedTier)
      alert('Policy purchased successfully!')
      window.location.href = '/dashboard'
    } catch (err) {
      alert('Failed to purchase policy: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  if (loading) return <LoadingSpinner fullHeight />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 mb-20 md:mb-0">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Insurance Policies</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            {(['active', 'buy', 'history'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-3 font-semibold transition-colors ${
                  tab === t
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t === 'active' && 'Active Policy'}
                {t === 'buy' && 'Buy Policy'}
                {t === 'history' && 'Policy History'}
              </button>
            ))}
          </div>

          {/* Active Policy Tab */}
          {tab === 'active' && (
            <div>
              {policy ? (
                <div className="max-w-2xl">
                  <div className="bg-white rounded-xl shadow-sm p-8 mb-6 border-l-4 border-purple-600">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {policy.coverage_tier} Coverage
                        </h2>
                        <p className="text-gray-600">Active until {formatters.longDate(policy.valid_till)}</p>
                      </div>
                      <StatusBadge status={policy.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-8 pt-6 border-t">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Weekly Premium</p>
                        <p className="text-2xl font-bold text-purple-600">{formatters.currency(policy.premium_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Coverage Tier</p>
                        <p className="text-2xl font-bold">{policy.coverage_tier || 'Basic'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Valid Till</p>
                        <p className="text-2xl font-bold">{formatters.shortDate(policy.valid_till)}</p>
                      </div>
                    </div>

                    {/* Pricing Breakdown Accordion */}
                    <details className="mb-6 bg-gray-50 rounded-lg p-4">
                      <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                        Pricing Breakdown
                      </summary>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Base Coverage</span>
                          <span className="font-semibold">{formatters.currency(2000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>City Multiplier (1.2x)</span>
                          <span className="font-semibold">+20%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vehicle Multiplier (0.95x)</span>
                          <span className="font-semibold">-5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Multiplier (1.05x)</span>
                          <span className="font-semibold">+5%</span>
                        </div>
                        <div className="border-t pt-3 flex justify-between font-bold">
                          <span>Final Premium</span>
                          <span className="text-purple-600">{formatters.currency(policy.premium_amount)}</span>
                        </div>
                      </div>
                    </details>

                    <div className="flex gap-4">
                      <Button onClick={() => handleBuyPolicy()}>Renew Policy</Button>
                      <Link to="/claims">
                        <Button variant="secondary">View Claims</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No Active Policy"
                  description="You don't have an active policy. Start by buying one below."
                  actionLabel="Buy Policy"
                  onAction={() => setTab('buy')}
                  icon={<ShieldCheck className="h-10 w-10" />}
                />
              )}
            </div>
          )}

          {/* Buy Policy Tab */}
          {tab === 'buy' && (
            <div>
              <p className="text-gray-600 mb-8">Choose your coverage level and get protected today.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {Object.entries(tiers).map(([key, tier]) => (
                  <div
                    key={key}
                    className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer transition-all ${
                      selectedTier === key ? 'ring-2 ring-purple-600 shadow-lg' : ''
                    } ${key === 'standard' ? 'md:scale-105' : ''}`}
                    onClick={() => handleSelectTier(key)}
                  >
                    {key === 'standard' && (
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">
                        POPULAR
                      </div>
                    )}
                    <h3 className={`text-2xl font-bold ${tier.color} mb-4`}>{tier.name}</h3>
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatters.currency(tier.premium_week)}<span className="text-lg text-gray-600">/week</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {formatters.currency(tier.premium_year)}/year
                      </p>
                    </div>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        <span>Max {formatters.currency(tier.max_claim)} per claim</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        <span>All triggers covered</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-purple-600" />
                        <span>Automatic payouts</span>
                      </li>
                    </ul>
                    {selectedTier === key && (
                      <Button fullWidth onClick={handleBuyPolicy} isLoading={calculatingPricing}>
                        Select This Plan
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {pricing && selectedTier && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Your Quote
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tier</span>
                      <span className="font-semibold capitalize">{selectedTier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly Premium</span>
                      <span className="font-semibold">{formatters.currency(pricing.weekly_premium)}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between font-bold text-blue-900">
                      <span>Total Coverage</span>
                      <span>{formatters.currency(pricing.max_payout)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <div>
              {policies.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tier</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {policies.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono">#{p.id}</td>
                          <td className="px-6 py-4 text-sm capitalize font-semibold">{p.coverage_tier}</td>
                          <td className="px-6 py-4 text-sm">{formatters.shortDate(p.created_at)}</td>
                          <td className="px-6 py-4 text-sm">{formatters.shortDate(p.valid_till)}</td>
                          <td className="px-6 py-4 text-sm">
                            <StatusBadge status={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No Policy History"
                  description="You haven't purchased any policies yet."
                  actionLabel="Buy Your First Policy"
                  onAction={() => setTab('buy')}
                  icon={<ShieldCheck className="h-10 w-10" />}
                />
              )}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
