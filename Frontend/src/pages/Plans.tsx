import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Shield, AlertCircle, Loader2, ChevronDown, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { useApi } from "@/hooks/useApi";
import { policyApi } from "@/api/policies";
import type { Policy } from "@/types/api";

// Plan details configuration
const planDetails = {
  basic: {
    name: "Basic",
    description: "Essential income protection",
    income_replacement: "60%",
    max_payout: "₹2,000",
    weekly_premium_range: "₹99 - ₹150",
    features: [
      "60% income replacement",
      "Max ₹2,000 per week payout",
      "Rain protection",
      "Heat alert triggers",
      "7-day coverage period",
      "24/7 claim support",
    ],
    color: "purple",
    icon: "🛡️",
  },
  standard: {
    name: "Standard",
    description: "Most popular - comprehensive coverage",
    income_replacement: "75%",
    max_payout: "₹5,000",
    weekly_premium_range: "₹199 - ₹299",
    features: [
      "75% income replacement",
      "Max ₹5,000 per week payout",
      "Rain + Heat protection",
      "Wind & AQI triggers",
      "Unlimited weekly claims",
      "Priority support",
      "Experience discounts",
    ],
    color: "purple",
    icon: "⚡",
    popular: true,
  },
  premium: {
    name: "Premium",
    description: "Maximum protection for serious coverage",
    income_replacement: "90%",
    max_payout: "₹10,000",
    weekly_premium_range: "₹349 - ₹499",
    features: [
      "90% income replacement",
      "Max ₹10,000 per week payout",
      "All environmental triggers",
      "Flood & blackout coverage",
      "Unlimited weekly claims",
      "VIP 24/7 support",
      "Max experience discounts",
      "Priority claim settlement",
    ],
    color: "purple",
    icon: "👑",
  },
};

