
import React, { useState, useMemo } from 'react';
import { ContainerRow, ApcsRecord } from '../types';
import { TraitementBL } from './TraitementBL';
import { ClipboardList, UploadCloud, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight } from 'lucide-react';

interface PlanificationPanelProps {
  data: ContainerRow[] | null;
  fileName: string;
}

export const PlanificationPanel: React.FC<PlanificationPanelProps> = ({ data, fileName }) => {
  const [apcsInput, setApcsInput] = useState('');
  const [dischargedMap, setDischargedMap] = useState<Map<string, ApcsRecord>>(new Map());
  const [showApcsInput, setShowApcsInput] = useState(false);

  // Parsing Logic
  const handleApcsAnalysis = () => {
    if (!apcsInput.trim()) return;

    const newMap = new Map<string, ApcsRecord>(dischargedMap);
    const lines = apcsInput.split('\n');
    
    // Regex for Container ISO (4 letters + 7 digits)
    const containerRegex = /\b([A-Z]{4})[\s-]?(\d{7})\b/;
    // Basic date finder (DD/MM/YYYY or DD-MM-YYYY)
    const dateRegex = /\b(\d{2}[/-]\d{2}[/-]\d{4})\b/;

    lines.forEach(line => {
      const cMatch = line.toUpperCase().match(containerRegex);
      if (cMatch) {
        // Standardize format to XXXX0000000
        const cleanNum = cMatch[1] + cMatch[2];
        const dMatch = line.match(dateRegex);
        
        newMap.set(cleanNum, {
          containerNum: cleanNum,
          rawLine: line.trim(),
          date: dMatch ? dMatch[0] : undefined
        });
      }
    });

    setDischargedMap(newMap);
    setApcsInput(''); // Clear input after processing
  };

  const clearApcsData = () => {
    setDischargedMap(new Map());
  };

  // Statistics for the UI
  const stats = useMemo(() => {
    if (!data) return { matched: 0, unexpected: 0, totalApcs: 0 };
    
    let matched = 0;
    let unexpected = 0;
    
    // Create a set of valid manifest containers for quick lookup
    const manifestSet = new Set(data.map(r => r.num_conteneur));

    dischargedMap.forEach((_, key) => {
      if (manifestSet.has(key)) {
        matched++;
      } else {
        unexpected++;
      }
    });

    return { matched, unexpected, totalApcs: dischargedMap.size };
  }, [dischargedMap, data]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
        <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">Aucune donnée chargée</h3>
        <p className="text-slate-500 mt-2 text-sm">Veuillez d'abord importer un manifeste dans l'onglet Analyseur.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
      
      {/* Context Header */}
      <div className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
                <ClipboardList className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-lg font-bold">Module Planification & Suivi</h2>
                <p className="text-indigo-200 text-xs">Fichier actif : {fileName}</p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            {dischargedMap.size > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 uppercase">Débarqués</p>
                        <p className="text-lg font-bold text-emerald-400">{stats.matched}</p>
                    </div>
                    {stats.unexpected > 0 && (
                         <div className="text-center border-l border-slate-600 pl-4">
                            <p className="text-[10px] text-slate-400 uppercase">Hors Manifeste</p>
                            <p className="text-lg font-bold text-orange-400">{stats.unexpected}</p>
                        </div>
                    )}
                </div>
            )}
            
            <button 
                onClick={() => setShowApcsInput(!showApcsInput)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    showApcsInput ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 hover:bg-indigo-50'
                }`}
            >
                <UploadCloud className="h-4 w-4" />
                {showApcsInput ? 'Masquer Import APCS' : 'Import APCS'}
            </button>
        </div>
      </div>

      {/* APCS Input Zone (Collapsible) */}
      {showApcsInput && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-indigo-900 font-bold flex items-center gap-2">
                        <UploadCloud className="h-5 w-5" />
                        Zone de Rapprochement APCS
                    </h3>
                    <p className="text-indigo-700 text-sm mt-1">
                        Copiez-collez ici les listes de conteneurs débarqués (depuis Excel, PDF, ou APCS). 
                        Le système détectera automatiquement les numéros.
                    </p>
                </div>
                {dischargedMap.size > 0 && (
                    <button 
                        onClick={clearApcsData}
                        className="text-xs text-red-600 hover:text-red-800 underline flex items-center gap-1"
                    >
                        <X className="h-3 w-3" /> Réinitialiser le suivi
                    </button>
                )}
            </div>
            
            <div className="flex gap-4">
                <textarea
                    value={apcsInput}
                    onChange={(e) => setApcsInput(e.target.value)}
                    placeholder={`Exemple de format accepté :\nBL123456  TCNU1234567  20GP  01/01/2024\n...\n(Collez simplement votre texte brut ici)`}
                    className="flex-1 h-32 p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-700"
                />
                <button
                    onClick={handleApcsAnalysis}
                    disabled={!apcsInput.trim()}
                    className="self-end px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <RefreshCw className="h-4 w-4" />
                    Traiter
                </button>
            </div>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
         <div className="min-h-[600px]">
            <TraitementBL 
                rawData={data} 
                dischargedMap={dischargedMap} 
            />
         </div>
      </div>
    </div>
  );
};
