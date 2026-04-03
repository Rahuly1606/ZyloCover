import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { mockPlans } from "@/data/mockData";

export default function Plans() {
  const [selected, setSelected] = useState("standard");
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success">("idle");

  const handlePay = () => {
    setPaymentState("processing");
    setTimeout(() => setPaymentState("success"), 2000);
  };

  const plan = mockPlans.find((p) => p.id === selected)!;

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div>
          <h1 className="font-display text-xl font-bold">Choose Your Plan</h1>
          <p className="text-sm text-muted-foreground">Weekly parametric coverage</p>
        </div>

        <div className="space-y-3">
          {mockPlans.map((p) => (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelected(p.id); setPaymentState("idle"); }}
              className={`glass-card relative w-full p-4 text-left transition-all ${
                selected === p.id ? "ring-2 ring-primary" : ""
              }`}
            >
              {p.popular && (
                <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  <Star className="h-3 w-3" /> Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Coverage up to ₹{p.coverage}/event</p>
                </div>
                <p className="font-display text-xl font-bold">₹{p.premium}<span className="text-xs font-normal text-muted-foreground">/wk</span></p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.triggers.map((t) => (
                  <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{t}</span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Breakdown */}
        <div className="glass-card space-y-3 p-4">
          <h3 className="font-display text-sm font-semibold text-muted-foreground">PREMIUM BREAKDOWN</h3>
          <div className="flex items-center justify-between text-sm">
            <span>Your contribution</span>
            <span className="font-semibold">₹{plan.workerShare}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Platform subsidy</span>
            <span className="font-semibold text-success">₹{plan.platformShare}</span>
          </div>
          <div className="border-t pt-2 flex items-center justify-between text-sm font-bold">
            <span>Total Premium</span>
            <span>₹{plan.premium}/week</span>
          </div>
        </div>

        {/* Pay Button */}
        <AnimatePresence mode="wait">
          {paymentState === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button onClick={handlePay} className="gradient-primary w-full py-6 text-base text-primary-foreground">
                <Shield className="mr-2 h-5 w-5" /> Pay ₹{plan.workerShare} & Activate
              </Button>
            </motion.div>
          )}
          {paymentState === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Processing payment...</p>
            </motion.div>
          )}
          {paymentState === "success" && (
            <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-success/10 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success">
                <Check className="h-7 w-7 text-success-foreground" />
              </div>
              <p className="font-display font-bold text-success">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">{plan.name} activated for this week</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
