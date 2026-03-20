import { cn } from "@/lib/utils";

type RiskLevel = "Low" | "Medium" | "High";

const styles: Record<RiskLevel, string> = {
  Low: "bg-success/15 text-success",
  Medium: "bg-warning/15 text-warning",
  High: "bg-destructive/15 text-destructive",
};

export default function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[level])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level} Risk
    </span>
  );
}
