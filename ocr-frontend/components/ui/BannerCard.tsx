import React from "react";

type BannerCardProps = {
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
};

const BannerCard = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
}: BannerCardProps) => {
  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-xl p-4 sm:p-6 transition-all duration-200 hover:scale-105 cursor-pointer`}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${color}`} />
        <span className={`text-2xl sm:text-3xl font-bold ${color}`}>{count}</span>
      </div>
      <h3 className="text-xs sm:text-sm font-medium text-slate-300">{title}</h3>
    </div>
  );
};

export default BannerCard;
