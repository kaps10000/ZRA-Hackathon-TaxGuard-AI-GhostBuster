import React from "react";

export interface BenefitStatProps {
  icon: React.ReactNode;
  stat: string;
  label: string;
}

const BenefitStat: React.FC<BenefitStatProps> = ({ icon, stat, label }) => {
  return (
    <div className="bg-blue-950/40 backdrop-blur-sm border border-blue-900/60 rounded-xl p-6 hover:bg-blue-950/60 transition-all hover:scale-[1.02]">
      <div className="text-blue-400 mb-3">{icon}</div>
      <div className="text-3xl font-bold mb-1 text-white">{stat}</div>
      <div className="text-sm text-blue-200">{label}</div>
    </div>
  );
};

export default BenefitStat;
