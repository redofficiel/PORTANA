
import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StatCard } from './components/StatCard';
import { DataTable } from './components/DataTable';
import { ManifestDetails } from './components/ManifestDetails';
import { LCLAnalysisPanel } from './components/LCLAnalysisPanel';
import { SpecialCargoPanel } from './components/SpecialCargoPanel';
import { ErrorAnalysisPanel } from './components/ErrorAnalysisPanel';
import { ContainerSizeBadge } from './components/ContainerBadges';
import { VesselHistory } from './components/VesselHistory';
import { JsonViewer } from './components/JsonViewer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { PlanificationPanel } from './components/PlanificationPanel';
import { 
  validateManifestJson, flattenManifestData, analyzeManifestData, generateVesselId,
  downloadXlsx, downloadLCLReport, downloadSpecialCargoReport, downloadErrorReport 
} from './utils/manifestService';
import { ContainerRow, AnalyticsStats, Manifest, LCLContainer, SpecialCargoContainer, ContainerError, VesselRecord } from './types';
import { Layers, FileSpreadsheet, RefreshCw, AlertTriangle, Flame, Snowflake, LayoutDashboard, FilterX, FileWarning, History, Ship, ClipboardList } from 'lucide-react';

type GlobalTab = 'ANALYZER' | 'HISTORY' | 'PLANIFICATION';
type AnalyzerTabMode = 'OVERVIEW' | 'LCL' | 'IMDG' | 'REEFER' | 'ERRORS';
type SizeFilter = 20 | 40 | 45 | 'UNKNOWN' | null;

// Modal State Interface
interface ModalState {
  isOpen: boolean;
  type: 'SINGLE' | 'MULTI' | 'ALL';
  ids?: string[];
  title: string;
  message: string;
}

