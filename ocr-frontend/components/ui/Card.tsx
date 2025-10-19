import React from "react";

type CardProps = {
  icon: React.ReactNode;
  heading: string;
  description: string;
};

const Card = ({ icon, heading, description }: CardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/25">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
    
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg text-left font-semibold text-gray-800 mb-2">{heading}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default Card;
