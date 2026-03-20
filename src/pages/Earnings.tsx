import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Gift, Shield } from "lucide-react";
import AppShell from "@/components/AppShell";
import { mockEarningsHistory, mockNoClaimBonus } from "@/data/mockData";

export default function Earnings() {
  const totalProtected = mockEarningsHistory.reduce((a, b) => a + b.protected, 0);
  const totalPayouts = mockEarningsHistory.reduce((a, b) => a + b.payout, 0);

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div>
          <h1 className="font-display text-xl font-bold">Earnings & History</h1>
          <p className="text-sm text-muted-foreground">Your protection summary</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card p-4">
            <TrendingUp className="mb-2 h-5 w-5 text-primary" />
            <p className="text-xs text-muted-foreground">Total Protected</p>
            <p className="font-display text-lg font-bold">₹{totalProtected.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4">
            <Shield className="mb-2 h-5 w-5 text-success" />
            <p className="text-xs text-muted-foreground">Total Payouts</p>
            <p className="font-display text-lg font-bold text-success">₹{totalPayouts}</p>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4">
          <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground">WEEKLY EARNINGS</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[...mockEarningsHistory].reverse()}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "hsl(30 30% 95%)", border: "none", borderRadius: 12, fontSize: 12 }}
                formatter={(value: number) => [`₹${value}`, ""]}
              />
              <Bar dataKey="earnings" fill="hsl(253 30% 67%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="payout" fill="hsl(152 60% 42%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Earnings</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Payouts</span>
          </div>
        </motion.div>

        {/* No Claim Bonus */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          className="glass-card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            <h3 className="font-display text-sm font-semibold">No-Claim Bonus</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Current Streak</p>
              <p className="font-display text-2xl font-bold">{mockNoClaimBonus.currentStreak} weeks</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Bonus Earned</p>
              <p className="font-display text-xl font-bold text-success">₹{mockNoClaimBonus.bonusAmount}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Next milestone: {mockNoClaimBonus.nextMilestone} weeks</span>
              <span>₹{mockNoClaimBonus.nextBonusAmount} bonus</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="gradient-primary h-2 rounded-full transition-all"
                style={{ width: `${(mockNoClaimBonus.currentStreak / mockNoClaimBonus.nextMilestone) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Weekly Breakdown */}
        <div>
          <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground">WEEKLY BREAKDOWN</h3>
          <div className="space-y-2">
            {mockEarningsHistory.map((w) => (
              <div key={w.week} className="glass-card flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">Week {w.week.replace("W", "")}</p>
                  <p className="text-xs text-muted-foreground">Earnings: ₹{w.earnings}</p>
                </div>
                {w.payout > 0 ? (
                  <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">+₹{w.payout}</span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">No claim</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
