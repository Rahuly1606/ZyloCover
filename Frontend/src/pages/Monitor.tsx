import { motion } from "framer-motion";
import { Cloud, Wind, AlertCircle, Activity, Loader2, MapPin } from "lucide-react";
import AppShell from "@/components/AppShell";
import LogoutButton from "@/components/LogoutButton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApi } from "@/hooks/useApi";
import { triggersApi } from "@/api/triggers";
import type { Trigger } from "@/types/api";

const triggerIcons: Record<string, any> = {
  heavy_rain: Cloud,
  strong_winds: Wind,
  extreme_heat: AlertCircle,
  high_aqi: Activity,
  curfew: MapPin,
  platform_outage: AlertCircle,
  flash_flood: Cloud,
};

const triggerColors: Record<string, string> = {
  heavy_rain: "bg-blue-500/20 text-blue-600",
  strong_winds: "bg-cyan-500/20 text-cyan-600",
  extreme_heat: "bg-orange-500/20 text-orange-600",
  high_aqi: "bg-red-500/20 text-red-600",
  curfew: "bg-purple-500/20 text-purple-600",
  platform_outage: "bg-gray-500/20 text-gray-600",
  flash_flood: "bg-indigo-500/20 text-indigo-600",
};

export default function Monitor() {
  const { data: triggers, loading, error } = useApi<Trigger[]>(() => triggersApi.getActive());

  const getTriggerLabel = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Live Monitoring</h1>
            <p className="text-sm text-muted-foreground">Environmental alerts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
              </span>
              <span className="text-xs font-medium text-success">Live</span>
            </div>
            <LogoutButton />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load monitoring data. Please try again.</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : triggers && triggers.length > 0 ? (
          <div className="space-y-3">
            {triggers.map((trigger, index) => {
              const IconComponent = triggerIcons[trigger.trigger_type] || AlertCircle;
              const colorClass = triggerColors[trigger.trigger_type] || "bg-gray-500/20 text-gray-600";

              return (
                <motion.div
                  key={trigger.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`rounded-lg p-2.5 ${colorClass}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-display font-semibold">{getTriggerLabel(trigger.trigger_type)}</p>
                        <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
                          {trigger.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Zone: {trigger.affected_zone.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Measured Value</p>
                      <p className="font-semibold">{trigger.measured_value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Threshold</p>
                      <p className="font-semibold">{trigger.threshold_value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Severity</p>
                      <p className="font-semibold">{trigger.severity_pct}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payout Multiplier</p>
                      <p className="font-semibold text-success">×{trigger.payout_multiplier}</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">
                      Detected: {new Date(trigger.created_at).toLocaleDateString()} {new Date(trigger.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No active alerts</p>
            <p className="text-xs text-muted-foreground mt-1">When environmental events are detected, they will appear here</p>
          </div>
        )}

        {/* Alert Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <h3 className="font-display font-semibold mb-2">How it works</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We monitor environmental events in your work zone. When severe conditions are detected (heavy rain, extreme heat, high air pollution, etc.), payouts are automatically triggered through parametric insurance — no claim form needed.
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
}
