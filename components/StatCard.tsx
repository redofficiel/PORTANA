import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string; // e.g. "bg-blue-50 text-blue-700"
  isActive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white p-6 rounded-xl shadow-sm border transition-all duration-200 cursor-pointer select-none
        flex items-start justify-between relative overflow-hidden group
        ${isActive 
          ? 'border-blue-500 ring-2 ring-blue-200 ring-offset-1 z-10' 
          : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div>
        <p className={`text-sm font-medium uppercase tracking-wide transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-800">{value.toLocaleString()}</p>
      </div>
      <div className={`p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : colorClass}`}>
        {isActive && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-6 w-6 text-white" }) : icon}
      </div>
      
      {/* Active Indicator Strip */}
      {isActive && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>
      )}
      
      {/* Hover hint */}
      {!isActive && (
        <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
      )}
    </div>
  );
};