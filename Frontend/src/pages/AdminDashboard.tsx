import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Users, ShieldCheck, BarChart3, Wallet, AlertTriangle, SlidersHorizontal, ShieldAlert, ClipboardList, CircleCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StatusBadge, LoadingSpinner, MetricCard } from '@/components/common'
import { adminService } from '@/services/adminService'
import { formatters } from '@/utils/formatters'

interface AdminStats {
  total_workers: number
  active_policies: number
  total_claims: number
  total_payouts: number
  claims_pending: number
  flagged_claims: number
  loss_ratio: number
  avg_processing_time: number
}

interface ClaimAlert {
  id: number
  claim_id: number
  type: string
  risk_level: string
  created_at: string
}

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [alerts, setAlerts] = useState<ClaimAlert[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResult, alertsResult] = await Promise.all([
          adminService.getStats(),
          adminService.getAlerts(1, 10),
        ])
        setStats(statsResult?.data)
        setAlerts(alertsResult?.data || [])
      } catch (err) {
        console.error('Failed to load admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <LoadingSpinner fullHeight />

  const lossRatioColor = !stats ? 'text-gray-600' : 
    stats.loss_ratio < 0.5 ? 'text-green-600' :
    stats.loss_ratio < 0.8 ? 'text-amber-600' :
    'text-red-600'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 mb-8">Parametric insurance platform overview & controls</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <MetricCard 
              label="Active Workers" 
              value={stats?.total_workers || 0} 
              icon={<Users className="h-5 w-5" />} 
            />
            <MetricCard 
              label="Active Policies" 
              value={stats?.active_policies || 0} 
              icon={<ShieldCheck className="h-5 w-5" />} 
            />
            <MetricCard 
              label="Total Claims" 
              value={stats?.total_claims || 0} 
              icon={<BarChart3 className="h-5 w-5" />} 
            />
            <MetricCard 
              label="Total Payouts" 
              value={formatters.currency(stats?.total_payouts || 0)} 
              icon={<Wallet className="h-5 w-5" />} 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Health Metrics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Loss Ratio */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Loss Ratio</h3>
                <div className={`text-4xl font-bold ${lossRatioColor} mb-3`}>
                  {((stats?.loss_ratio || 0) * 100).toFixed(1)}%
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all ${
                      (stats?.loss_ratio || 0) < 0.5 ? 'bg-green-500' :
                      (stats?.loss_ratio || 0) < 0.8 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((stats?.loss_ratio || 0) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">Payouts vs Premiums</p>
              </div>

              {/* Processing Time */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Avg Processing Time</h3>
                <div className="text-4xl font-bold text-purple-600 mb-1">
                  {stats?.avg_processing_time || 0}h
                </div>
                <p className="text-xs text-gray-600">From claim to payout</p>
              </div>

              {/* Critical Metrics */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />Critical Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Pending Claims</span>
                    <span className="font-bold text-red-600">{stats?.claims_pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Flagged for Review</span>
                    <span className="font-bold text-red-600">{stats?.flagged_claims || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Recent Alerts & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fraud Alerts */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Recent Fraud Alerts</h3>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/admin/fraud-queue')}
                    className="text-sm"
                  >
                    View All
                  </Button>
                </div>

                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div 
                        key={alert.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Claim #{alert.claim_id}</p>
                          <p className="text-sm text-gray-600 capitalize">{alert.type}</p>
                        </div>
                        <StatusBadge 
                          status={alert.risk_level === 'high' ? 'flagged' : 'triggered'} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No recent alerts</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate('/admin/simulator')}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Simulate Trigger
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate('/admin/fraud-queue')}
                  >
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    Review Fraud
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate('/admin/audit')}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Audit Log
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate('/claims')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    All Claims
                  </Button>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <span className="font-semibold inline-flex items-center gap-1"><CircleCheck className="h-4 w-4" />System Status:</span> All systems operational. {stats?.total_workers} active workers, {stats?.active_policies} policies in force.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
