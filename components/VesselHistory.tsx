
import React, { useState, useMemo, useEffect } from 'react';
import { VesselRecord } from '../types';
import { Calendar, Trash2, Eye, Ship, Package, BarChart3, Filter, AlertOctagon, Pencil, Check, X } from 'lucide-react';

interface VesselHistoryProps {
  records: VesselRecord[];
  onView: (record: VesselRecord) => void;
  onUpdate: (id: string, updates: { 
    name: string, voyage: string, 
    c20: number, c40: number, c45: number,
    rf20: number, rf40: number,
    im20: number, im40: number
  }) => void;
  // Renamed props to indicate they trigger a request, not the direct action
  onRequestDelete: (id: string, shipName: string) => void;
  onRequestDeleteSelected: (ids: string[]) => void;
  onRequestClearAll: () => void;
}

export const VesselHistory: React.FC<VesselHistoryProps> = ({ 
  records, 
  onView, 
  onUpdate,
  onRequestDelete, 
  onRequestDeleteSelected, 
  onRequestClearAll 
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempVoyage, setTempVoyage] = useState("");
  const [tempC20, setTempC20] = useState(0);
  const [tempC40, setTempC40] = useState(0);
  const [tempC45, setTempC45] = useState(0);
  // New Edit State for Special Cargo
  const [tempRf20, setTempRf20] = useState(0);
  const [tempRf40, setTempRf40] = useState(0);
  const [tempIm20, setTempIm20] = useState(0);
  const [tempIm40, setTempIm40] = useState(0);

  // Sync selection with records: if a record is deleted externally, remove it from selection
  useEffect(() => {
    setSelectedIds(prev => {
        const newSet = new Set<string>();
        prev.forEach(id => {
            if (records.find(r => r.id === id)) {
                newSet.add(id);
            }
        });
        return newSet;
    });
  }, [records]);

  // Extract available years from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear()); // Always include current year
    records.forEach(r => {
        const d = new Date(r.uploadDate);
        years.add(d.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  // Filter records by selection (Visual Filter)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const d = new Date(r.uploadDate);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    }).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [records, selectedYear, selectedMonth]);

  // Calculate Monthly KPIs based on visual filter
  const kpis = useMemo(() => {
    const totalVessels = filteredRecords.length;
    const totalContainers = filteredRecords.reduce((acc, r) => acc + r.stats.totalContainers, 0);
    const avgDischarge = totalVessels > 0 ? Math.round(totalContainers / totalVessels) : 0;
    
    // Estimate TEUs (20' = 1 TEU, 40'/45' = 2 TEU)
    const totalTEU = filteredRecords.reduce((acc, r) => {
        return acc + r.stats.count20 + ((r.stats.count40 + r.stats.count45) * 2);
    }, 0);

    return { totalVessels, totalContainers, avgDischarge, totalTEU };
  }, [filteredRecords]);

  // --- Selection Logic ---

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = new Set(selectedIds);
    if (e.target.checked) {
        // Select all currently visible records
        filteredRecords.forEach(r => newSelected.add(r.id));
    } else {
        // Deselect all currently visible records
        filteredRecords.forEach(r => newSelected.delete(r.id));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
        newSelected.delete(id);
    } else {
        newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // --- Edit Logic ---
  const startEdit = (e: React.MouseEvent, record: VesselRecord) => {
      e.stopPropagation();
      setEditingId(record.id);
      setTempName(record.manifest.nom_navire || "");
      setTempVoyage(record.manifest.num_voyage || "");
      setTempC20(record.stats.count20);
      setTempC40(record.stats.count40);
      setTempC45(record.stats.count45);
      
      setTempRf20(record.stats.countReefer20 || 0);
      setTempRf40(record.stats.countReefer40 || 0);
      setTempIm20(record.stats.countIMDG20 || 0);
      setTempIm40(record.stats.countIMDG40 || 0);
  };

  const cancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
      setTempName("");
      setTempVoyage("");
      setTempC20(0);
      setTempC40(0);
      setTempC45(0);
      setTempRf20(0);
      setTempRf40(0);
      setTempIm20(0);
      setTempIm40(0);
  };

  const saveEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (editingId) {
          onUpdate(id, {
             name: tempName,
             voyage: tempVoyage,
             c20: Number(tempC20) || 0,
             c40: Number(tempC40) || 0,
             c45: Number(tempC45) || 0,
             rf20: Number(tempRf20) || 0,
             rf40: Number(tempRf40) || 0,
             im20: Number(tempIm20) || 0,
             im40: Number(tempIm40) || 0
          });
          setEditingId(null);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') {
           e.stopPropagation();
           onUpdate(id, {
             name: tempName,
             voyage: tempVoyage,
             c20: Number(tempC20) || 0,
             c40: Number(tempC40) || 0,
             c45: Number(tempC45) || 0,
             rf20: Number(tempRf20) || 0,
             rf40: Number(tempRf40) || 0,
             im20: Number(tempIm20) || 0,
             im40: Number(tempIm40) || 0
           });
           setEditingId(null);
      }
      if (e.key === 'Escape') {
          cancelEdit(e as any);
      }
  };

  // Check if all visible items are selected
  const allVisibleSelected = filteredRecords.length > 0 && filteredRecords.every(r => selectedIds.has(r.id));
  const someVisibleSelected = filteredRecords.some(r => selectedIds.has(r.id));

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Filters & KPIs Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
            <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-slate-500" />
                    Historique Mensuel des Escales
                </h2>
                <p className="text-sm text-slate-500 mt-1">Consultez les déchargements passés et les statistiques opérationnelles.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                {/* Delete Selected Button */}
                {selectedIds.size > 0 && (
                    <button
                        onClick={() => onRequestDeleteSelected(Array.from(selectedIds))}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-red-600 border border-red-700 rounded-lg hover:bg-red-700 shadow-sm transition-all animate-in fade-in slide-in-from-right-2"
                        title="Supprimer la sélection"
                    >
                        <Trash2 className="h-4 w-4" />
                        Supprimer ({selectedIds.size})
                    </button>
                )}

                {/* Clear All Button */}
                {records.length > 0 && (
                    <button
                        onClick={onRequestClearAll}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        title="Vider tout l'historique"
                    >
                        <AlertOctagon className="h-4 w-4" />
                        Tout Supprimer
                    </button>
                )}
                
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200 ml-2">
                    <Filter className="h-4 w-4 text-slate-400 ml-2" />
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                        {monthNames.map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                        ))}
                    </select>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Total Navires</p>
                <div className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-indigo-400" />
                    <span className="text-2xl font-bold text-indigo-900">{kpis.totalVessels}</span>
                </div>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Conteneurs</p>
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-900">{kpis.totalContainers.toLocaleString()}</span>
                </div>
            </div>
             <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total EVP (TEU)</p>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <span className="text-2xl font-bold text-blue-900">{kpis.totalTEU.toLocaleString()}</span>
                </div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Moy. Déchargement</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-800">{kpis.avgDischarge.toLocaleString()}</span>
                    <span className="text-xs text-slate-500 font-medium self-end mb-1">unités/navire</span>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Vessel Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
                <Ship className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p>Aucun enregistrement trouvé pour {monthNames[selectedMonth]} {selectedYear}.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-3 text-left w-10">
                            <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                checked={allVisibleSelected}
                                ref={input => {
                                    if (input) {
                                        input.indeterminate = !allVisibleSelected && someVisibleSelected;
                                    }
                                }}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Navire</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Voy.</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Esc.</th>
                        
                        {/* Breakdown Columns */}
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border-l border-slate-200 w-16">20'</th>
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 w-16">40'</th>
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 border-r border-slate-200 w-16">45'</th>
                        
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 border-r border-cyan-100 w-16">Ref 20'</th>
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-cyan-700 uppercase tracking-wider bg-cyan-50 border-r border-slate-200 w-16">Ref 40'</th>
                        
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-red-700 uppercase tracking-wider bg-red-50 border-r border-red-100 w-16">IMO 20'</th>
                        <th className="px-2 py-3 text-center text-[10px] font-bold text-red-700 uppercase tracking-wider bg-red-50 border-r border-slate-200 w-16">IMO 40'</th>

                        {/* SWAPPED COLUMNS: Total then EVP */}
                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 border-r border-blue-100 whitespace-nowrap">EVP</th>
                        
                        <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {filteredRecords.map((record) => {
                        // Calculate EVP (TEU)
                        const evp = record.stats.count20 + (record.stats.count40 * 2) + (record.stats.count45 * 2);
                        const isSelected = selectedIds.has(record.id);
                        const isEditing = editingId === record.id;

                        return (
                        <tr 
                            key={record.id} 
                            className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                            onClick={() => handleSelectRow(record.id)}
                        >
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                    checked={isSelected}
                                    onChange={() => handleSelectRow(record.id)}
                                />
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-600">
                                {record.manifest.date_manifeste || new Date(record.uploadDate).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-bold text-slate-800" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={tempName} 
                                        onChange={(e) => setTempName(e.target.value)} 
                                        className="w-full px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        autoFocus
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    record.manifest.nom_navire
                                )}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-600 font-mono" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={tempVoyage} 
                                        onChange={(e) => setTempVoyage(e.target.value)} 
                                        className="w-full px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    record.manifest.num_voyage
                                )}
                            </td>
                             <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                                {record.manifest.numero_escale}
                            </td>
                            
                            {/* Breakdown Data - Editable Counts */}
                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center font-medium border-l border-slate-100 bg-opacity-50" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempC20} 
                                        onChange={(e) => setTempC20(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    <span className="text-slate-700">{record.stats.count20}</span>
                                )}
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center font-medium bg-opacity-50" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempC40} 
                                        onChange={(e) => setTempC40(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    <span className="text-slate-700">{record.stats.count40}</span>
                                )}
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center font-medium border-r border-slate-100 bg-opacity-50" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempC45} 
                                        onChange={(e) => setTempC45(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    <span className="text-slate-700">{record.stats.count45}</span>
                                )}
                            </td>

                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center text-cyan-700 font-medium bg-cyan-50 bg-opacity-30" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempRf20} 
                                        onChange={(e) => setTempRf20(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    record.stats.countReefer20 || 0
                                )}
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center text-cyan-700 font-medium border-r border-slate-100 bg-cyan-50 bg-opacity-30" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempRf40} 
                                        onChange={(e) => setTempRf40(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    record.stats.countReefer40 || 0
                                )}
                            </td>

                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center text-red-700 font-medium bg-red-50 bg-opacity-30" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempIm20} 
                                        onChange={(e) => setTempIm20(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    record.stats.countIMDG20 || 0
                                )}
                            </td>
                            <td className="px-1 py-4 whitespace-nowrap text-xs text-center text-red-700 font-medium border-r border-slate-100 bg-red-50 bg-opacity-30" onClick={(e) => isEditing && e.stopPropagation()}>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        value={tempIm40} 
                                        onChange={(e) => setTempIm40(parseInt(e.target.value) || 0)} 
                                        className="w-full text-center px-1 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                                        onKeyDown={(e) => handleKeyDown(e, record.id)}
                                    />
                                ) : (
                                    record.stats.countIMDG40 || 0
                                )}
                            </td>

                            {/* SWAPPED DATA CELLS */}
                            <td className="px-3 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${isEditing ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                    {isEditing ? (Number(tempC20) + Number(tempC40) + Number(tempC45) + record.stats.countUnknownSize) : record.stats.totalContainers}
                                </span>
                            </td>

                            <td className="px-3 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${isEditing ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                                    {isEditing ? (Number(tempC20) + (Number(tempC40) * 2) + (Number(tempC45) * 2)).toLocaleString() : evp.toLocaleString()}
                                </span>
                            </td>

                            <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={(e) => saveEdit(e, record.id)}
                                                className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded transition-colors shadow-sm"
                                                title="Enregistrer les modifications"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={cancelEdit}
                                                className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors shadow-sm"
                                                title="Annuler"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onView(record);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200 hover:border-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                title="Voir Analyse"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => startEdit(e, record)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200 hover:border-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                title="Modifier info navire"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Trigger delete request via parent prop
                                                    onRequestDelete(record.id, record.manifest.nom_navire || 'Navire Inconnu');
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-md border border-slate-200 hover:border-red-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                                                title="Supprimer définitivement"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
};
