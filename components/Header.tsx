import React from 'react';
import { Ship } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo Section */}
          <div className="flex-shrink-0">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Logo_Port_d%27Oran.png" 
               alt="Entreprise Portuaire d’Oran Logo" 
               className="h-20 w-auto object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 e.currentTarget.nextElementSibling?.classList.remove('hidden');
               }}
             />
             {/* Fallback */}
             <div className="hidden h-14 w-14 bg-blue-900 text-white rounded flex items-center justify-center font-bold text-xl">
               EPO
             </div>
          </div>
          
          {/* Titles */}
          <div className="hidden sm:flex flex-col justify-center border-l border-slate-200 pl-6 h-14">
            <h1 className="text-xl font-bold text-slate-900 leading-none uppercase tracking-tight mb-1">
              Entreprise Portuaire d’Oran
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Manifest Control & Analysis System
            </p>
          </div>
        </div>

        {/* Right Side: Subtitle/Context */}
        <div className="flex items-center gap-2 text-slate-400">
          <div className="hidden md:block text-right mr-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Terminal & Vessel Operations</p>
            <p className="text-[10px] text-slate-300">Authorized Personnel Only</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-full border border-slate-100">
             <Ship className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
};