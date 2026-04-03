import { motion } from "framer-motion";
import { Shield, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import RiskBadge from "@/components/RiskBadge";
import { mockUser, mockPolicy } from "@/data/mockData";

const fadeUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        {/* Header */}
        <motion.div {...fadeUp} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Good morning,</p>
            <h1 className="font-display text-xl font-bold">{mockUser.name} 👋</h1>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            {mockUser.avatar}
          </button>
        </motion.div>

        {/* Coverage Card */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="gradient-primary rounded-3xl p-5 text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">Weekly Coverage</p>
              <p className="font-display text-3xl font-bold">₹{mockPolicy.coverageAmount}</p>
            </div>
            <div className="rounded-xl bg-primary-foreground/20 p-2">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <span className="text-sm opacity-90">Active until {mockPolicy.validTo}</span>
            </div>
            <RiskBadge level={mockPolicy.riskLevel} />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <TrendingUp className="mb-2 h-5 w-5 text-success" />
            <p className="text-xs text-muted-foreground">Earnings Protected</p>
            <p className="font-display text-lg font-bold">₹{mockUser.weeklyEarnings}</p>
          </div>
          <div className="glass-card p-4">
            <Zap className="mb-2 h-5 w-5 text-warning" />
            <p className="text-xs text-muted-foreground">Premium / Week</p>
            <p className="font-display text-lg font-bold">₹{mockPolicy.premium}</p>
          </div>
        </motion.div>

        {/* Active Policy */}
        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">ACTIVE POLICY</h2>
          <div className="glass-card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold">{mockPolicy.plan}</span>
              <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Policy ID</p>
                <p className="font-mono text-xs">{mockPolicy.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your share</p>
                <p className="font-semibold">₹{mockPolicy.workerShare}/wk</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="space-y-2">
          <h2 className="font-display text-sm font-semibold text-muted-foreground">QUICK ACTIONS</h2>
          {[
            { label: "View Live Monitoring", path: "/monitor", icon: "🛰️" },
            { label: "Check Claims & Payouts", path: "/claims", icon: "💰" },
            { label: "Earnings History", path: "/earnings", icon: "📊" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="glass-card flex w-full items-center justify-between p-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </motion.div>
      </div>
    </AppShell>
  );
}
