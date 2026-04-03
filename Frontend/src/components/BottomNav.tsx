import { useLocation, useNavigate } from "react-router-dom";
import { Home, Shield, Activity, Wallet, BarChart3 } from "lucide-react";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/plans", icon: Shield, label: "Plans" },
  { path: "/monitor", icon: Activity, label: "Monitor" },
  { path: "/claims", icon: Wallet, label: "Claims" },
  { path: "/earnings", icon: BarChart3, label: "Earnings" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none rounded-t-3xl border-t px-2 pb-safe">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all ${
                active
                  ? "gradient-primary text-primary-foreground scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
