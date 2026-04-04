import { motion } from "framer-motion"
import { Users, FileCheck, IndianRupee, AlertCircle, Loader2, ArrowLeft, TrendingUp, LogOut, Activity, BarChart3, PieChart } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useApi } from "@/hooks/useApi"
import { adminApi } from "@/api/admin"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import type { AdminStats } from "@/types/api"

export default function Admin() {
  const navigate = useNavigate()
  const { isAdmin, adminLogout } = useAuth()
  const { data: stats, loading, error } = useApi<AdminStats>(() => adminApi.getDashboard())

  // Redirect if not admin
  if (!isAdmin) {
    navigate('/admin-login', { replace: true })
    return null
  }

  const handleLogout = () => {
    adminLogout()
    navigate('/onboarding', { replace: true })
  }

  if (error) {
    return (
      <div className="mx-auto min-h-screen max-w-6xl p-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-card p-2 hover:bg-card/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">ZyloCover System Management</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load admin data. {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-6xl p-4 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded-xl bg-card p-2 hover:bg-card/80"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">ZyloCover System Management</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Calculate metrics
  const lossRatio = stats && stats.total_payouts && stats?.total_claims > 0
    ? ((stats.total_payouts / (stats.total_claims * 1000)) * 100).toFixed(1)
    : "0"

  const approvalRate = stats && stats.total_claims > 0
    ? (((stats.claims_approved || 0) / stats.total_claims) * 100).toFixed(1)
    : "0"

  const fraudPercentage = stats && stats.total_claims > 0
    ? (((stats.claims_rejected || 0) / stats.total_claims) * 100).toFixed(1)
    : "0"

  const avgPolicyValue = stats && stats.active_policies > 0
    ? Math.round(stats.total_payouts / (stats.active_policies * 4))
    : 0

  const kpis = [
    { icon: Users, label: "Total Workers", value: stats?.total_users.toLocaleString() || "0", color: "text-blue-500", trend: "+12%" },
    { icon: FileCheck, label: "Active Policies", value: stats?.active_policies.toLocaleString() || "0", color: "text-green-500", trend: "+8%" },
    { icon: IndianRupee, label: "Total Payouts", value: `₹${((stats?.total_payouts || 0) / 100000).toFixed(1)}L`, color: "text-purple-500", trend: "+24%" },
    { icon: Activity, label: "Approval Rate", value: `${approvalRate}%`, color: "text-emerald-500", trend: "High" },
  ]

  const metrics = [
    { label: "Loss Ratio", value: `${lossRatio}%`, description: "Target: 55-70%", status: lossRatio > 55 && lossRatio < 70 ? "optimal" : "warning" },
    { label: "Avg Claim Size", value: `₹${stats?.avg_claim_amount || 0}`, description: "Per claim", status: "normal" },
    { label: "Fraud Detection", value: `${fraudPercentage}%`, description: "Of total claims", status: "monitored" },
    { label: "Avg Policy Value", value: `₹${avgPolicyValue}`, description: "Per week", status: "normal" },
  ]

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-4 pt-6 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-card p-2 hover:bg-card/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">ZyloCover System Management & Monitoring</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value, color, trend }, i) => (
          <motion.div
            key={label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 rounded-xl border border-border/50 backdrop-blur-sm hover:border-border/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className={`h-6 w-6 ${color}`} />
              <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">{trend}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="font-display text-2xl font-bold">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Metrics Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Claims Analytics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-xl border border-border/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <FileCheck className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Claims Analytics</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total Claims Processed</span>
                <span className="font-bold text-lg">{stats?.total_claims || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-600">Approved Claims</span>
                <span className="font-bold text-green-600">{stats?.claims_approved || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats && stats.total_claims > 0
                        ? (stats.claims_approved / stats.total_claims) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{approvalRate}% approval rate</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-600">Rejected Claims</span>
                <span className="font-bold text-red-600">{stats?.claims_rejected || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${
                      stats && stats.total_claims > 0
                        ? (stats.claims_rejected / stats.total_claims) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{fraudPercentage}% fraud detection rate</p>
            </div>
          </div>
        </motion.div>

        {/* Financial Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-xl border border-border/50 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h3 className="font-display text-lg font-semibold">Financial Overview</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Payouts Disbursed</p>
              <p className="font-display text-2xl font-bold">₹{((stats?.total_payouts || 0) / 100000).toFixed(2)}L</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Average Claim</p>
                <p className="font-bold">₹{stats?.avg_claim_amount || 0}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Per Policy</p>
                <p className="font-bold">₹{avgPolicyValue}</p>
              </div>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-xs text-primary mb-1">Loss Ratio (Combined Ratio)</p>
              <p className="font-bold text-primary">{lossRatio}% <span className="text-xs font-normal text-muted-foreground">(Target: 55-70%)</span></p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Metrics */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 rounded-xl border border-border/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <PieChart className="h-5 w-5 text-amber-500" />
          <h3 className="font-display text-lg font-semibold">System Metrics</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map(({ label, value, description, status }) => (
            <div key={label} className="p-4 bg-muted/50 rounded-lg border border-border/30">
              <p className="text-xs text-muted-foreground mb-2">{label}</p>
              <p className="font-display text-xl font-bold mb-1">{value}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
              <div className="mt-2 flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'optimal' ? 'bg-green-500' :
                  status === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-xs capitalize text-muted-foreground">{status}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/30 text-center">
        <p className="text-xs text-muted-foreground">
          ZyloCover Admin Portal • System Data Last Updated • All times in IST
        </p>
      </div>
    </div>
  )
}
