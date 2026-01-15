
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
  
  const isInteractive = !!onClick;

  const getThemeClasses = () => {
    // Base styles for active state
    if (active) {
      switch (colorTheme) {
        case 'gray': return 'border-slate-600 bg-slate-50';
        case 'teal': return 'border-teal-600 bg-teal-50';
        case 'navy': return 'border-indigo-900 bg-indigo-50';
        case 'blue': return 'border-cyan-600 bg-cyan-50';
        case 'red':  return 'border-red-600 bg-red-50';
        case 'orange': return 'border-orange-500 bg-orange-50';
        default: return 'border-slate-600 bg-slate-50';
      }
    }

    // Styles for inactive state (interactive vs static)
    const hoverClass = isInteractive ? 'hover:border-slate-300' : '';
    const base = `bg-white border-slate-200 ${isInteractive ? hoverClass : ''}`;

    // Specific hover overrides if needed, currently we use a generic hover for inactive items
    // but we can colorize borders on hover if we want. For now, sticking to clean slate border.
    if (isInteractive) {
        switch (colorTheme) {
            case 'teal': return `bg-white border-teal-100 hover:border-teal-300`;
            case 'navy': return `bg-white border-indigo-100 hover:border-indigo-300`;
            case 'blue': return `bg-white border-cyan-100 hover:border-cyan-300`;
            case 'red':  return `bg-white border-red-100 hover:border-red-300`;
            case 'orange': return `bg-white border-orange-100 hover:border-orange-300`;
            default: return `bg-white border-slate-200 hover:border-slate-300`;
        }
    }

    // Non-interactive (Static)
    switch (colorTheme) {
        case 'teal': return `bg-white border-teal-100`;
        case 'navy': return `bg-white border-indigo-100`;
        case 'blue': return `bg-white border-cyan-100`;
        case 'red':  return `bg-white border-red-100`;
        case 'orange': return `bg-white border-orange-100`;
        default: return `bg-white border-slate-200`;
    }
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
      onClick={isInteractive ? onClick : undefined}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-lg border shadow-sm transition-all duration-200
        min-w-[100px] flex-1
        ${isInteractive ? 'cursor-pointer' : 'cursor-default'}
        ${getThemeClasses()}
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
