import { motion } from "framer-motion";
import { Users, IndianRupee, FileCheck, MapPin, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { mockAdminStats } from "@/data/mockData";
import RiskBadge from "@/components/RiskBadge";

const riskColors: Record<string, string> = {
  High: "hsl(0 72% 51%)",
  Medium: "hsl(38 92% 50%)",
  Low: "hsl(152 60% 42%)",
};

export default function Admin() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="rounded-xl bg-card p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">GigShield Overview</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Users, label: "Total Users", value: mockAdminStats.totalUsers.toLocaleString(), color: "text-primary" },
          { icon: FileCheck, label: "Active Policies", value: mockAdminStats.activePolicies.toLocaleString(), color: "text-success" },
          { icon: IndianRupee, label: "Premium Collected", value: `₹${(mockAdminStats.premiumCollected / 1000).toFixed(0)}K`, color: "text-accent-foreground" },
          { icon: IndianRupee, label: "Claims Paid", value: `₹${(mockAdminStats.claimsPaid / 1000).toFixed(0)}K`, color: "text-warning" },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <Icon className={`mb-2 h-5 w-5 ${color}`} />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-lg font-bold">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Claims Chart */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-card mb-5 p-4">
        <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground">CLAIMS BY CITY</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mockAdminStats.riskZones}>
            <XAxis dataKey="city" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "hsl(30 30% 95%)", border: "none", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="claims" radius={[6, 6, 0, 0]}>
              {mockAdminStats.riskZones.map((z, i) => (
                <Cell key={i} fill={riskColors[z.level]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Risk Zones Table */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="glass-card p-4">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground">
          <MapPin className="h-4 w-4" /> RISK ZONES
        </h3>
        <div className="space-y-3">
          {mockAdminStats.riskZones.map((z) => (
            <div key={z.city} className="flex items-center justify-between rounded-xl bg-background/50 p-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{z.city}</span>
                <RiskBadge level={z.level as "Low" | "Medium" | "High"} />
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{z.users.toLocaleString()} users</p>
                <p>{z.claims} claims</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
