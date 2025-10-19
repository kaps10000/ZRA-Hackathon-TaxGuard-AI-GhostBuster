import React from "react";

type FeatureColor = "blue" | "green" | "red" | "purple";

export interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: FeatureColor;
}

const colorMap: Record<FeatureColor, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
  green: { bg: "bg-green-500/20", text: "text-green-400" },
  red: { bg: "bg-red-500/20", text: "text-red-400" },
  purple: { bg: "bg-purple-500/20", text: "text-purple-400" },
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color = "blue" }) => {
  const c = colorMap[color];
  return (
    <div className="group bg-blue-950/60 backdrop-blur-sm border border-blue-900/60 rounded-2xl p-8 hover:border-blue-700/60 transition-all hover:-translate-y-2">
      <div className={`inline-flex p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform ${c.bg}`}>
        <div className={c.text}>{icon}</div>
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-blue-200/80 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
