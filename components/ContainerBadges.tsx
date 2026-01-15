
import React from 'react';

interface SizeBadgeProps {
  size: number;
  className?: string;
}

export const ContainerSizeBadge: React.FC<SizeBadgeProps> = ({ size, className = '' }) => {
  // CSS-based badges to display the size text explicitly within a container-shaped box
  const baseClasses = "inline-flex items-center justify-center h-6 border rounded font-bold text-xs select-none shadow-sm";
  
  if (size === 20) {
    return (
      <span className={`${baseClasses} w-10 border-slate-500 text-slate-700 bg-white ${className}`} title="Conteneur Standard 20'">
        20'
      </span>
    );
  }
  
  if (size === 40) {
    return (
      <span className={`${baseClasses} w-14 border-teal-600 text-teal-700 bg-teal-50 ${className}`} title="Conteneur Standard 40'">
        40'
      </span>
    );
  }

  if (size === 45) {
    return (
      <span className={`${baseClasses} w-16 border-indigo-900 text-indigo-900 bg-indigo-50 ${className}`} title="Conteneur High Cube 45'">
        45'
      </span>
    );
  }

  // Fallback
  return (
    <span className={`${baseClasses} w-10 border-slate-300 text-slate-400 border-dashed bg-slate-50 ${className}`} title="Taille Inconnue">
      ?
    </span>
  );
};