const App: React.FC = () => {
  // Global Navigation State
  const [globalTab, setGlobalTab] = useState<GlobalTab>('ANALYZER');

  // Persistence State (History)
  const [history, setHistory] = useState<VesselRecord[]>(() => {
    const saved = localStorage.getItem('epo_vessel_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal & Loading State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: 'SINGLE',
    title: '',
    message: ''
  });

  // Save history whenever it changes
  useEffect(() => {
    try {
        localStorage.setItem('epo_vessel_history', JSON.stringify(history));
    } catch (e) {
        console.error("Storage quota exceeded or error saving history", e);
        // In a real app, handle quota errors gracefully (e.g. remove oldest)
    }
  }, [history]);

  // Analyzer Data State
  const [data, setData] = useState<ContainerRow[] | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [manifestHeader, setManifestHeader] = useState<Manifest | null>(null);
  
  // Analyzer Sub-lists
  const [lclData, setLclData] = useState<LCLContainer[]>([]);
  const [imdgData, setImdgData] = useState<SpecialCargoContainer[]>([]);
  const [reeferData, setReeferData] = useState<SpecialCargoContainer[]>([]);
  const [errorData, setErrorData] = useState<ContainerError[]>([]);

  // UI State
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AnalyzerTabMode>('OVERVIEW');
  const [sizeFilter, setSizeFilter] = useState<SizeFilter>(null);

  // --- Handlers ---

  const handleFileProcess = async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    
    const newHistoryRecords: VesselRecord[] = [];
    const errors: string[] = [];
    let lastProcessedData = null; // We will load the last successfully processed file into the view

    for (const file of files) {
        try {
            const text = await file.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                throw new Error(`Erreur syntaxe JSON dans le fichier ${file.name}`);
            }

            // 1. Validation
            const manifests = validateManifestJson(json);
            
            // 2. Flattening
            const flattenedRows = flattenManifestData(manifests);
            if (flattenedRows.length === 0) {
                throw new Error(`Aucun conteneur trouvé dans ${file.name}`);
            }

            // 3. Analytics
            const analysisResult = analyzeManifestData(flattenedRows);

            // 4. Create Record
            const vesselId = generateVesselId(manifests[0]);
            
            const newRecord: VesselRecord = {
                id: vesselId,
                uploadDate: new Date().toISOString(),
                manifest: manifests[0],
                stats: analysisResult.stats,
                rawRows: flattenedRows,
                originalFileName: file.name
            };

            newHistoryRecords.push(newRecord);

            // Prepare this dataset to be displayed in the UI (wins over previous iteration)
            lastProcessedData = {
                rows: flattenedRows,
                analysis: analysisResult,
                manifest: manifests[0],
                fileName: file.name
            };

        } catch (err: any) {
            console.error(err);
            errors.push(err.message || `Erreur inconnue avec ${file.name}`);
        }
    }

    // Processing Complete
    setIsLoading(false);

    // 1. Handle Errors
    if (errors.length > 0) {
        setError(`Erreurs: ${errors.join(' | ')}`);
    }

    // 2. Update History (preventing duplicates based on ID)
    if (newHistoryRecords.length > 0) {
        setHistory(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewRecords = newHistoryRecords.filter(r => !existingIds.has(r.id));
            return [...uniqueNewRecords, ...prev];
        });
    }

    // 3. Update active view with the last successful file
    if (lastProcessedData) {
        setData(lastProcessedData.rows);
        setStats(lastProcessedData.analysis.stats);
        setLclData(lastProcessedData.analysis.lclContainers);
        setImdgData(lastProcessedData.analysis.imdgContainers);
        setReeferData(lastProcessedData.analysis.reeferContainers);
        setErrorData(lastProcessedData.analysis.errorContainers);
        setManifestHeader(lastProcessedData.manifest);
        setFileName(lastProcessedData.fileName);
        
        setActiveTab('OVERVIEW');
        setSizeFilter(null);
        setGlobalTab('ANALYZER'); // Ensure we are on the analyzer tab
    }
  };

  const handleHistoryView = (record: VesselRecord) => {
    // Load historical record into analyzer
    setData(record.rawRows);
    setStats(record.stats);
    setManifestHeader(record.manifest);
    setFileName(record.originalFileName);
    
    // Re-calculate sub-lists (since we only stored stats/rows to save space, or if we stored everything we load it)
    // To be safe and simple, we re-run analysis on the stored rows
    const { lclContainers, imdgContainers, reeferContainers, errorContainers } = analyzeManifestData(record.rawRows);
    setLclData(lclContainers);
    setImdgData(imdgContainers);
    setReeferData(reeferContainers);
    setErrorData(errorContainers);

    setGlobalTab('ANALYZER');
    setActiveTab('OVERVIEW');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- UPDATE REQUEST HANDLER (Inline Edit) ---
  const handleUpdateHistory = (id: string, updates: { 
    name: string, voyage: string, 
    c20: number, c40: number, c45: number,
    rf20: number, rf40: number,
    im20: number, im40: number 
  }) => {
      setHistory(prev => prev.map(record => {
          if (record.id === id) {
              const newStats = {
                  ...record.stats,
                  count20: updates.c20,
                  count40: updates.c40,
                  count45: updates.c45,
                  countReefer20: updates.rf20,
                  countReefer40: updates.rf40,
                  countIMDG20: updates.im20,
                  countIMDG40: updates.im40,
                  // Recalculate totals
                  totalContainers: updates.c20 + updates.c40 + updates.c45 + record.stats.countUnknownSize,
                  countReefer: updates.rf20 + updates.rf40,
                  countIMDG: updates.im20 + updates.im40
              };

              return {
                  ...record,
                  manifest: {
                      ...record.manifest,
                      nom_navire: updates.name,
                      num_voyage: updates.voyage
                  },
                  stats: newStats
              };
          }
          return record;
      }));
  };

  // --- DELETE REQUEST HANDLERS (Populate Modal) ---

  const requestDeleteSingle = (id: string, shipName: string) => {
    setModalState({
      isOpen: true,
      type: 'SINGLE',
      ids: [id],
      title: 'Suppression du Manifeste',
      message: `Voulez-vous confirmer la suppression du manifeste pour le navire "${shipName}" ?\n\nCette action est définitive et effacera l'enregistrement de la base de données.`
    });
  };

  const requestDeleteMultiple = (ids: string[]) => {
    if (ids.length === 0) return;
    setModalState({
      isOpen: true,
      type: 'MULTI',
      ids: ids,
      title: 'Suppression Multiple',
      message: `Voulez-vous confirmer la suppression de ${ids.length} manifestes sélectionnés ?\n\nCette action est définitive.`
    });
  };

  const requestDeleteAll = () => {
    if (history.length === 0) return;
    setModalState({
      isOpen: true,
      type: 'ALL',
      title: 'Purge Complète de l\'Historique',
      message: `Voulez-vous confirmer la suppression de TOUT l'historique des manifestes (${history.length} enregistrements) ?\n\nCette action est irréversible et effacera toutes les données stockées localement.`
    });
  };

  // --- DELETE EXECUTION (Simulated Backend) ---

  const executeDelete = async () => {
    setIsProcessing(true);

    try {
        // 1. Simulate API Latency
        await new Promise(resolve => setTimeout(resolve, 800));

        const timestamp = new Date().toISOString();
        let deletedCount = 0;
        let deletedIds: string[] = [];

        // 2. Perform Data Operation based on Type
        if (modalState.type === 'SINGLE' && modalState.ids && modalState.ids.length === 1) {
            const idToDelete = modalState.ids[0];
            setHistory(prev => prev.filter(r => r.id !== idToDelete));
            deletedCount = 1;
            deletedIds = [idToDelete];
        
        } else if (modalState.type === 'MULTI' && modalState.ids) {
            const idsToDelete = modalState.ids;
            setHistory(prev => prev.filter(r => !idsToDelete.includes(r.id)));
            deletedCount = idsToDelete.length;
            deletedIds = idsToDelete;

        } else if (modalState.type === 'ALL') {
            deletedCount = history.length;
            deletedIds = history.map(h => h.id);
            setHistory([]);
        }

        // 3. Audit Log (Simulated Backend Log)
        console.log(`[AUDIT - ${timestamp}] Action: DELETE_${modalState.type}`, {
            count: deletedCount,
            ids: deletedIds,
            status: 'SUCCESS'
        });

        // 4. Close Modal
        closeModal();

    } catch (err) {
        console.error("Delete operation failed", err);
        alert("Une erreur est survenue lors de la suppression.");
    } finally {
        setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleDownload = () => {
    if (data && fileName) {
      downloadXlsx(data, fileName);
    }
  };

  const handleReset = () => {
    setData(null);
    setStats(null);
    setManifestHeader(null);
    setLclData([]);
    setImdgData([]);
    setReeferData([]);
    setErrorData([]);
    setError(null);
    setFileName('');
    setActiveTab('OVERVIEW');
    setSizeFilter(null);
  };

  // Filter Data Logic for Overview Table
  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (sizeFilter === null) return data;
    if (sizeFilter === 'UNKNOWN') return data.filter(r => r.taille_conteneur !== 20 && r.taille_conteneur !== 40 && r.taille_conteneur !== 45);
    return data.filter(r => r.taille_conteneur === sizeFilter);
  }, [data, sizeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header />
      
      {/* Confirmation Modal Overlay */}
      <ConfirmationModal 
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={executeDelete}
        onCancel={closeModal}
        isLoading={isProcessing}
        isDanger={true}
        confirmLabel="Confirmer la suppression"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Global Tab Switcher */}
        <div className="flex items-center justify-center mb-8">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                <button
                    onClick={() => setGlobalTab('ANALYZER')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        globalTab === 'ANALYZER' 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Analyseur
                </button>
                <button
                    onClick={() => setGlobalTab('PLANIFICATION')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        globalTab === 'PLANIFICATION' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:text-indigo-900 hover:bg-indigo-50'
                    }`}
                >
                    <ClipboardList className="h-4 w-4" />
                    Planification
                </button>
                <button
                    onClick={() => setGlobalTab('HISTORY')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        globalTab === 'HISTORY' 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                    <History className="h-4 w-4" />
                    Historique
                </button>
            </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-bold text-sm">Rapport de Traitement</h3>
              <p className="text-red-700 mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* TAB 1: ANALYZER CONTENT */}
        {globalTab === 'ANALYZER' && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                {/* State: Empty / Upload */}
                {!data && (
                <div className="mt-8 max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Importer Données Manifeste</h2>
                    <p className="mt-2 text-slate-500 text-sm">Téléversez un ou plusieurs fichiers JSON pour commencer l'analyse et l'archivage.</p>
                    </div>
                    <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} />
                    
                    {/* Quick tip about History */}
                    {history.length > 0 && (
                        <div className="mt-8 text-center">
                            <button 
                                onClick={() => setGlobalTab('HISTORY')}
                                className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                <History className="h-3 w-3" />
                                Voir {history.length} escales précédentes dans l'Historique
                            </button>
                        </div>
                    )}
                </div>
                )}

                {/* State: Dashboard */}
                {data && stats && manifestHeader && (
                <div className="space-y-6">
                    
                    {/* Top Control Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded text-slate-500">
                        <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">{fileName}</h2>
                            <p className="text-xs text-slate-500">{data.length.toLocaleString()} lignes traitées</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                        onClick={handleReset}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:text-slate-800 transition-colors"
                        >
                        <RefreshCw className="h-4 w-4" />
                        Nouvel Import
                        </button>
                        <button 
                        onClick={handleDownload}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded hover:bg-slate-800 shadow-sm transition-colors"
                        >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exporter XLSX
                        </button>
                    </div>
                    </div>

                    {/* Main Content Area */}
                    <div>
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
                        <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'OVERVIEW' 
                            ? 'border-slate-900 text-slate-900' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                        >
                        <Ship className="h-4 w-4" />
                        Vue d'Ensemble
                        </button>
                        
                        {stats.countErrors > 0 && (
                        <button
                            onClick={() => setActiveTab('ERRORS')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'ERRORS' 
                                ? 'border-rose-500 text-rose-700' 
                                : 'border-transparent text-slate-500 hover:text-rose-600 hover:border-rose-200'
                            }`}
                        >
                            <FileWarning className="h-4 w-4" />
                            Anomalies
                            <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{stats.countErrors}</span>
                        </button>
                        )}

                        {stats.countLCL > 0 && (
                        <button
                            onClick={() => setActiveTab('LCL')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'LCL' 
                                ? 'border-orange-500 text-orange-700' 
                                : 'border-transparent text-slate-500 hover:text-orange-600 hover:border-orange-200'
                            }`}
                        >
                            <Layers className="h-4 w-4" />
                            LCL / Groupage
                            <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px]">{stats.countLCL}</span>
                        </button>
                        )}

                        {stats.countIMDG > 0 && (
                        <button
                            onClick={() => setActiveTab('IMDG')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'IMDG' 
                                ? 'border-red-500 text-red-700' 
                                : 'border-transparent text-slate-500 hover:text-red-600 hover:border-red-200'
                            }`}
                        >
                            <Flame className="h-4 w-4" />
                            Marchandise IMDG
                            <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">{stats.countIMDG}</span>
                        </button>
                        )}

                        {stats.countReefer > 0 && (
                        <button
                            onClick={() => setActiveTab('REEFER')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'REEFER' 
                                ? 'border-cyan-500 text-cyan-700' 
                                : 'border-transparent text-slate-500 hover:text-cyan-600 hover:border-cyan-200'
                            }`}
                        >
                            <Snowflake className="h-4 w-4" />
                            Conteneurs Reefer
                            <span className="bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-full text-[10px]">{stats.countReefer}</span>
                        </button>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'OVERVIEW' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Container Overview Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
                            <StatCard 
                                label="Conteneurs 20'" 
                                count={stats.count20} 
                                icon={<ContainerSizeBadge size={20} className="scale-75 origin-left" />}
                                colorTheme="gray"
                                active={sizeFilter === 20}
                                onClick={() => setSizeFilter(sizeFilter === 20 ? null : 20)}
                                />
                                <StatCard 
                                label="Conteneurs 40'" 
                                count={stats.count40} 
                                icon={<ContainerSizeBadge size={40} className="scale-75 origin-left" />}
                                colorTheme="teal"
                                active={sizeFilter === 40}
                                onClick={() => setSizeFilter(sizeFilter === 40 ? null : 40)}
                                />
                                <StatCard 
                                label="Conteneurs 45'" 
                                count={stats.count45} 
                                icon={<ContainerSizeBadge size={45} className="scale-75 origin-left" />}
                                colorTheme="navy"
                                active={sizeFilter === 45}
                                onClick={() => setSizeFilter(sizeFilter === 45 ? null : 45)}
                                />
                                <StatCard 
                                label="Unités Reefer" 
                                count={stats.countReefer} 
                                icon={<Snowflake className="h-4 w-4 text-cyan-600" />} 
                                colorTheme="blue"
                                onClick={() => setActiveTab('REEFER')}
                                />
                                <StatCard 
                                label="Cargo IMDG" 
                                count={stats.countIMDG} 
                                icon={<Flame className="h-4 w-4 text-red-600" />} 
                                colorTheme="red"
                                onClick={() => setActiveTab('IMDG')}
                                />
                                <StatCard 
                                label="Groupes LCL" 
                                count={stats.countLCL} 
                                icon={<Layers className="h-4 w-4 text-orange-600" />} 
                                colorTheme="orange"
                                onClick={() => setActiveTab('LCL')}
                                />
                            </div>
                            
                            {/* Helper text for filters */}
                            {sizeFilter && (
                            <div className="flex items-center justify-between bg-slate-100 border border-slate-200 px-3 py-2 rounded text-xs text-slate-600 animate-in fade-in">
                                <span className="font-semibold">Filtré par Taille : {sizeFilter === 'UNKNOWN' ? 'Inconnue' : `${sizeFilter}'`}</span>
                                <button onClick={() => setSizeFilter(null)} className="flex items-center gap-1 hover:text-slate-900">
                                <FilterX className="h-3 w-3" /> Effacer Filtre
                                </button>
                            </div>
                            )}

                            <ManifestDetails data={manifestHeader} />

                            <div className="bg-white rounded-lg border border-slate-200 p-0 overflow-hidden">
                                <DataTable rows={filteredRows} />
                            </div>

                            <JsonViewer data={manifestHeader} />
                        </div>
                        )}

                        {activeTab === 'ERRORS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ErrorAnalysisPanel 
                                errors={errorData} 
                                onExport={() => downloadErrorReport(errorData, fileName)} 
                            />
                        </div>
                        )}

                        {activeTab === 'LCL' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <LCLAnalysisPanel 
                                lclContainers={lclData} 
                                onExport={() => downloadLCLReport(lclData, fileName)} 
                            />
                        </div>
                        )}

                        {activeTab === 'IMDG' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SpecialCargoPanel 
                                type="IMDG" 
                                containers={imdgData} 
                                onExport={(subset) => downloadSpecialCargoReport(subset || imdgData, 'IMDG', fileName)} 
                            />
                        </div>
                        )}

                        {activeTab === 'REEFER' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SpecialCargoPanel 
                                type="REEFER" 
                                containers={reeferData} 
                                onExport={(subset) => downloadSpecialCargoReport(subset || reeferData, 'REEFER', fileName)} 
                            />
                        </div>
                        )}
                    </div>
                    </div>
                    
                </div>
                )}
            </div>
        )}

        {/* TAB 2: PLANIFICATION CONTENT */}
        {globalTab === 'PLANIFICATION' && (
             <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <PlanificationPanel 
                    data={data}
                    fileName={fileName}
                />
             </div>
        )}

        {/* TAB 3: HISTORY CONTENT */}
        {globalTab === 'HISTORY' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <VesselHistory 
                    records={history} 
                    onView={handleHistoryView} 
                    onUpdate={handleUpdateHistory}
                    onRequestDelete={requestDeleteSingle}
                    onRequestDeleteSelected={requestDeleteMultiple}
                    onRequestClearAll={requestDeleteAll}
                />
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
