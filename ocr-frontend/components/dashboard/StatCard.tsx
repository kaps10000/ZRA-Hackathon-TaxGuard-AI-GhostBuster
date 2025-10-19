import React from "react";
import { TrendingUp } from "lucide-react";

export type Trend = "up" | "down";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: Trend;
  icon: React.ReactNode;
  color?: string; // tailwind color name e.g. 'blue', 'yellow'
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-300" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-300" },
  red: { bg: "bg-red-500/10", text: "text-red-300" },
  green: { bg: "bg-green-500/10", text: "text-green-300" },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon, color = "blue" }) => {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className="bg-blue-950/60 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-blue-900/60">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-200 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
            <TrendingUp className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`} />
            {change}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${c.bg}`}>
          <div className={`${c.text}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
