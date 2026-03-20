import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Wind, Thermometer, AlertTriangle, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { mockWeather } from "@/data/mockData";

export default function Monitor() {
  const [weather, setWeather] = useState(mockWeather);
  const [triggered, setTriggered] = useState(false);

  const simulateRain = () => {
    setWeather((w) => ({
      ...w,
      rainProbability: 95,
      condition: "Heavy Rain",
      alerts: [{ type: "rain", message: "Heavy rainfall detected in your area", severity: "High" }],
    }));
    setTriggered(true);
  };

  const simulateAqi = () => {
    setWeather((w) => ({
      ...w,
      aqi: 340,
      aqiLabel: "Hazardous",
      alerts: [{ type: "aqi", message: "AQI exceeds 300 — payout triggered", severity: "High" }],
    }));
    setTriggered(true);
  };

  const reset = () => {
    setWeather(mockWeather);
    setTriggered(false);
  };

  return (
    <AppShell>
      <div className="space-y-5 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">Live Monitoring</h1>
            <p className="text-sm text-muted-foreground">Bengaluru • Real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
            </span>
            <span className="text-xs font-medium text-success">Active</span>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Thermometer, label: "Temperature", value: `${weather.temperature}°C`, color: "text-warning" },
            { icon: Cloud, label: "Rain Chance", value: `${weather.rainProbability}%`, color: weather.rainProbability > 70 ? "text-destructive" : "text-secondary-foreground" },
            { icon: Wind, label: "AQI", value: `${weather.aqi}`, sub: weather.aqiLabel, color: weather.aqi > 200 ? "text-destructive" : "text-muted-foreground" },
            { icon: Activity, label: "Condition", value: weather.condition, color: "text-accent-foreground" },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="glass-card p-4">
              <Icon className={`mb-2 h-5 w-5 ${color}`} />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-display text-lg font-bold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
          ))}
        </div>

        {/* System Monitor */}
        <div className="glass-card flex items-center gap-3 p-4">
          <div className="gradient-teal flex h-10 w-10 items-center justify-center rounded-xl">
            <Activity className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">System Monitoring Active</p>
            <p className="text-xs text-muted-foreground">AI checks every 15 minutes</p>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {weather.alerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">⚠️ Trigger Alert</p>
                <p className="text-sm text-foreground">{alert.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">Automatic payout initiated</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Simulation Controls */}
        <div className="space-y-2">
          <h3 className="font-display text-sm font-semibold text-muted-foreground">SIMULATION</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={simulateRain} disabled={triggered} className="gap-2">
              <Zap className="h-4 w-4" /> Rain Event
            </Button>
            <Button variant="outline" onClick={simulateAqi} disabled={triggered} className="gap-2">
              <Zap className="h-4 w-4" /> AQI Spike
            </Button>
          </div>
          {triggered && (
            <Button variant="ghost" onClick={reset} className="w-full text-sm text-muted-foreground">
              Reset Simulation
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
