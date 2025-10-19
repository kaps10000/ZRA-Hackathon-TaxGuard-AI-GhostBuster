import React from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, subtitle, headerRight, children, className = "" }) => {
  return (
    <div className={`bg-blue-950/60 rounded-xl shadow-sm border border-blue-900/60 overflow-hidden ${className}`}>
      {(title || subtitle || headerRight) && (
        <div className="p-6 bg-blue-950/40 border-b border-blue-900/60 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
            {subtitle && <p className="text-sm text-blue-200 mt-1">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
