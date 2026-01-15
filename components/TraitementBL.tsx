
import React, { useState, useEffect, useMemo } from 'react';
import { ContainerRow, ApcsRecord } from '../types';
import { Play, FileText, CheckCircle2, Loader2, Snowflake, Flame, Layers, BoxSelect, AlertTriangle, Tag, EyeOff, Eye, Anchor, Check, Square, CheckSquare, Download, Ship, User } from 'lucide-react';
import { ContainerSizeBadge } from './ContainerBadges';
import * as XLSX from 'xlsx';

interface TraitementBLProps {
  rawData: ContainerRow[];
  dischargedMap?: Map<string, ApcsRecord>;
}

// Nouvelle structure de groupe pour l'affichage en colonnes
interface BLGroup {
  bl: string;
  vesselName: string;
  arrivalDate: string;
  client: string; // Déplacé au niveau du groupe
  count: number;
  dischargedCount: number;
  isFullyDischarged: boolean;
  commodities: { name: string; count: number }[];
  rows: {
    data: ContainerRow;
    isDischarged: boolean;
    dischargeDate?: string;
  }[];
}

export const TraitementBL: React.FC<TraitementBLProps> = ({ rawData, dischargedMap }) => {
  const [processedGroups, setProcessedGroups] = useState<BLGroup[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCommodity, setShowCommodity] = useState(false);
  
  // State for Selection
  const [selectedBLs, setSelectedBLs] = useState<Set<string>>(new Set());
  
  // Re-run processing when rawData OR dischargedMap changes
  useEffect(() => {
    if (processedGroups) {
        runProcessing(false);
    }
  }, [dischargedMap]);

  const runProcessing = async (showLoading = true) => {
    if (!rawData || rawData.length === 0) return;

    if (showLoading) {
        setIsProcessing(true);
        setSuccessMessage(null);
        setProcessedGroups(null);
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      // 1. Grouping by BL
      const blMap = new Map<string, ContainerRow[]>();
      rawData.forEach(rawRow => {
        const bl = rawRow.num_bl || 'SANS_BL';
        if (!blMap.has(bl)) {
          blMap.set(bl, []);
        }
        blMap.get(bl)!.push(rawRow);
      });

      // 2. Prepare Groups
      const groups: BLGroup[] = Array.from(blMap.entries()).map(([bl, rows]) => {
        const commMap = new Map<string, number>();
        let dischargedInBl = 0;

        rows.forEach(r => {
            const name = r.marchandise && r.marchandise.trim() !== '' ? r.marchandise : 'NON DÉCLARÉ';
            commMap.set(name, (commMap.get(name) || 0) + 1);

            if (dischargedMap?.has(r.num_conteneur)) {
                dischargedInBl++;
            }
        });
        
        const commodities = Array.from(commMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        // Tri des conteneurs par clé (Dernier chiffre)
        const sortedRows = [...rows].sort((a, b) => {
            const getKey = (str: string) => {
                const clean = str ? str.trim() : '';
                if (clean.length === 0) return 10;
                const lastChar = clean.slice(-1);
                const num = parseInt(lastChar, 10);
                return isNaN(num) ? 10 : num;
            };
            const keyA = getKey(a.num_conteneur);
            const keyB = getKey(b.num_conteneur);
            if (keyA !== keyB) return keyA - keyB;
            return a.num_conteneur.localeCompare(b.num_conteneur);
        });

        // Construction des lignes de conteneurs enrichies
        const containerLines = sortedRows.map(row => {
            const dischargeInfo = dischargedMap?.get(row.num_conteneur);
            return {
                data: row,
                isDischarged: !!dischargeInfo,
                dischargeDate: dischargeInfo?.date
            };
        });

        return {
            bl,
            vesselName: rows[0]?.nom_navire || '',
            arrivalDate: rows[0]?.date_manifeste || '',
            client: rows[0]?.client_final || 'CLIENT INCONNU', // Client unique par BL
            count: rows.length,
            dischargedCount: dischargedInBl,
            isFullyDischarged: rows.length > 0 && dischargedInBl === rows.length,
            commodities,
            rows: containerLines
        };
      });

      // 3. Sorting Groups (Larger BLs first)
      groups.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.bl.localeCompare(b.bl);
      });

      setProcessedGroups(groups);
      if (showLoading) setSuccessMessage("Liste générée : Affichage parallèle optimisé.");

    } catch (error) {
      console.error("Erreur lors du traitement BL", error);
    } finally {
      if (showLoading) setIsProcessing(false);
    }
  };

  // --- SELECTION LOGIC ---
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
    if (!processedGroups) return;
    
    if (selectedBLs.size === processedGroups.length) {
        setSelectedBLs(new Set()); // Deselect all
    } else {
        const newSet = new Set<string>();
        processedGroups.forEach(g => newSet.add(g.bl));
        setSelectedBLs(newSet);
    }
  };

  // --- EXPORT LOGIC ---
  const handleDownloadExcel = () => {
    if (!processedGroups) return;

    // 1. Filtrer les groupes
    const groupsToExport = selectedBLs.size > 0 
        ? processedGroups.filter(g => selectedBLs.has(g.bl))
        : processedGroups;

    if (groupsToExport.length === 0) return;

    // 2. Construction des données structurées (Array of Arrays)
    const sheetData: any[][] = [];

    // Titre Global du Document
    sheetData.push(["LISTE DE DÉCHARGEMENT / PLANIFICATION", "", "", "", "", ""]);
    sheetData.push([`Exporté le: ${new Date().toLocaleString()}`, "", "", "", "", ""]);
    sheetData.push(["", "", "", "", "", ""]); // Ligne vide

    groupsToExport.forEach(group => {
        // --- Ligne EN-TÊTE BL ---
        // On place les infos clés sur la première ligne du bloc
        // Col A: BL, Col B: Navire, Col C: Date, Col D: Client, Col E: Stats
        sheetData.push([
            `BL: ${group.bl}`,
            `Navire: ${group.vesselName}`,
            `Arrivée: ${group.arrivalDate}`,
            `Client: ${group.client}`, // Le client est ici
            `Total: ${group.count} / Débarqués: ${group.dischargedCount}`,
            group.isFullyDischarged ? "COMPLET" : "EN COURS"
        ]);

        // --- Ligne EN-TÊTE COLONNES CONTENEURS ---
        sheetData.push(["N° Conteneur", "Taille", "Type ISO", "Marchandise", "Statut", "Date Déb."]);

        // --- Lignes CONTENEURS ---
        group.rows.forEach(rowObj => {
            sheetData.push([
                rowObj.data.num_conteneur,
                rowObj.data.taille_conteneur,
                rowObj.data.code_iso,
                rowObj.data.marchandise,
                rowObj.isDischarged ? "DÉBARQUÉ" : "À BORD",
                rowObj.dischargeDate || "-"
            ]);
        });

        // --- SÉPARATION ---
        // Deux lignes vides entre chaque BL pour aérer le tableau Excel
        sheetData.push(["", "", "", "", "", ""]);
        sheetData.push(["", "", "", "", "", ""]);
    });

    // 3. Création de la feuille
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // 4. Définition des largeurs de colonnes pour une meilleure lisibilité
    const wscols = [
        { wch: 25 }, // A: N° Conteneur / BL Info
        { wch: 20 }, // B: Taille / Navire
        { wch: 15 }, // C: Type ISO / Date
        { wch: 50 }, // D: Marchandise / Client (Large pour le nom complet)
        { wch: 15 }, // E: Statut / Stats
        { wch: 15 }  // F: Date Déb
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Planification");
    
    // 5. Téléchargement
    const dateStr = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `Planification_BL_Groupée_${dateStr}.xlsx`);
  };

  // Helper Display
  const formatContainerDisplay = (num: string) => {
    if (!num) return "";
    const clean = num.trim();
    if (clean.length === 11) {
       return (
         <>
           <span>{clean.substring(0, 10)}</span>
           <span className="ml-1 text-inherit opacity-70 font-black bg-slate-100 px-1 rounded border border-slate-200">{clean.substring(10)}</span>
         </>
       );
    }
    return clean;
  };

  const renderContainerIcons = (row: ContainerRow) => {
    const isFlatOrOpen = row.code_iso && (row.code_iso.includes('P') || row.code_iso.includes('U'));
    const isReefer = row.indicateur_reefer === '1' || (row.code_iso && row.code_iso.startsWith('R'));
    const isImdg = !!row.classe_imdg || !!row.code_un;
    const isGroupage = row.indicateur_groupage === '1';

    return (
      <div className="flex items-center gap-1.5 ml-auto">
        {isReefer && <div className="p-0.5 rounded bg-cyan-100 border border-cyan-200"><Snowflake className="h-3 w-3 text-cyan-600" /></div>}
        {isImdg && <div className="p-0.5 rounded bg-red-100 border border-red-200"><AlertTriangle className="h-3 w-3 text-red-600" /></div>}
        {isFlatOrOpen && <div className="p-0.5 rounded bg-slate-200 border border-slate-300"><BoxSelect className="h-3 w-3 text-slate-700" /></div>}
        {isGroupage && <div className="p-0.5 rounded bg-orange-100 border border-orange-200"><Layers className="h-3 w-3 text-orange-600" /></div>}
      </div>
    );
  };

  // RENDER BL GROUP CARD
  const renderBLGroup = (group: BLGroup, idx: number) => {
    const isSelected = selectedBLs.has(group.bl);
    const headerClass = group.isFullyDischarged
        ? "bg-emerald-700 border-white text-white" 
        : isSelected ? "bg-blue-100 text-blue-900 border-blue-200" : "bg-slate-100 text-slate-800 border-slate-200"; 
    
    const countBadgeClass = group.isFullyDischarged ? "bg-emerald-600 text-white" : "bg-white border border-slate-300 text-slate-700";

    return (
        <div key={`${group.bl}-${idx}`} className="mb-4 break-inside-avoid border border-slate-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header BL */}
            <div className={`px-3 py-2 border-b ${headerClass}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div 
                            onClick={(e) => { e.stopPropagation(); toggleSelectBL(group.bl); }}
                            className="cursor-pointer hover:scale-110 transition-transform"
                        >
                            {isSelected 
                                ? <CheckSquare className={`h-5 w-5 ${group.isFullyDischarged ? 'text-white' : 'text-blue-600'}`} /> 
                                : <Square className={`h-5 w-5 ${group.isFullyDischarged ? 'text-emerald-300' : 'text-slate-400'}`} />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm uppercase tracking-tight whitespace-nowrap">BL {group.bl}</span>
                                {group.isFullyDischarged && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                            </div>
                            {/* CLIENT MOVED TO HEADER - FULL WIDTH DISPLAY */}
                            <div className="flex items-start gap-1.5 mt-1">
                                <User className={`h-3 w-3 mt-0.5 shrink-0 ${group.isFullyDischarged ? 'text-emerald-200' : 'text-slate-500'}`} />
                                <span className={`text-xs font-bold whitespace-normal break-words leading-tight ${group.isFullyDischarged ? 'text-emerald-100' : 'text-slate-700'}`}>
                                    {group.client}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`px-2 py-0.5 rounded text-xs font-bold shrink-0 ${countBadgeClass}`}>
                        {group.dischargedCount} / {group.count}
                    </div>
                </div>

                {showCommodity && (
                    <div className={`mt-2 pt-1 border-t ${group.isFullyDischarged ? 'border-emerald-600' : 'border-slate-200'} space-y-0.5`}>
                        {group.commodities.map((c, i) => (
                            <div key={i} className="flex justify-between items-center text-[10px]">
                                <span className="truncate max-w-[180px] font-medium opacity-90">{c.name}</span>
                                <span className="font-mono opacity-80">{c.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* List Containers */}
            <div className="bg-white">
                <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                        {group.rows.map((rowObj, rIdx) => (
                            <tr key={rIdx} className={rowObj.isDischarged ? 'bg-emerald-50/50' : ''}>
                                <td className="py-1.5 pl-3 pr-2 w-8 text-center">
                                    {rowObj.isDischarged 
                                        ? <Check className="h-3 w-3 text-emerald-600" /> 
                                        : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 mx-auto" />
                                    }
                                </td>
                                <td className={`py-1.5 px-1 font-mono font-bold ${rowObj.isDischarged ? 'text-emerald-800' : 'text-slate-700'}`}>
                                    {formatContainerDisplay(rowObj.data.num_conteneur)}
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                     <ContainerSizeBadge size={rowObj.data.taille_conteneur} className="scale-75 origin-center" />
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                    {renderContainerIcons(rowObj.data)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header / Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Traitement BL</h3>
            <p className="text-xs text-slate-500">
                {selectedBLs.size > 0 ? `${selectedBLs.size} BL(s) sélectionné(s)` : 'Affichage parallèle'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <button
                onClick={() => setShowCommodity(!showCommodity)}
                disabled={!processedGroups}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                    showCommodity 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                } ${!processedGroups ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {showCommodity ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                Marchandise
            </button>

            {/* DOWNLOAD EXCEL BUTTON */}
            {processedGroups && (
                <button
                    onClick={handleDownloadExcel}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                        'bg-emerald-600 text-white border-emerald-700 shadow-sm hover:bg-emerald-700'
                    }`}
                >
                    <Download className="h-3.5 w-3.5" />
                    Excel ({selectedBLs.size > 0 ? selectedBLs.size : 'Tout'})
                </button>
            )}

            <button
            onClick={() => runProcessing(true)}
            disabled={isProcessing || !rawData}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all ${
                isProcessing 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
            }`}
            >
            {isProcessing ? (
                <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Traitement...
                </>
            ) : (
                <>
                <Play className="h-4 w-4 fill-current" />
                Lancer le traitement
                </>
            )}
            </button>
        </div>
      </div>

      {/* Success Message Area */}
      {successMessage && (
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center gap-2 text-emerald-700 text-sm font-medium animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Results Area */}
      <div className="flex-grow overflow-auto bg-slate-50/50 p-6">
        {!processedGroups ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <FileText className="h-16 w-16 mb-4 text-slate-300" />
            <p className="text-lg font-medium">En attente de traitement</p>
            <p className="text-sm">Cliquez sur "Lancer le traitement" pour organiser les BL.</p>
          </div>
        ) : (
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:text-slate-700 text-slate-500 font-bold uppercase text-xs" onClick={handleSelectAll}>
                        {processedGroups.length > 0 && selectedBLs.size < processedGroups.length ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4 text-blue-600" />}
                        Tout Sélectionner / Désélectionner
                    </div>
                </div>

                {/* 2-COLUMN GRID LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    {/* LEFT COLUMN (Even Indices) */}
                    <div className="flex flex-col gap-0">
                        {processedGroups
                            .filter((_, idx) => idx % 2 === 0)
                            .map((group, idx) => renderBLGroup(group, idx * 2))
                        }
                    </div>

                    {/* RIGHT COLUMN (Odd Indices) */}
                    <div className="flex flex-col gap-0">
                        {processedGroups
                            .filter((_, idx) => idx % 2 !== 0)
                            .map((group, idx) => renderBLGroup(group, (idx * 2) + 1))
                        }
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
