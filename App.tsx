import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { StatCard } from './components/StatCard';
import { DataTable } from './components/DataTable';
import { ManifestDetails } from './components/ManifestDetails';
import { LCLAnalysisPanel } from './components/LCLAnalysisPanel';
import { SpecialCargoPanel } from './components/SpecialCargoPanel';
import { validateManifestJson, flattenManifestData, analyzeManifestData, downloadXlsx } from './utils/manifestService';
import { ContainerRow, AnalyticsStats, Manifest, LCLContainer, SpecialCargoContainer } from './types';
import { Box, Layers, Container, FileSpreadsheet, RefreshCw, AlertTriangle, HelpCircle, Flame, Snowflake, LayoutDashboard } from 'lucide-react';

type TabMode = 'OVERVIEW' | 'LCL' | 'IMDG' | 'REEFER';

const App: React.FC = () => {
  // Data State
  const [data, setData] = useState<ContainerRow[] | null>(null);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [manifestHeader, setManifestHeader] = useState<Manifest | null>(null);
  
  // Analysis Sub-lists
  const [lclData, setLclData] = useState<LCLContainer[]>([]);
  const [imdgData, setImdgData] = useState<SpecialCargoContainer[]>([]);
  const [reeferData, setReeferData] = useState<SpecialCargoContainer[]>([]);

  // UI State
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabMode>('OVERVIEW');

  // Handlers
  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setStats(null);
    setManifestHeader(null);
    setLclData([]);
    setImdgData([]);
    setReeferData([]);
    setFileName(file.name);
    setActiveTab('OVERVIEW'); 

    try {
      const text = await file.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("Syntax Error: The uploaded file is not valid JSON.");
      }

      // 1. Validation
      const manifests = validateManifestJson(json);

      // 2. Flattening (Conversion)
      const flattenedRows = flattenManifestData(manifests);
      
      if (flattenedRows.length === 0) {
          throw new Error("No containers found in the provided manifest file.");
      }

      // 3. Analytics
      const { stats: computedStats, lclContainers, imdgContainers, reeferContainers } = analyzeManifestData(flattenedRows);

      // Update State
      setData(flattenedRows);
      setStats(computedStats);
      setLclData(lclContainers);
      setImdgData(imdgContainers);
      setReeferData(reeferContainers);
      setManifestHeader(manifests[0]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsLoading(false);
    }
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
    setError(null);
    setFileName('');
    setActiveTab('OVERVIEW');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-bold text-sm">Processing Error</h3>
              <p className="text-red-700 mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* State: Empty / Upload */}
        {!data && (
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Import Manifest Data</h2>
              <p className="mt-2 text-slate-500 text-sm">Upload a JSON manifest to begin validation and analysis.</p>
            </div>
            <FileUpload onFileProcess={handleFileProcess} isLoading={isLoading} />
          </div>
        )}

        {/* State: Dashboard */}
        {data && stats && manifestHeader && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Control Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-100 rounded text-slate-500">
                   <FileSpreadsheet className="h-5 w-5" />
                 </div>
                 <div>
                    <h2 className="text-sm font-bold text-slate-800">{fileName}</h2>
                    <p className="text-xs text-slate-500">Processed {data.length.toLocaleString()} lines</p>
                 </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleReset}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:text-slate-800 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  New Import
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded hover:bg-slate-800 shadow-sm transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export XLSX
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
                  <LayoutDashboard className="h-4 w-4" />
                  Overview
                </button>
                
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
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{stats.countLCL}</span>
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
                    IMDG Cargo
                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full text-[10px]">{stats.countIMDG}</span>
                  </button>
                )}

                {stats.countReefer > 0 && (
                  <button
                    onClick={() => setActiveTab('REEFER')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === 'REEFER' 
                        ? 'border-blue-500 text-blue-700' 
                        : 'border-transparent text-slate-500 hover:text-blue-600 hover:border-blue-200'
                    }`}
                  >
                    <Snowflake className="h-4 w-4" />
                    Reefer Containers
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">{stats.countReefer}</span>
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ManifestDetails data={manifestHeader} />
                    
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                       <StatCard 
                          title="Total 20'" 
                          value={stats.count20} 
                          icon={<Box className="h-5 w-5 text-slate-600" />} 
                          colorClass="bg-slate-100"
                        />
                        <StatCard 
                          title="Total 40'" 
                          value={stats.count40} 
                          icon={<Container className="h-5 w-5 text-slate-600" />} 
                          colorClass="bg-slate-100"
                        />
                        <StatCard 
                          title="Total 45'" 
                          value={stats.count45} 
                          icon={<Container className="h-5 w-5 text-slate-600" />} 
                          colorClass="bg-slate-100"
                        />
                         <StatCard 
                          title="Unknown" 
                          value={stats.countUnknownSize} 
                          icon={<HelpCircle className="h-5 w-5 text-slate-400" />} 
                          colorClass="bg-slate-50"
                        />
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                       <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">All Containers</h3>
                          <span className="text-xs text-slate-500">Total Unique Units: {stats.totalContainers}</span>
                       </div>
                       <DataTable rows={data} />
                    </div>
                  </div>
                )}

                {activeTab === 'LCL' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <LCLAnalysisPanel lclContainers={lclData} />
                  </div>
                )}

                {activeTab === 'IMDG' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <SpecialCargoPanel type="IMDG" containers={imdgData} />
                  </div>
                )}

                {activeTab === 'REEFER' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <SpecialCargoPanel type="REEFER" containers={reeferData} />
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
};

export default App;