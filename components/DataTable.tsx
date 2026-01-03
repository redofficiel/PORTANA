import React, { useState, useEffect } from 'react';
import { ContainerRow } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
        <p className="text-slate-500">No records found matching the current filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0">
        <div>
          <h3 className="font-semibold text-slate-800">Container List</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, rows.length)} of {rows.length.toLocaleString()} records
          </p>
        </div>
        
        {/* Pagination Controls (Top) */}
        {totalPages > 1 && (
           <div className="hidden sm:flex items-center space-x-2">
             <button
               onClick={handlePrev}
               disabled={currentPage === 1}
               className="p-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ChevronLeft className="h-5 w-5" />
             </button>
             <span className="text-sm font-medium text-slate-700">
               {currentPage} / {totalPages}
             </span>
             <button
               onClick={handleNext}
               disabled={currentPage === totalPages}
               className="p-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <ChevronRight className="h-5 w-5" />
             </button>
           </div>
        )}
      </div>
      
      <div className="overflow-x-auto flex-grow">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Container No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type (ISO)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">BL Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client Final</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Groupage</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {currentRows.map((row, idx) => (
              <tr key={startIndex + idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{row.num_conteneur}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {row.taille_conteneur === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Unknown
                        </span>
                    ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            row.taille_conteneur === 20 ? 'bg-green-100 text-green-800' : 
                            row.taille_conteneur === 40 ? 'bg-blue-100 text-blue-800' : 
                            'bg-purple-100 text-purple-800'
                        }`}>
                            {row.taille_conteneur}'
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.code_iso}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{row.statut}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-xs">{row.num_bl}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600 truncate max-w-xs" title={row.client_final}>{row.client_final}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {row.indicateur_groupage === '1' ? (
                        <span className="text-orange-600 font-bold text-xs">LCL / PART</span>
                    ) : (
                        <span className="text-slate-400 text-xs">FCL</span>
                    )}
                </td>
              </tr>
            ))}
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
              <p className="text-sm text-slate-700">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
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
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium ${
                    currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};