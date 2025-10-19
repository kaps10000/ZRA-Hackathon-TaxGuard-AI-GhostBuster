import type { RiskLevel } from "../lib/types";

export default function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const map: Record<RiskLevel, string> = {
    green: "bg-green-100 text-green-700 border-green-300",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
    red: "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-sm border rounded ${map[level]}`}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: level === "green" ? "#16a34a" : level === "yellow" ? "#ca8a04" : "#dc2626" }} />
      <span className="capitalize">{level}</span>
      {typeof score === "number" && <span className="opacity-70">({score})</span>}
    </span>
  );
}
