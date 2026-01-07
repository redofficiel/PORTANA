
import React, { useState } from 'react';
import { SpecialCargoContainer } from '../types';
import { Flame, Snowflake, ChevronDown, ChevronUp, Package, Thermometer, Zap, ShieldAlert, User, Download } from 'lucide-react';

interface SpecialCargoPanelProps {
  type: 'IMDG' | 'REEFER';
  containers: SpecialCargoContainer[];
  onExport: () => void;
}

export const SpecialCargoPanel: React.FC<SpecialCargoPanelProps> = ({ type, containers, onExport }) => {
  if (containers.length === 0) return null;

  const isReefer = type === 'REEFER';
  const Icon = isReefer ? Snowflake : Flame;
  const title = isReefer ? 'Reefer Containers' : 'IMDG / Dangerous Cargo';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fade-in">
      {/* Header */}
      <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${isReefer ? 'bg-cyan-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${isReefer ? 'text-cyan-600' : 'text-red-600'}`} />
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            isReefer ? 'bg-cyan-100 text-cyan-800 border-cyan-200' : 'bg-red-100 text-red-800 border-red-200'
            }`}>
            {containers.length} Units Found
            </span>
            <button 
                onClick={onExport}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors ${
                    isReefer ? 'hover:text-cyan-700' : 'hover:text-red-700'
                }`}
                title={`Download ${type} Report`}
            >
                <Download className="h-3.5 w-3.5" />
                Export List
            </button>
        </div>
      </div>

      {/* List */}
      <div className="p-6 grid grid-cols-1 gap-4">
        {containers.map((container) => (
          <CargoCard key={container.num_conteneur} container={container} type={type} />
        ))}
      </div>
    </div>
  );
};

const CargoCard: React.FC<{ container: SpecialCargoContainer; type: 'IMDG' | 'REEFER' }> = ({ container, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isReefer = type === 'REEFER';
  
  // Reefer derived data
  const powerRequired = container.is_active_reefer ? "Yes" : "No";

  return (
    <div 
      className={`border rounded-lg transition-all duration-200 ${
        isExpanded 
          ? (isReefer ? 'border-cyan-300 shadow-md bg-white' : 'border-red-300 shadow-md bg-white') 
          : `border-slate-200 ${isReefer ? 'hover:border-cyan-200' : 'hover:border-red-200'} bg-slate-50`
      }`}
    >
      <div 
        className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Identity */}
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm">
            <Package className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 font-mono tracking-wide">{container.num_conteneur}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                container.taille_conteneur === 20 ? 'bg-slate-100 text-slate-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {container.taille_conteneur}' {container.code_iso}
              </span>
              
              {container.bls.length > 1 && (
                 <span className="text-xs text-orange-600 font-bold bg-orange-50 px-1.5 rounded border border-orange-100">
                   Multi-BL
                 </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Specific Data */}
        <div className="flex-1 grid grid-cols-2 gap-4 text-sm border-l border-slate-200 pl-4">
            {isReefer ? (
                <>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Thermometer className="h-4 w-4 text-cyan-500" />
                        <span className="font-medium">{container.temperature ? `${container.temperature}°C` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span>Power Required: <span className="font-bold text-slate-900">{powerRequired}</span></span>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2 text-slate-600">
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                        <span>Class: <span className="font-bold text-red-700">{container.classe_imdg || 'Unknown'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-mono bg-red-50 text-red-800 px-1 rounded text-xs">UN</span>
                        <span className="font-medium">{container.code_un || '—'}</span>
                    </div>
                </>
            )}
        </div>

        {/* Right: Expand Trigger */}
        <div className="flex items-center gap-3 justify-end md:w-24">
          <div className="flex -space-x-2 mr-2">
             {[...Array(Math.min(3, container.bls.length))].map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-500 font-bold z-0">
                  <User className="h-3 w-3" />
                </div>
             ))}
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Details (BL List) */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-white p-4 animate-in slide-in-from-top-2 duration-200">
           <table className="min-w-full text-sm">
             <thead>
               <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                 <th className="pb-2 pl-2">BL Number</th>
                 <th className="pb-2">Client Final</th>
                 <th className="pb-2 text-right">Weight (Kg)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {container.bls.map((bl, idx) => (
                 <tr key={idx} className="group hover:bg-slate-50">
                   <td className="py-3 pl-2 font-mono text-slate-700 font-medium transition-colors">
                     {bl.num_bl}
                   </td>
                   <td className="py-3 text-slate-600 max-w-xs truncate" title={bl.client}>
                     {bl.client}
                   </td>
                   <td className="py-3 text-right text-slate-600 font-mono">
                     {bl.weight?.toLocaleString() || '—'}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};
