import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Zap, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { mockPayouts } from "@/data/mockData";

export default function Claims() {
  const [simulated, setSimulated] = useState(false);

  const handleSimulate = () => setSimulated(true);

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div>
          <h1 className="font-display text-xl font-bold">Claims & Payouts</h1>
          <p className="text-sm text-muted-foreground">Automatic parametric payouts</p>
        </div>

        {/* Simulate Trigger */}
        <AnimatePresence mode="wait">
          {!simulated ? (
            <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-card space-y-3 p-4">
              <p className="text-sm text-muted-foreground">Simulate an automatic claim</p>
              <Button onClick={handleSimulate} className="gradient-primary w-full gap-2 text-primary-foreground">
                <Zap className="h-4 w-4" /> Trigger Auto-Claim
              </Button>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="space-y-4 rounded-3xl bg-success/10 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success">
                  <CheckCircle2 className="h-6 w-6 text-success-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-success">Claim Triggered!</p>
                  <p className="text-xs text-muted-foreground">Heavy Rain • {new Date().toLocaleDateString("en-IN")}</p>
                </div>
              </div>
              <div className="glass-card flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-success" />
                  <span className="text-sm">Payout Amount</span>
                </div>
                <span className="font-display text-2xl font-bold text-success">₹200</span>
              </div>
              <div className="flex items-center gap-2 text-center">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Credited to your UPI account</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">PAYOUT HISTORY</h2>
          <div className="space-y-2">
            {mockPayouts.map((p) => (
              <div key={p.id} className="glass-card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{p.trigger}</p>
                    <p className="text-xs text-muted-foreground">{p.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-success">+₹{p.amount}</p>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> Credited
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
