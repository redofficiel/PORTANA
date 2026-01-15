
import React, { useState } from 'react';
import { ContainerError } from '../types';
import { AlertTriangle, ChevronDown, ChevronUp, Package, User, FileWarning, Download } from 'lucide-react';
import { ContainerSizeBadge } from './ContainerBadges';

interface ErrorAnalysisPanelProps {
  errors: ContainerError[];
  onExport: () => void;
}

export const ErrorAnalysisPanel: React.FC<ErrorAnalysisPanelProps> = ({ errors, onExport }) => {
  if (errors.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fade-in">
      <div className="px-6 py-4 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600" />
          <h3 className="font-bold text-slate-800 text-lg">Anomalies & Erreurs de Données</h3>
        </div>
        <div className="flex items-center gap-3">
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200">
            {errors.length} Problèmes Détectés
            </span>
            <button 
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-rose-700 transition-colors"
                title="Télécharger le rapport d'anomalies"
            >
                <Download className="h-3.5 w-3.5" />
                Exporter Liste
            </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 gap-4">
        {errors.map((container, idx) => (
          <ErrorCard key={`${container.num_conteneur}-${idx}`} container={container} />
        ))}
      </div>
    </div>
  );
};

const ErrorCard: React.FC<{ container: ContainerError }> = ({ container }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`border rounded-lg transition-all duration-200 ${isExpanded ? 'border-rose-300 shadow-md bg-white' : 'border-slate-200 hover:border-rose-200 bg-slate-50'}`}
    >
      <div 
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm">
            <FileWarning className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 font-mono tracking-wide">
              {container.num_conteneur && container.num_conteneur !== 'INCONNU' && container.num_conteneur !== 'UNKNOWN' ? container.num_conteneur : <span className="text-red-500 italic">Numéro Inconnu</span>}
            </p>
            <div className="flex items-center gap-2 mt-2">
               {/* Display Badges for Reasons */}
               {container.reasons.map((reason, i) => (
                 <span key={i} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                   {reason}
                 </span>
               ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 sm:mt-0">
          <div className="text-right hidden sm:block">
             <div className="flex items-center gap-2 justify-end mb-1">
                <span className="text-xs text-slate-500">Taille Déclarée:</span>
                <ContainerSizeBadge size={container.taille_conteneur} />
             </div>
             <div className="flex items-center gap-2 justify-end">
                <span className="text-xs text-slate-500">ISO:</span>
                <span className={`font-mono text-xs font-bold ${!container.code_iso ? 'text-red-500' : 'text-slate-700'}`}>
                    {container.code_iso || 'VIDE'}
                </span>
             </div>
          </div>

          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 bg-white p-4 animate-in slide-in-from-top-2 duration-200">
           <table className="min-w-full text-sm">
             <thead>
               <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-100">
                 <th className="pb-2 pl-2">N° BL</th>
                 <th className="pb-2">Client Final</th>
                 <th className="pb-2 text-right">Poids (Kg)</th>
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
