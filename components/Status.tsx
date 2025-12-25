import React from 'react';
import { FileCheck, FileX, Loader2, Download, RefreshCw, Hourglass, Upload, ArrowRight } from 'lucide-react';
import { TransferProgress } from '../types';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

interface StatusProps {
  progress: TransferProgress;
  onDownload?: () => void;
  onDismiss?: () => void;
}

export const Status: React.FC<StatusProps> = ({ progress, onDownload, onDismiss }) => {
  if (progress.status === 'IDLE' || progress.status === 'INCOMING') return null;

  const isCompleted = progress.status === 'COMPLETED';
  const isError = progress.status === 'ERROR';
  const isWaiting = progress.status === 'WAITING';
  const isSender = progress.role === 'SENDER';
  
  // Calculate readable size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusText = () => {
    if (isCompleted) return 'Transfer Complete';
    if (isError) return progress.errorMsg || 'Transfer Failed';
    if (isWaiting) return 'Waiting for acceptance...';
    return isSender ? 'Sending...' : 'Receiving...';
  };

  return (
    <div className="mt-6 bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl animate-in slide-in-from-bottom-4 ring-1 ring-white/5">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            <div className={`p-2 sm:p-3 rounded-xl shadow-inner shrink-0 ${
              isCompleted ? 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20' : 
              isError ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' : 
              isWaiting ? 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20' :
              'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20'
            }`}>
              {isCompleted ? <FileCheck size={24} className="sm:w-7 sm:h-7" /> : 
               isError ? <FileX size={24} className="sm:w-7 sm:h-7" /> : 
               isWaiting ? <Hourglass size={24} className="animate-pulse sm:w-7 sm:h-7" /> :
               isSender ? <Upload size={24} className="animate-bounce sm:w-7 sm:h-7" /> :
               <Loader2 size={24} className="animate-spin sm:w-7 sm:h-7" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-100 text-base sm:text-lg mb-0.5 truncate">{progress.fileName}</h4>
              <p className={`text-xs sm:text-sm font-medium ${
                 isCompleted ? 'text-green-400' : isError ? 'text-red-400' : 'text-slate-400'
              }`}>
                {getStatusText()}
              </p>
            </div>
          </div>
          <div className="flex sm:block justify-between items-end sm:text-right pl-[44px] sm:pl-0">
             <span className="text-xl sm:text-2xl font-mono font-bold text-slate-100 tracking-tight">
               {isWaiting ? '0' : Math.round(progress.percentage)}<span className="text-sm text-slate-500 ml-1">%</span>
             </span>
             {progress.speed && <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1">{progress.speed}</p>}
          </div>
        </div>

        {/* Glowing Progress Bar */}
        <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner border border-slate-800/50">
          <div 
            className={`h-full transition-all duration-300 ease-out shadow-[0_0_10px_currentColor] ${
              isCompleted ? 'bg-green-500 text-green-500' : 
              isError ? 'bg-red-500 text-red-500' : 
              isWaiting ? 'bg-yellow-500 text-yellow-500 w-full animate-pulse opacity-50' :
              'bg-indigo-500 text-indigo-500 relative'
            }`}
            style={{ width: isWaiting ? '100%' : `${progress.percentage}%` }}
          >
            {!isCompleted && !isError && !isWaiting && (
              <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-3 text-[10px] sm:text-xs text-slate-500 font-mono font-medium">
          <span>{isWaiting ? '-' : formatSize(progress.transferredSize)}</span>
          <span>{formatSize(progress.totalSize)}</span>
        </div>
      </div>

      {/* Action Footer */}
      {(isCompleted || isError) && (
        <div className="bg-slate-900/80 p-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-800">
           {isCompleted && !isSender && onDownload && (
             <Tooltip content="Save file to your device" position="top">
               <Button 
                 onClick={onDownload}
                 className="bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-green-900/20 w-full sm:w-auto justify-center"
               >
                 <Download size={18} /> Download File
               </Button>
             </Tooltip>
           )}
           <Button 
             onClick={onDismiss}
             variant="secondary"
             className="w-full sm:w-auto justify-center"
           >
             {isError ? <RefreshCw size={16} /> : (isSender ? <Upload size={16} /> : <ArrowRight size={16} />)}
             {isError ? 'Retry' : (isSender ? 'Send Another' : 'Done')}
           </Button>
        </div>
      )}
    </div>
  );
};