import React from 'react';

interface StatCardProps {
  label: string;
  count: number;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  colorTheme?: 'gray' | 'teal' | 'navy' | 'blue' | 'red' | 'orange';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  count, 
  icon, 
  active = false, 
  onClick,
  colorTheme = 'gray' 
}) => {
  
  const themeStyles = {
    gray:   active ? 'border-slate-600 bg-slate-50' : 'border-slate-200 hover:border-slate-300 bg-white',
    teal:   active ? 'border-teal-600 bg-teal-50' : 'border-teal-100 hover:border-teal-300 bg-white',
    navy:   active ? 'border-indigo-900 bg-indigo-50' : 'border-indigo-100 hover:border-indigo-300 bg-white',
    blue:   active ? 'border-cyan-600 bg-cyan-50' : 'border-cyan-100 hover:border-cyan-300 bg-white',
    red:    active ? 'border-red-600 bg-red-50' : 'border-red-100 hover:border-red-300 bg-white',
    orange: active ? 'border-orange-500 bg-orange-50' : 'border-orange-100 hover:border-orange-300 bg-white',
  };

  const textColors = {
    gray:   'text-slate-600',
    teal:   'text-teal-700',
    navy:   'text-indigo-900',
    blue:   'text-cyan-700',
    red:    'text-red-700',
    orange: 'text-orange-700',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-lg border shadow-sm cursor-pointer transition-all duration-200
        min-w-[100px] flex-1
        ${themeStyles[colorTheme]}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${textColors[colorTheme]}`}>{label}</span>
      </div>
      <span className={`text-2xl font-bold ${textColors[colorTheme]}`}>
        {count.toLocaleString()}
      </span>
      
      {active && (
        <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-lg ${
           colorTheme === 'gray' ? 'bg-slate-600' :
           colorTheme === 'teal' ? 'bg-teal-600' :
           colorTheme === 'navy' ? 'bg-indigo-900' :
           colorTheme === 'blue' ? 'bg-cyan-600' :
           colorTheme === 'red'  ? 'bg-red-600' :
           'bg-orange-500'
        }`} />
      )}
    </div>
  );
};