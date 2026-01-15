
import React, { useState } from 'react';
import { FileJson, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Manifest } from '../types';

interface JsonViewerProps {
  data: Manifest;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white mt-6 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Données Brutes du Manifeste (JSON)</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="relative group">
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium shadow-sm hover:text-blue-600"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
           </div>
           <pre className="p-4 bg-slate-900 text-slate-200 text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap">
             {JSON.stringify(data, null, 2)}
           </pre>
        </div>
      )}
    </div>
  );
};
