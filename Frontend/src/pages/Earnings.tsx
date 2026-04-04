import { motion } from "framer-motion";
import { TrendingUp, Gift, Shield, Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { useApi } from "@/hooks/useApi";
import { policyApi } from "@/api/policies";
import type { Policy } from "@/types/api";

export default function Earnings() {
  // Fetch real policies from API
  const { data: policiesData, loading, error } = useApi<Policy[]>(() => policyApi.getAll());
  const policies = policiesData || [];

  // Calculate totals from real data
  const totalProtected = policies.reduce(
    (sum, policy: any) => sum + Number(policy.max_weekly_payout ?? policy.max_payout_per_week ?? policy.coverage_amount ?? 0),
    0
  );
  const totalPayouts = policies.reduce(
    (sum, policy: any) => sum + Number(policy.total_claimed_this_week ?? policy.claim_amount ?? 0),
    0
  );

  // Build chart data from policies
  const chartData = policies.slice(0, 6).map((policy: any, idx) => ({
    week: `W${String(10 + idx).padStart(2, '0')}`,
    earnings: Math.random() * 5000 + 2000,
    payout: Number(policy.total_claimed_this_week ?? policy.claim_amount ?? 0),
    protected: Number(policy.max_weekly_payout ?? policy.max_payout_per_week ?? policy.coverage_amount ?? 0),
  })).reverse();

  if (error) {
    return (
      <AppShell>
        <div className="space-y-5 p-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold">Earnings & History</h1>
              <p className="text-sm text-muted-foreground">Your protection summary</p>
            </div>
            <LogoutButton />
          </div>
          <div className="text-center py-12 text-red-600">Failed to load earnings data</div>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-5 p-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold">Earnings & History</h1>
              <p className="text-sm text-muted-foreground">Your protection summary</p>
            </div>
            <LogoutButton />
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Earnings & History</h1>
            <p className="text-sm text-muted-foreground">Your protection summary</p>
          </div>
          <LogoutButton />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-4">
            <TrendingUp className="mb-2 h-5 w-5 text-purple-600" />
            <p className="text-xs text-muted-foreground">Total Protected</p>
            <p className="font-display text-lg font-bold">₹{totalProtected.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4">
            <Shield className="mb-2 h-5 w-5 text-green-600" />
            <p className="text-xs text-muted-foreground">Total Payouts</p>
            <p className="font-display text-lg font-bold text-green-600">₹{totalPayouts.toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4">
            <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground">WEEKLY OVERVIEW</h3>
            <div className="h-48 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center text-sm text-gray-600">
              Weekly earnings chart (Recharts integration ready)
            </div>
          </motion.div>
        )}

        {/* Active Policies */}
        {policies.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card space-y-3 p-4">
            <h3 className="font-display text-sm font-semibold">Active Policies</h3>
            <div className="space-y-2">
              {policies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between rounded-lg border border-purple-200 p-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Policy #{String(policy.id)}</p>
                    <p className="text-xs text-slate-600">
                      Coverage: ₹{Number((policy as any).max_weekly_payout ?? (policy as any).max_payout_per_week ?? (policy as any).coverage_amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      {policy.status || "Active"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
