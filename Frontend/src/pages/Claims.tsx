import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CheckCircle2, AlertTriangle, Wallet, FileText, Clock } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { claimsService } from '@/services/claimsService'
import { formatters } from '@/utils/formatters'

interface Claim {
  id: number
  trigger_type: string
  status: string
  gross_payout_inr: number
  net_payout_inr: number
  created_at: string
}

export const Claims = () => {
  const navigate = useNavigate()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const claimsResult = await claimsService.getClaims(1, 50)
        const claimsList = Array.isArray(claimsResult) ? claimsResult : claimsResult || []
        setClaims(claimsList)
        setStats({
          total: claimsList.length || 0,
          approved: claimsList.filter((c: any) => c.status === 'approved').length || 0,
          flagged: claimsList.filter((c: any) => c.status === 'flagged').length || 0,
          total_claimed: claimsList.reduce((sum: number, c: any) => sum + (c.gross_payout_inr || 0), 0) || 0,
        })
      } catch (err) {
        console.error('Failed to load claims:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <Clock className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AppShell>
    )
  }

  const filteredClaims = filter === 'all' ? claims : claims.filter(c => c.status === filter)

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-5 border border-purple-200">
          <p className="text-xs text-muted-foreground">Claims</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">Claims Overview</h1>
          <p className="text-sm text-muted-foreground mt-2">Track all your auto-generated claims and payouts.</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Total Claims</p>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{stats?.total || 0}</p>
          </div>
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Approved</p>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{stats?.approved || 0}</p>
          </div>
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Flagged</p>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{stats?.flagged || 0}</p>
          </div>
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <Wallet className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{formatters.currency(stats?.total_claimed || 0)}</p>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-3 border border-purple-200">
          <div className="flex gap-2 flex-wrap">
            {['all', 'approved', 'triggered', 'flagged', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-700 border border-purple-200 hover:bg-purple-50'
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card p-4 border border-purple-200">
          {filteredClaims.length > 0 ? (
            <div className="space-y-2">
              {filteredClaims.map((claim) => (
                <button
                  key={claim.id}
                  onClick={() => navigate(`/claims/${claim.id}`)}
                  className="w-full text-left p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Claim #{claim.id}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-1">{claim.trigger_type.replace(/_/g, ' ')}</p>
                    </div>
                    <span className="inline-block rounded-full bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 text-[10px] font-semibold capitalize">
                      {claim.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{formatters.dateTime(claim.created_at)}</p>
                    <p className="text-sm font-bold text-purple-700">{formatters.currency(claim.gross_payout_inr)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-purple-300 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-slate-900">No Claims</h3>
              <p className="text-sm text-muted-foreground mt-1">When a trigger event happens in your area, a claim is automatically created.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
