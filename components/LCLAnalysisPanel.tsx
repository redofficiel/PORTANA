
import React, { useState } from 'react';
import { LCLContainer } from '../types';
import { Layers, ChevronDown, ChevronUp, Package, User, Download } from 'lucide-react';

interface LCLAnalysisPanelProps {
  lclContainers: LCLContainer[];
  onExport: () => void;
}

export const LCLAnalysisPanel: React.FC<LCLAnalysisPanelProps> = ({ lclContainers, onExport }) => {
  if (lclContainers.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-fade-in">
      <div className="px-6 py-4 border-b border-slate-200 bg-orange-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-orange-600" />
          <h3 className="font-bold text-slate-800 text-lg">LCL / Groupage Containers</h3>
        </div>
        <div className="flex items-center gap-3">
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full border border-orange-200">
            {lclContainers.length} Multi-BL Containers Detected
            </span>
            <button 
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-orange-700 transition-colors"
                title="Download LCL Report"
            >
                <Download className="h-3.5 w-3.5" />
                Export List
            </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 gap-4">
        {lclContainers.map((container) => (
          <LCLContainerCard key={container.num_conteneur} container={container} />
        ))}
      </div>
    </div>
  );
};

const LCLContainerCard: React.FC<{ container: LCLContainer }> = ({ container }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`border rounded-lg transition-all duration-200 ${isExpanded ? 'border-orange-300 shadow-md bg-white' : 'border-slate-200 hover:border-orange-200 bg-slate-50'}`}
    >
      <div 
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm">
            <Package className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 font-mono tracking-wide">{container.num_conteneur}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                container.taille_conteneur === 20 ? 'bg-green-100 text-green-700' :
                container.taille_conteneur === 40 ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {container.taille_conteneur > 0 ? `${container.taille_conteneur}'` : 'Unknown Size'}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 font-medium">{container.bls.length} Bills of Lading</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <div className="flex -space-x-2 mr-2">
             {/* Visual stack hint */}
             {[...Array(Math.min(3, container.bls.length))].map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-500 font-bold z-0">
                  <User className="h-3 w-3" />
                </div>
             ))}
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </div>

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
                   <td className="py-3 pl-2 font-mono text-slate-700 font-medium group-hover:text-orange-600 transition-colors">
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
