
import React, { useState, useMemo } from 'react';
import { SpecialCargoContainer } from '../types';
import { Flame, Snowflake, ChevronDown, ChevronUp, Package, Thermometer, Zap, ShieldAlert, User, Download, FileText, FileBox, Square, CheckSquare } from 'lucide-react';
import { ContainerSizeBadge } from './ContainerBadges';

interface SpecialCargoPanelProps {
  type: 'IMDG' | 'REEFER';
  containers: SpecialCargoContainer[];
  onExport: (data?: SpecialCargoContainer[]) => void;
}

export const SpecialCargoPanel: React.FC<SpecialCargoPanelProps> = ({ type, containers, onExport }) => {
  if (containers.length === 0) return null;

  const isReefer = type === 'REEFER';
  const Icon = isReefer ? Snowflake : Flame;
  const title = isReefer ? 'Conteneurs Reefer' : 'Marchandise IMDG / Dangereuse';

  const [selectedBLs, setSelectedBLs] = useState<Set<string>>(new Set());

  // Group Reefers by BL for the specific view
  const reeferGroups = useMemo(() => {
    if (!isReefer) return [];
    
    const groups = new Map<string, { client: string, containers: SpecialCargoContainer[] }>();
    
    containers.forEach(c => {
        c.bls.forEach(bl => {
            if (!groups.has(bl.num_bl)) {
                groups.set(bl.num_bl, { client: bl.client, containers: [] });
            }
            groups.get(bl.num_bl)?.containers.push(c);
        });
    });

    return Array.from(groups.entries())
        .map(([bl, data]) => ({
            bl,
            client: data.client,
            containers: data.containers
        }))
        .sort((a, b) => b.containers.length - a.containers.length);

  }, [containers, isReefer]);

  // Selection Logic
  const toggleSelectBL = (bl: string) => {
    const newSet = new Set(selectedBLs);
    if (newSet.has(bl)) {
        newSet.delete(bl);
    } else {
        newSet.add(bl);
    }
    setSelectedBLs(newSet);
  };

  const handleSelectAll = () => {
    if (selectedBLs.size === reeferGroups.length) {
        setSelectedBLs(new Set());
    } else {
        const newSet = new Set<string>();
        reeferGroups.forEach(g => newSet.add(g.bl));
        setSelectedBLs(newSet);
    }
  };

  const handleExportClick = () => {
      if (selectedBLs.size === 0) {
          onExport(containers);
      } else {
          // Filter logic: Only export containers belonging to selected BLs, 
          // AND only include the selected BLs in the export rows (handling multi-BL containers correctly)
          const filtered = containers
            .filter(c => c.bls.some(b => selectedBLs.has(b.num_bl)))
            .map(c => ({
                ...c,
                bls: c.bls.filter(b => selectedBLs.has(b.num_bl))
            }));
          onExport(filtered);
      }
  };

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
            {containers.length} Unités Trouvées
            </span>
            <button 
                onClick={handleExportClick}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors ${
                    isReefer ? 'hover:text-cyan-700' : 'hover:text-red-700'
                }`}
                title={`Télécharger le Rapport ${type}`}
            >
                <Download className="h-3.5 w-3.5" />
                Exporter {selectedBLs.size > 0 ? `(${selectedBLs.size})` : 'Liste'}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`p-6 ${isReefer ? 'bg-slate-50/50' : 'bg-white'}`}>
        {isReefer ? (
             // REEFER GRID VIEW (BL Groups)
             <div>
                 {/* Select All Bar */}
                 <div className="flex justify-end mb-4">
                     <button 
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wide"
                     >
                        {selectedBLs.size === reeferGroups.length ? (
                            <><CheckSquare className="h-4 w-4 text-blue-600" /> Tout Désélectionner</>
                        ) : (
                            <><Square className="h-4 w-4" /> Tout Sélectionner</>
                        )}
                     </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {reeferGroups.map((group, idx) => {
                        const isSelected = selectedBLs.has(group.bl);
                        return (
                            <div key={idx} className={`bg-white border rounded-lg overflow-hidden transition-all shadow-sm break-inside-avoid ${isSelected ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-300 hover:shadow-md'}`}>
                                {/* Group Header */}
                                <div 
                                    className={`px-4 py-3 border-b flex justify-between items-start cursor-pointer select-none transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200/50'}`}
                                    onClick={() => toggleSelectBL(group.bl)}
                                >
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="mt-0.5 text-blue-600">
                                            {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-slate-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-sm text-slate-700 uppercase tracking-tight">BL {group.bl}</span>
                                                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-200 shrink-0">
                                                    {group.containers.length} Ctns
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                <User className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />
                                                <span className="text-xs font-bold text-slate-600 break-words leading-tight uppercase">{group.client}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Containers Table */}
                                <table className="w-full text-xs">
                                <tbody className="divide-y divide-slate-100">
                                    {group.containers.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-50 group">
                                            <td className="py-2 pl-3 pr-1 font-mono font-bold text-slate-700 w-28 align-top pt-2.5">
                                                {c.num_conteneur}
                                            </td>
                                            <td className="py-2 px-1 w-10 text-center align-top pt-2">
                                                <ContainerSizeBadge size={c.taille_conteneur} className="scale-75 origin-center" />
                                            </td>
                                            <td className="py-2 pl-1 pr-3 text-slate-600 leading-tight break-words align-top">
                                                <div className="flex flex-col gap-1">
                                                    <span>{c.marchandise || <span className="text-slate-300 italic">Non spécifié</span>}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                        );
                    })}
                 </div>
             </div>
        ) : (
            // IMDG LIST VIEW (Standard Cards)
            <div className="grid grid-cols-1 gap-4">
                {containers.map((container) => (
                  <CargoCard key={container.num_conteneur} container={container} type={type} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

// Standard Card used for IMDG view
const CargoCard: React.FC<{ container: SpecialCargoContainer; type: 'IMDG' | 'REEFER' }> = ({ container, type }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayImdgClass = container.classe_imdg || 'Inconnue';
  const isDetected = displayImdgClass.includes('DÉTECTÉ');

  return (
    <div 
      className={`border rounded-lg transition-all duration-200 ${
        isExpanded 
          ? 'border-red-300 shadow-md bg-white'
          : 'border-slate-200 hover:border-red-200 bg-slate-50'
      }`}
    >
      <div 
        className="p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left: Identity */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="bg-white p-2 rounded-md border border-slate-200 shadow-sm shrink-0">
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
        <div className="flex-1 border-l border-slate-200 pl-4 grid grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-2 text-slate-600">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>
                    Classe: 
                    <span className={`ml-1 font-bold ${isDetected ? 'text-amber-600 bg-amber-50 px-1 rounded' : 'text-red-700'}`}>
                        {displayImdgClass}
                    </span>
                </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
                <span className="font-mono bg-red-50 text-red-800 px-1 rounded text-xs">UN</span>
                <span className="font-medium">{container.code_un || '—'}</span>
            </div>
        </div>

        {/* Right: Expand Trigger */}
        <div className="flex items-center gap-3 justify-end md:w-24 shrink-0">
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
                   <td className="py-3 text-slate-600 whitespace-normal break-words leading-tight" title={bl.client}>
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
