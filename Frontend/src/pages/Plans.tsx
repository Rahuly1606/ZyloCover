import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, AlertCircle, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { useApi } from "@/hooks/useApi";
import { policyApi } from "@/api/policies";
import type { Policy, PricingResponse } from "@/types/api";

export default function Plans() {
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium">("standard");
  const [creatingPolicy, setCreatingPolicy] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Fetch active policies
  const { data: policies, loading: policiesLoading, error: policiesError, refetch: refetchPolicies } = useApi<Policy[]>(() => policyApi.getActive());
  
  // Pricing details are presented per tier; backend calculates final premium on create
  const pricing: PricingResponse | null = null;
  const pricingLoading = false;
  const pricingError = null;

  const handleCreatePolicy = async () => {
    setCreateError("");
    setCreatingPolicy(true);
    try {
      await policyApi.create(selectedTier);
      setCreateSuccess(true);
      await refetchPolicies();
      setTimeout(() => setCreateSuccess(false), 2000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setCreatingPolicy(false);
    }
  };

  const isLoading = policiesLoading || pricingLoading;

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Your Insurance Plans</h1>
            <p className="text-sm text-muted-foreground">Manage your coverage</p>
          </div>
          <LogoutButton />
        </div>

        {(policiesError || pricingError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load plans. Please try again.</AlertDescription>
          </Alert>
        )}

        {createError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{createError}</AlertDescription>
          </Alert>
        )}

        {createSuccess && (
          <Alert className="border-success bg-success/10">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">Policy created successfully!</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card space-y-3 p-4 border border-purple-200">
              <h2 className="font-display font-bold text-lg text-slate-900">Select Coverage Tier</h2>
              <div className="grid grid-cols-3 gap-2">
                {(["basic", "standard", "premium"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                      selectedTier === tier
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-700 border-purple-200 hover:bg-purple-50"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Pricing Breakdown */}
            {pricing && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card space-y-3 p-4 border border-purple-200">
                <h2 className="font-display font-bold text-lg text-slate-900">Pricing Breakdown</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-3 border-b border-purple-100">
                    <span className="text-muted-foreground font-medium">Base Premium</span>
                    <span className="font-bold text-slate-900 text-base">₹{pricing.base_premium.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-purple-100">
                    <span className="text-muted-foreground font-medium">Environmental Loading</span>
                    <span className={pricing.environmental_loading >= 0 ? "text-orange-600 font-bold" : "text-green-600 font-bold"}>
                      ₹{pricing.environmental_loading.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-purple-100">
                    <span className="text-muted-foreground font-medium">Experience Credit</span>
                    <span className="text-green-600 font-bold">-₹{pricing.experience_credit.toLocaleString()}</span>
                  </div>
                  {pricing.fraud_penalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fraud Penalty</span>
                      <span className="text-destructive font-semibold">-₹{pricing.fraud_penalty}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="font-semibold">₹{pricing.gst}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold">Weekly Premium</span>
                    <span className="font-display text-lg font-bold text-primary">₹{pricing.weekly_premium}</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Risk Score</span>
                      <span className="text-xs font-semibold">{pricing.risk_label}</span>
                    </div>
                    <div className="w-full bg-muted rounded h-2">
                      <div 
                        className="bg-primary h-2 rounded" 
                        style={{ width: `${(pricing.risk_score / 100) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Active Policies */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">ACTIVE POLICIES ({policies?.length || 0})</h2>
              {policies && policies.length > 0 ? (
                <div className="space-y-3">
                  {policies.map((policy) => (
                    <motion.div 
                      key={policy.id}
                      whileHover={{ scale: 1.02 }}
                      className="glass-card p-4 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-display font-semibold">{policy.policy_number}</p>
                          <p className="text-xs text-muted-foreground">Policy ID: {policy.id}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          policy.status === "active" 
                            ? "bg-success/15 text-success" 
                            : "bg-warning/15 text-warning"
                        }`}>
                          {policy.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Weekly Premium</p>
                          <p className="font-semibold">₹{policy.weekly_premium}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Max Payout/Week</p>
                          <p className="font-semibold">₹{policy.max_weekly_payout}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Claimed This Week</p>
                          <p className="font-semibold">₹{policy.total_claimed_this_week}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Claims Count</p>
                          <p className="font-semibold">{policy.claim_count_this_week}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(policy.start_date).toLocaleDateString()} - {new Date(policy.end_date).toLocaleDateString()}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No active policies yet</p>
                </div>
              )}
            </motion.div>

            {/* Create New Policy Button */}
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Button
                onClick={handleCreatePolicy}
                disabled={creatingPolicy}
                className="gradient-primary w-full text-primary-foreground font-semibold py-6"
              >
                {creatingPolicy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Start New Coverage ({selectedTier})
                  </>
                )}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
