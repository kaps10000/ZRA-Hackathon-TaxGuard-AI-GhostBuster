"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useUploadsStore } from "../store/useUploadsStore";

export default function StatsCharts() {
  const results = useUploadsStore((s) => s.results);
  const riskCounts = results.reduce(
    (acc, r) => {
      acc[r.riskLevel] += 1;
      return acc;
    },
    { green: 0, yellow: 0, red: 0 } as Record<"green" | "yellow" | "red", number>
  );
  const pieData = [
    { name: "Green", value: riskCounts.green, color: "#16a34a" },
    { name: "Yellow", value: riskCounts.yellow, color: "#ca8a04" },
    { name: "Red", value: riskCounts.red, color: "#dc2626" },
  ];
  const timeline = results
    .slice()
    .reverse()
    .map((r) => ({ time: new Date(r.createdAt).toLocaleTimeString(), score: r.riskScore }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64 border rounded p-2 bg-white/70 dark:bg-neutral-900/50">
        <h3 className="text-sm font-medium mb-2">Risk Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80}>
              {pieData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 border rounded p-2 bg-white/70 dark:bg-neutral-900/50">
        <h3 className="text-sm font-medium mb-2">Risk Score Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
