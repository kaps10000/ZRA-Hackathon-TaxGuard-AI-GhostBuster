import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, Building2, Users, ClipboardList } from 'lucide-react';

// Shared Card Component
const DashboardCard = ({ title, children, accent = 'blue', className = '' }) => {
  const accentColors = {
    blue: 'from-blue-500 to-indigo-500',
    red: 'from-red-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-400 to-orange-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group h-full flex flex-col ${className}`}
    >
      {/* Animated top border */}
      <span
        className={`absolute top-0 left-1/2 h-[3px] w-0 bg-gradient-to-r ${accentColors[accent]} 
                   transition-all duration-500 ease-out group-hover:w-full group-hover:left-0 rounded-t-2xl`}
      ></span>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>

      {children}
    </motion.div>
  );
};

export default DashboardCard;