export default function Plans() {
  const [selectedTier, setSelectedTier] = useState<"basic" | "standard" | "premium">("standard");
  const [creatingPolicy, setCreatingPolicy] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [showExploreMore, setShowExploreMore] = useState(false);

  // Fetch active policies
  const { data: policies, loading: policiesLoading, error: policiesError, refetch: refetchPolicies } = useApi<Policy[]>(() => policyApi.getActive());
  
  const selectedPlanDetails = useMemo(() => planDetails[selectedTier], [selectedTier]);
  const hasActivePolicies = policies && policies.length > 0;

  const handleCreatePolicy = async () => {
    setCreateError("");
    setCreatingPolicy(true);
    try {
      await policyApi.create(selectedTier);
      setCreateSuccess(true);
      await refetchPolicies();
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setCreatingPolicy(false);
    }
  };

  const isLoading = policiesLoading;

  return (
    <AppShell>
      <div className="space-y-6 p-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Your Insurance Plans</h1>
            <p className="text-sm text-muted-foreground">Choose and manage your coverage</p>
          </div>
          <LogoutButton />
        </div>

        {/* Error Alerts */}
        {policiesError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load policies. Please try again.</AlertDescription>
          </Alert>
        )}

        {createError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{createError}</AlertDescription>
          </Alert>
        )}

        {createSuccess && (
          <Alert className="border-green-600 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">Policy created successfully! ✨</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ACTIVE POLICIES SECTION AT TOP - Show if policies exist */}
            {hasActivePolicies && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h2 className="font-display text-lg font-bold text-slate-900">Active Plans ({policies?.length})</h2>
                </div>
                
                <div className="space-y-3">
                  {policies.map((policy, idx) => (
                    <motion.div 
                      key={policy.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="glass-card p-4 sm:p-6 border-2 border-green-200 bg-gradient-to-r from-green-50/50 to-transparent"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <p className="font-display font-bold text-slate-900">{policy.policy_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {planDetails[policy.coverage_tier].name} • Coverage: {policy.coverage_tier.charAt(0).toUpperCase() + policy.coverage_tier.slice(1)}
                          </p>
                        </div>
                        <span className="inline-block rounded-full px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700">
                          ✓ Active
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Weekly Premium</p>
                          <p className="font-bold text-slate-900">₹{policy.weekly_premium?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Max Payout/Week</p>
                          <p className="font-bold text-slate-900">₹{policy.max_weekly_payout?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Income Replacement</p>
                          <p className="font-bold text-slate-900">{(policy.income_replacement_ratio * 100).toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Days Left</p>
                          <p className="font-bold text-slate-900">{policy.days_remaining || 7} days</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-green-100">
                        <p className="text-xs text-muted-foreground">
                          Valid until {policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* EXPLORE MORE PLANS SECTION - Collapsible */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              transition={{ delay: hasActivePolicies ? 0.2 : 0 }}
              className="space-y-4"
            >
              {/* Show button if policies exist, show section by default if no policies */}
              {hasActivePolicies ? (
                <motion.button
                  onClick={() => setShowExploreMore(!showExploreMore)}
                  className="w-full glass-card p-4 border-2 border-purple-200 hover:border-purple-300 transition-all flex items-center justify-between group"
                >
                  <span className="font-semibold text-slate-900">+ Explore More Plans</span>
                  <motion.div
                    animate={{ rotate: showExploreMore ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
                  </motion.div>
                </motion.button>
              ) : (
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900 mb-4">Choose Your Coverage</h2>
                </div>
              )}

              {/* Expandable Content */}
              <AnimatePresence>
                {(!hasActivePolicies || showExploreMore) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Tier Selection */}
                      <motion.div className="glass-card space-y-4 p-6 border border-purple-200">
                        <h3 className="font-display font-bold text-lg text-slate-900">Select Coverage Tier</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {(["basic", "standard", "premium"] as const).map((tier) => (
                            <motion.button
                              key={tier}
                              whileHover={{ scale: 1.02 }}
                              type="button"
                              onClick={() => setSelectedTier(tier)}
                              className={`relative rounded-lg border-2 px-4 py-3 text-sm font-semibold capitalize transition-all ${
                                selectedTier === tier
                                  ? "bg-purple-600 text-white border-purple-600 shadow-lg"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-purple-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 justify-center">
                                <span>{planDetails[tier].icon}</span>
                                <span>{tier}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>

                      {/* Selected Plan Details */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedTier}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="glass-card space-y-6 p-6 border-2 border-purple-300 bg-gradient-to-br from-purple-50/50 to-transparent"
                        >
                          {/* Plan Header */}
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-display text-2xl font-bold text-slate-900">{selectedPlanDetails.name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedPlanDetails.description}</p>
                              </div>
                              {selectedPlanDetails.popular && (
                                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1.5 rounded-full">
                                  MOST POPULAR
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-slate-100">
                              <p className="text-xs text-muted-foreground mb-1">Income Replacement</p>
                              <p className="text-2xl font-bold text-purple-600">{selectedPlanDetails.income_replacement}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-slate-100">
                              <p className="text-xs text-muted-foreground mb-1">Max Weekly Payout</p>
                              <p className="text-2xl font-bold text-slate-900">{selectedPlanDetails.max_payout}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-slate-100">
                              <p className="text-xs text-muted-foreground mb-1">Weekly Premium</p>
                              <p className="text-xl font-bold text-slate-900">{selectedPlanDetails.weekly_premium_range}</p>
                            </div>
                          </div>

                          {/* Features List */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-purple-600" />
                              What's Included
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedPlanDetails.features.map((feature, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex items-start gap-3 bg-white rounded-lg p-3"
                                >
                                  <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-slate-700">{feature}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* How It Works */}
                          <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                              How It Works
                            </h4>
                            <ol className="space-y-2 text-sm text-slate-700">
                              <li className="flex gap-3">
                                <span className="font-bold text-purple-600 flex-shrink-0">1.</span>
                                <span>You buy a {selectedPlanDetails.name} policy</span>
                              </li>
                              <li className="flex gap-3">
                                <span className="font-bold text-purple-600 flex-shrink-0">2.</span>
                                <span>Bad weather or disruption happens in your area</span>
                              </li>
                              <li className="flex gap-3">
                                <span className="font-bold text-purple-600 flex-shrink-0">3.</span>
                                <span>You automatically get paid - no forms, no waiting</span>
                              </li>
                            </ol>
                          </div>

                          {/* CTA Button */}
                          <Button
                            onClick={handleCreatePolicy}
                            disabled={creatingPolicy}
                            size="lg"
                            className="w-full gradient-primary text-white font-semibold py-6 text-base"
                          >
                            {creatingPolicy ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Activating Plan...
                              </>
                            ) : (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Activate {selectedPlanDetails.name} Plan (7 Days)
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Empty State - Show when no policies exist */}
            {!hasActivePolicies && !isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8 sm:p-12 text-center space-y-4 border border-dashed border-slate-300"
              >
                <Shield className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">No active policies yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Select a plan above and activate it to get started</p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
