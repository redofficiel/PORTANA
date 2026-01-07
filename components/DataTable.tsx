import React, { useState, useEffect } from 'react';
import { ContainerRow } from '../types';
import { ChevronLeft, ChevronRight, Snowflake, Flame, Package } from 'lucide-react';
import { ContainerSizeBadge } from './ContainerBadges';

interface DataTableProps {
  rows: ContainerRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ rows }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Reset to page 1 when data changes (e.g. filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [rows]);

  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRows = rows.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-slate-900 font-medium">No containers found</h3>
        <p className="text-slate-500 text-sm">Try adjusting your filters to see more results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/80 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">DETAILED LIST</h3>
          <p className="text-xs text-slate-500">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, rows.length)} of {rows.length.toLocaleString()} records
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
      
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-24">SIZE</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">CONTAINER NO</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ISO TYPE</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">CATEGORY</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">BL REFERENCE</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">CONSIGNEE</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {currentRows.map((row, idx) => {
              const isReefer = row.indicateur_reefer === '1';
              const isImdg = !!row.classe_imdg;

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
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700" title="Reefer Container">
                          <Snowflake className="h-3 w-3" />
                          <span className="text-[10px] font-bold">REEFER</span>
                        </div>
                      )}
                      {isImdg && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700" title={`IMDG Class ${row.classe_imdg}`}>
                          <Flame className="h-3 w-3" />
                          <span className="text-[10px] font-bold">IMDG</span>
                        </div>
                      )}
                      {!isReefer && !isImdg && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500" title="Standard Dry Container">
                          <Package className="h-3 w-3" />
                          <span className="text-[10px] font-bold">DRY</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium">{row.statut || 'FCL'}</span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-slate-600 font-mono text-xs">{row.num_bl}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-slate-600 truncate max-w-xs text-xs" title={row.client_final}>{row.client_final}</td>
                </tr>
              );
            })}
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
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">
                Page <span className="font-medium text-slate-700">{currentPage}</span> of <span className="font-medium text-slate-700">{totalPages}</span>
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
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
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