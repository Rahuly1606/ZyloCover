import React, { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Hourglass, HandCoins } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { StatusBadge, LoadingSpinner, EmptyState, MetricCard } from '@/components/common'
import { payoutsService } from '@/services/payoutsService'
import { formatters } from '@/utils/formatters'

interface Payout {
  id: number
  claim_id: number
  amount: number
  status: string
  created_at: string
  paid_at?: string
}

export const Payouts = () => {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const payoutsResult = await payoutsService.getPayouts(1, 50)
        const payoutsData = payoutsResult?.data || []
        setPayouts(payoutsData)

        const totalPaid = payoutsData
          .filter((p: any) => p.status === 'paid')
          .reduce((sum: number, p: any) => sum + p.amount, 0)

        const thisWeekPayouts = payoutsData.filter((p: any) => {
          const date = new Date(p.paid_at)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return date >= weekAgo && p.status === 'paid'
        })

        const thisWeekTotal = thisWeekPayouts.reduce((sum: number, p: any) => sum + p.amount, 0)
        const pending = payoutsData.filter((p: any) => p.status !== 'paid').length

        setStats({
          total_paid: totalPaid,
          this_week: thisWeekTotal,
          pending_count: pending,
        })
      } catch (err) {
        console.error('Failed to load payouts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner fullHeight />

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 mb-20 md:mb-0">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Payouts</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <MetricCard 
              label="Total Paid" 
              value={formatters.currency(stats?.total_paid || 0)} 
              icon={<Wallet className="h-5 w-5" />} 
            />
            <MetricCard 
              label="This Week" 
              value={formatters.currency(stats?.this_week || 0)} 
              icon={<TrendingUp className="h-5 w-5" />} 
            />
            <MetricCard 
              label="Pending" 
              value={stats?.pending_count || 0} 
              icon={<Hourglass className="h-5 w-5" />} 
            />
          </div>

          {/* Payouts List */}
          {payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map(payout => (
                <div key={payout.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Payout #{payout.id}</p>
                      <p className="text-sm text-gray-600">Claim #{payout.claim_id}</p>
                    </div>
                    <StatusBadge status={payout.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {payout.paid_at 
                        ? `Paid on ${formatters.dateTime(payout.paid_at)}`
                        : `Created ${formatters.dateTime(payout.created_at)}`
                      }
                    </p>
                    <p className="font-bold text-purple-600 text-lg">{formatters.currency(payout.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Payouts"
              description="Payouts will appear here after claims are approved."
              icon={<HandCoins className="h-10 w-10" />}
            />
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
