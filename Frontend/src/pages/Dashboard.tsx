import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Clock, FileText, Shield, Wallet, XCircle } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { policyService } from '@/services/policyService'
import { claimsService } from '@/services/claimsService'
import { formatters } from '@/utils/formatters'

interface Policy {
  id: number
  coverage_tier: string
  premium_amount: number
  status: string
  valid_till: string
}

interface Claim {
  id: number
  trigger_type: string
  status: string
  claimed_amount: number
  created_at: string
}

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policyResult, claimsResult] = await Promise.all([
          policyService.getActive(),
          claimsService.getClaims(1, 3),
        ])
        setPolicy(policyResult.data)
        setClaims(claimsResult.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
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

  const riskScore = user?.risk_score || 0
  const riskIcon = riskScore < 30
    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
    : riskScore < 60
      ? <AlertTriangle className="h-5 w-5 text-amber-600" />
      : <XCircle className="h-5 w-5 text-red-600" />

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6 pb-12">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-5 border border-purple-200">
          <p className="text-xs text-muted-foreground">Dashboard</p>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
            Welcome back, <span className="text-purple-600">{user?.name || 'Worker'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon'}. Here is your live insurance snapshot.
          </p>
        </motion.div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Active Policy</p>
              <Shield className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{policy?.coverage_tier || 'None'}</p>
          </div>
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Risk Score</p>
              {riskIcon}
            </div>
            <p className="font-bold text-slate-900 text-lg">{riskScore}/100</p>
          </div>
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">This Week</p>
              <Wallet className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{formatters.currency(user?.avg_weekly_income || 0)}</p>
          </div>
          <div className="glass-card p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Claims</p>
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <p className="font-bold text-slate-900 text-lg">{claims.length}</p>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-card p-4 border border-purple-200">
          {policy ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{policy.coverage_tier} Coverage</h3>
                  <p className="text-xs text-muted-foreground mt-1">Active until {formatters.longDate(policy.valid_till)}</p>
                </div>
                <span className="inline-block rounded-full bg-green-100 text-green-700 border border-green-300 px-3 py-1 text-xs font-semibold capitalize">
                  {policy.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-muted-foreground">Weekly Premium</p>
                  <p className="font-bold text-slate-900 mt-1">{formatters.currency(policy.premium_amount)}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-muted-foreground">Coverage Tier</p>
                  <p className="font-bold text-slate-900 mt-1">{policy.coverage_tier}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={() => navigate('/plans')} className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  View Policy
                </Button>
                <Button onClick={() => navigate('/plans')} variant="outline" className="flex-1 border-purple-300 text-slate-900">
                  Renew
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-10 w-10 text-purple-300 mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold text-slate-900">No Active Policy</h3>
              <p className="text-sm text-muted-foreground mt-2">You are not covered right now. Buy a policy to activate protection.</p>
              <Button onClick={() => navigate('/plans')} className="mt-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                Buy Policy
              </Button>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm font-semibold text-slate-900">Recent Claims</h2>
            <button onClick={() => navigate('/claims')} className="text-xs font-semibold text-purple-600 hover:underline">
              View all
            </button>
          </div>

          {claims.length > 0 ? (
            <div className="space-y-2">
              {claims.map((claim) => (
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
                    <p className="text-sm font-bold text-purple-700">{formatters.currency(claim.claimed_amount)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 text-purple-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">No claims yet</p>
              <p className="text-xs text-muted-foreground mt-1">Claims will auto-appear when a trigger event impacts your zone.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  )
}
