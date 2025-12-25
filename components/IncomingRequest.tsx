import React from 'react';
import { FileQuestion, Check, X, HardDrive } from 'lucide-react';
import { Button } from './Button';

interface IncomingRequestProps {
  fileName: string;
  fileSize: number;
  onAccept: () => void;
  onReject: () => void;
}

export const IncomingRequest: React.FC<IncomingRequestProps> = ({ 
  fileName, 
  fileSize, 
  onAccept, 
  onReject 
}) => {
  
  // Calculate readable size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="mt-6 bg-slate-800/90 backdrop-blur-md rounded-2xl overflow-hidden border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-white/5">
      <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/10 p-4 sm:p-5 border-b border-indigo-500/20 flex items-center gap-3">
        <div className="bg-indigo-500/20 p-2 rounded-lg">
          <FileQuestion className="text-indigo-300" size={20} />
        </div>
        <div>
           <h3 className="font-bold text-white leading-tight text-sm sm:text-base">Incoming Request</h3>
           <p className="text-xs text-indigo-300/80">A peer wants to send you a file</p>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-700/50">
          <div className="p-2 sm:p-3 bg-slate-800 rounded-xl border border-slate-700 shrink-0">
             <HardDrive className="text-indigo-400 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="overflow-hidden min-w-0">
            <h4 className="text-base sm:text-lg font-semibold text-white mb-1 truncate" title={fileName}>{fileName}</h4>
            <div className="flex items-center gap-2">
               <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">{formatSize(fileSize)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onReject} 
            variant="danger" 
            className="flex-1 justify-center"
          >
            <X size={18} /> Reject
          </Button>
          <Button 
            onClick={onAccept} 
            variant="primary" 
            className="flex-1 justify-center"
          >
            <Check size={18} /> Accept & Download
          </Button>
        </div>
        
        <p className="text-center text-[10px] uppercase tracking-widest text-slate-600 mt-5 font-medium">
          Encrypted P2P Connection
        </p>
      </div>
    </div>
  );
};