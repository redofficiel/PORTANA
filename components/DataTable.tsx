
import React, { useState, useEffect, useMemo } from 'react';
import { ContainerRow } from '../types';
import { ChevronLeft, ChevronRight, Snowflake, Flame, Package, Search, X } from 'lucide-react';
import { ContainerSizeBadge } from './ContainerBadges';

interface DataTableProps {
  rows: ContainerRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ rows }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // State object to hold filter values for each column
  const [filters, setFilters] = useState({
    num_conteneur: '',
    code_iso: '',
    categorie: '',
    // marchandise removed
    statut: '',
    num_bl: '',
    client_final: ''
  });

  // Reset to page 1 when data source changes completely
  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  // Handler to update specific filter
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Logic to filter rows based on inputs
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // Helper for case-insensitive partial match
      const matches = (dataVal: string | undefined, filterVal: string) => 
        (dataVal || '').toString().toLowerCase().includes(filterVal.toLowerCase());

      return (
        matches(row.num_conteneur, filters.num_conteneur) &&
        matches(row.code_iso, filters.code_iso) &&
        matches(row.categorie, filters.categorie) &&
        // marchandise match removed
        matches(row.statut, filters.statut) &&
        matches(row.num_bl, filters.num_bl) &&
        matches(row.client_final, filters.client_final)
      );
    });
  }, [rows, filters]);

  // Pagination Logic applied on Filtered Rows
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  // Helper component for Header Input
  const HeaderFilter = ({ 
    label, 
    filterKey, 
    placeholder 
  }: { 
    label: string, 
    filterKey: keyof typeof filters, 
    placeholder?: string 
  }) => (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="relative">
        <input
          type="text"
          value={filters[filterKey]}
          onChange={(e) => handleFilterChange(filterKey, e.target.value)}
          placeholder={placeholder || "Filtrer..."}
          className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-slate-300 font-normal"
        />
        {filters[filterKey] && (
          <button 
            onClick={() => handleFilterChange(filterKey, '')}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-slate-900 font-medium">Aucune donnée à afficher</h3>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">LISTE DÉTAILLÉE</h3>
          <p className="text-xs text-slate-500">
            Affichage {filteredRows.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredRows.length)} sur {filteredRows.length.toLocaleString()} enregistrements
            {filteredRows.length !== rows.length && ` (Filtré depuis ${rows.length})`}
          </p>
        </div>
        
        {/* Pagination Controls (Top) */}
        {totalPages > 1 && (
           <div className="hidden sm:flex items-center space-x-2">
             <button
               onClick={handlePrev}
               disabled={currentPage === 1}
               className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ChevronLeft className="h-4 w-4" />
             </button>
             <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
               {currentPage} / {totalPages}
             </span>
             <button
               onClick={handleNext}
               disabled={currentPage === totalPages}
               className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ChevronRight className="h-4 w-4" />
             </button>
           </div>
        )}
      </div>
      
      <div className="overflow-x-auto flex-grow min-h-[400px]">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left w-24 align-top">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 mt-1">TAILLE</span>
              </th>
              
              <th className="px-6 py-3 text-left w-48 align-top">
                <HeaderFilter label="N° CONTENEUR" filterKey="num_conteneur" />
              </th>
              
              <th className="px-6 py-3 text-left w-28 align-top">
                <HeaderFilter label="TYPE ISO" filterKey="code_iso" placeholder="Ex: 22G1" />
              </th>
              
              <th className="px-6 py-3 text-left w-32 align-top">
                <HeaderFilter label="CATÉGORIE" filterKey="categorie" />
              </th>

              <th className="px-6 py-3 text-left w-32 align-top">
                <HeaderFilter label="STATUT" filterKey="statut" placeholder="FCL/LCL" />
              </th>
              
              <th className="px-6 py-3 text-left w-40 align-top">
                <HeaderFilter label="RÉF BL" filterKey="num_bl" />
              </th>
              
              <th className="px-6 py-3 text-left min-w-[200px] align-top">
                <HeaderFilter label="RÉCEPTIONNAIRE" filterKey="client_final" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {currentRows.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                        Aucun résultat ne correspond à vos filtres.
                    </td>
                </tr>
            ) : (
                currentRows.map((row, idx) => {
                const isReefer = row.indicateur_reefer === '1';
                const isImdg = !!row.classe_imdg || !!row.code_un;

                return (
                    <tr key={startIndex + idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3 whitespace-nowrap">
                        <ContainerSizeBadge size={row.taille_conteneur} />
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700">{row.num_conteneur}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{row.code_iso}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                        {isReefer && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700" title="Conteneur Reefer">
                            <Snowflake className="h-3 w-3" />
                            <span className="text-[10px] font-bold">REEFER</span>
                            </div>
                        )}
                        {isImdg && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700" title={`Classe IMDG ${row.classe_imdg || '?'}`}>
                            <Flame className="h-3 w-3" />
                            <span className="text-[10px] font-bold">IMDG</span>
                            </div>
                        )}
                        {!isReefer && !isImdg && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500" title="Conteneur Standard Dry">
                            <Package className="h-3 w-3" />
                            <span className="text-[10px] font-bold">DRY</span>
                            </div>
                        )}
                         <span className="text-xs text-slate-500 ml-1">{row.categorie}</span>
                        </div>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium">{row.statut || 'FCL'}</span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">{row.num_bl}</td>
                    <td className="px-6 py-3 text-slate-600 text-xs whitespace-normal break-words leading-tight min-w-[150px]" title={row.client_final}>{row.client_final}</td>
                    </tr>
                );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Bottom) */}
      {totalPages > 1 && (
        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">
                Page <span className="font-medium text-slate-700">{currentPage}</span> sur <span className="font-medium text-slate-700">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="sr-only">Précédent</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="sr-only">Suivant</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
