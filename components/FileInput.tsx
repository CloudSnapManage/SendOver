import React, { useRef, useState } from 'react';
import { UploadCloud, File, AlertTriangle, Files, MousePointerClick } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface FileInputProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({ onFileSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    // No artificial size limit. Browser memory is the only constraint.
    setError(null);
    onFileSelect(files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full group animate-fade-in-up">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-52 sm:h-64 rounded-2xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer overflow-hidden
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-900/20' 
            : dragActive 
              ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-[0_0_40px_rgba(99,102,241,0.3)]' 
              : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-indigo-500/70 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:scale-[1.01]'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? onButtonClick : undefined}
      >
        <input 
          ref={inputRef}
          type="file" 
          multiple
          className="hidden" 
          onChange={handleChange}
          disabled={disabled} 
        />
        
        {/* Animated Background Gradient on Hover */}
        {!disabled && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col items-center text-center p-4 sm:p-6 transition-transform duration-300 group-hover:scale-105">
          <div className={`p-4 sm:p-5 rounded-full mb-3 sm:mb-5 shadow-lg transition-all duration-300 ${
            dragActive 
              ? 'bg-indigo-500 text-white shadow-indigo-500/40 scale-110' 
              : 'bg-slate-800 border border-slate-700 text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/40 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] group-hover:bg-indigo-500/10'
          }`}>
            {dragActive ? <Files size={32} className="animate-bounce sm:w-10 sm:h-10" /> : <UploadCloud size={32} className="group-hover:animate-pulse sm:w-10 sm:h-10" />}
          </div>
          
          <h3 className="text-lg sm:text-xl font-bold text-slate-200 mb-1 sm:mb-2 group-hover:text-white transition-colors">
            Drop files to send
          </h3>
          <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-slate-400 max-w-[200px] leading-relaxed">
            Drag & drop anywhere or <span className="text-indigo-400 font-medium underline decoration-indigo-500/30 underline-offset-4 group-hover:text-indigo-300 group-hover:decoration-indigo-400 transition-all">browse files</span>
          </p>
          
          <Tooltip content="Large files supported (limited by device memory)" position="top">
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-slate-500 bg-slate-900/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-800 transition-colors group-hover:border-indigo-500/30 group-hover:text-indigo-300/70">
              <Files size={12} />
              <span>Multiple files supported</span>
            </div>
          </Tooltip>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 text-sm animate-fade-in-up shadow-lg shadow-red-900/10">
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};