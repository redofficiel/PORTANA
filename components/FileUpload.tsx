
import React, { useRef, useState } from 'react';
import { Upload, FileJson, AlertCircle, Files } from 'lucide-react';

interface FileUploadProps {
  onFileProcess: (files: File[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess, isLoading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(e.dataTransfer.files);
      onFileProcess(filesArray);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to Array
      const filesArray = Array.from(e.target.files);
      onFileProcess(filesArray);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 transition-all duration-200 ease-in-out text-center cursor-pointer
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="application/json"
          multiple // Allow multiple files
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : (
              <Files className="h-8 w-8" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Téléversement des Manifestes</h3>
            <p className="text-slate-500 mt-1 text-sm">
                Glissez-déposez vos fichiers JSON ici, ou cliquez pour parcourir.
            </p>
            <p className="text-xs text-slate-400 mt-2">Vous pouvez sélectionner plusieurs fichiers à la fois.</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            <FileJson className="h-3 w-3" />
            <span>Format attendu : JSON</span>
          </div>
        </div>
      </div>
    </div>
  );
};
