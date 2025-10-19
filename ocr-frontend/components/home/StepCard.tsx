import React from "react";

export interface StepCardProps {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description, icon }) => {
  return (
    <div className="relative bg-gradient-to-br from-blue-950/50 to-blue-900/30 backdrop-blur-sm border border-blue-900/60 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg text-white">
        {step}
      </div>
      <div className="flex items-start gap-4 mt-4">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <div className="text-blue-400">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
          <p className="text-blue-200/80">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default StepCard;
