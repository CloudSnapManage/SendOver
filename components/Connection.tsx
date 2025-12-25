import React, { useState, useEffect } from 'react';
import { Copy, Link as LinkIcon, AlertCircle, CheckCircle2, UserPlus, Radio, Hash, RefreshCw, ArrowRightLeft, Check, Clock, SignalHigh, SignalMedium, SignalLow, Power } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { ConnectionState } from '../types';

interface ConnectionProps {
  myPeerId: string;
  connectionState: ConnectionState;
  onConnect: (peerId: string) => void;
  onDisconnect: () => void;
  isHost: boolean;
  toggleMode: () => void;
  nextRotationTime: number | null;
  latency: number | null;
}

export const Connection: React.FC<ConnectionProps> = ({ 
  myPeerId, 
  connectionState, 
  onConnect,
  onDisconnect,
  isHost,
  toggleMode,
  nextRotationTime,
  latency
}) => {
  const [remoteIdInput, setRemoteIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Extract the 6-digit code if the ID matches the pattern
  const shortCode = myPeerId.startsWith('sendover-') ? myPeerId.replace('sendover-', '') : null;

  useEffect(() => {
    if (!nextRotationTime || connectionState === ConnectionState.CONNECTED) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, nextRotationTime - now);
      
      if (diff === 0) {
         setTimeLeft('Refreshing...');
      } else {
         const mins = Math.floor(diff / 60000);
         const secs = Math.floor((diff % 60000) / 1000);
         setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextRotationTime, connectionState]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortCode || myPeerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (remoteIdInput.trim()) {
      onConnect(remoteIdInput.trim());
    }
  };

  const getSignalIcon = (latency: number) => {
    if (latency < 50) return <SignalHigh size={16} className="text-green-400" />;
    if (latency < 150) return <SignalMedium size={16} className="text-yellow-400" />;
    return <SignalLow size={16} className="text-red-400" />;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-1 shadow-2xl border border-white/5 ring-1 ring-white/5 hover:border-white/10 transition-colors duration-500">
      <div className="bg-slate-900/60 rounded-[20px] p-4 sm:p-6 border border-slate-800/50">
        
        {/* Header & Status */}
        <div className="flex flex-wrap items-center justify-between mb-6 sm:mb-8 gap-3">
          <div className="flex items-center gap-3">
             <div className="relative shrink-0">
                <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${
                  connectionState === ConnectionState.CONNECTED ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 
                  connectionState === ConnectionState.CONNECTING ? 'bg-yellow-500' : 
                  connectionState === ConnectionState.ERROR ? 'bg-red-500' : 'bg-slate-500'
                }`} />
                {connectionState === ConnectionState.CONNECTING && (
                  <div className="absolute inset-0 rounded-full bg-yellow-500 animate-ping opacity-75"></div>
                )}
                {connectionState === ConnectionState.CONNECTED && (
                   <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 duration-1000"></div>
                )}
             </div>
             <div className="min-w-0">
               <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
               <div className="flex items-center gap-2 flex-wrap">
                 <p className={`text-xs sm:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    connectionState === ConnectionState.CONNECTED ? 'text-green-400' : 
                    connectionState === ConnectionState.CONNECTING ? 'text-yellow-400' : 
                    connectionState === ConnectionState.ERROR ? 'text-red-400' : 'text-slate-300'
                 }`}>
                   {connectionState === ConnectionState.CONNECTED ? 'Connected' : 
                    connectionState === ConnectionState.CONNECTING ? 'Connecting...' : 
                    'Disconnected'}
                 </p>
                 
                 {/* Signal Strength & Latency Indicator */}
                 {connectionState === ConnectionState.CONNECTED && latency !== null && (
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 animate-fade-in-up">
                      {getSignalIcon(latency)}
                      <span className="text-[10px] sm:text-xs font-mono text-slate-400">{latency}ms</span>
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Manual Disconnect Button */}
          {connectionState === ConnectionState.CONNECTED && (
            <Tooltip content="Disconnect from peer" position="left">
              <button 
                onClick={onDisconnect}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all active:scale-95 ml-auto sm:ml-0"
              >
                 <Power size={18} />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Mode Toggle (Segmented Control) */}
        <div className={`relative flex bg-slate-950/80 rounded-xl p-1.5 border border-slate-800 mb-6 sm:mb-8 shadow-inner overflow-hidden transition-opacity duration-300 ${connectionState === ConnectionState.CONNECTED ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
              isHost ? 'translate-x-0' : 'translate-x-[calc(100%+12px)]'
            }`} 
          />
          <button
            onClick={() => !isHost && toggleMode()}
            className={`relative z-10 w-1/2 py-2 sm:py-2.5 rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
              isHost ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft size={14} className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-500 ${isHost ? 'rotate-180' : ''}`} /> Receive (Host)
          </button>
          <button
            onClick={() => isHost && toggleMode()}
            className={`relative z-10 w-1/2 py-2 sm:py-2.5 rounded-lg text-[10px] xs:text-xs sm:text-sm font-semibold transition-colors duration-300 flex items-center justify-center gap-1 sm:gap-2 ${
              !isHost ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon size={14} className="w-3 h-3 sm:w-4 sm:h-4" /> Send (Connect)
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="min-h-[180px] sm:min-h-[220px]">
          {isHost ? (
            <div className="animate-fade-in-up flex flex-col items-center justify-center h-full">
              <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-4 font-medium">Your 6-Digit Connection Code</p>
              
              <Tooltip content="Click to copy your connection code" position="top">
                <div 
                  className={`relative group cursor-pointer mb-2 transform transition-transform duration-200 active:scale-95 ${connectionState === ConnectionState.CONNECTED ? 'pointer-events-none opacity-80' : ''}`}
                  onClick={handleCopy}
                >
                  {shortCode ? (
                    <div className={`relative z-10 text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-mono font-bold tracking-widest text-transparent bg-clip-text drop-shadow-sm select-all group-hover:scale-105 transition-transform duration-300 ${connectionState === ConnectionState.CONNECTED ? 'bg-gradient-to-br from-green-300 to-green-600' : 'bg-gradient-to-br from-white to-slate-400'}`}>
                      {shortCode.slice(0, 3)}<span className="text-slate-700 mx-1 sm:mx-2">-</span>{shortCode.slice(3)}
                    </div>
                  ) : (
                    <div className="h-12 sm:h-16 flex items-center gap-2 text-slate-600">
                      <RefreshCw className="animate-spin w-5 h-5 sm:w-6 sm:h-6" /> <span className="text-sm sm:text-base">Generating...</span>
                    </div>
                  )}
                  
                  <div className={`absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-medium transition-all duration-300 flex items-center gap-1 ${copied ? 'text-green-400 opacity-100 translate-y-0' : 'text-indigo-400 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                     {copied ? <Check size={12}/> : null}
                     {copied ? 'Copied to clipboard!' : 'Click to copy'}
                  </div>
                </div>
              </Tooltip>

              {/* Countdown Timer - Hide when connected */}
              {timeLeft && connectionState !== ConnectionState.CONNECTED && (
                <div className="mb-4 sm:mb-6 flex items-center gap-2 text-[10px] sm:text-xs font-mono text-slate-500 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800">
                   <Clock size={12} className="text-slate-400" /> 
                   <span>Expires in <span className="text-slate-300">{timeLeft}</span></span>
                </div>
              )}

              {connectionState !== ConnectionState.CONNECTED && (
                <div className="w-full max-w-xs bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-start gap-3 mt-2 animate-pulse-slow">
                   <div className="bg-indigo-500/20 p-1.5 rounded-full shrink-0">
                     <Radio size={14} className="text-indigo-400 animate-pulse sm:w-4 sm:h-4" />
                   </div>
                   <div className="text-[10px] sm:text-xs text-indigo-200/80 leading-relaxed">
                     Keep this window open. The sender needs this code to transfer files to you.
                   </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleConnect} className="animate-fade-in-up h-full flex flex-col justify-center">
               <div className="space-y-4">
                 <div>
                   <label htmlFor="remoteId" className="block text-xs sm:text-sm font-medium text-slate-300 mb-2 ml-1">Enter Receiver's Code</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Hash size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300 sm:w-5 sm:h-5" />
                     </div>
                     <input
                       id="remoteId"
                       type="text"
                       value={remoteIdInput}
                       onChange={(e) => setRemoteIdInput(e.target.value)}
                       placeholder="000 000"
                       className="w-full bg-slate-950/50 pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl text-white placeholder-slate-600 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-300 font-mono text-xl sm:text-2xl tracking-widest shadow-inner group-hover:border-slate-600"
                       disabled={connectionState === ConnectionState.CONNECTED}
                       autoComplete="off"
                       maxLength={7}
                     />
                   </div>
                 </div>
                 
                 <Button 
                   type="submit" 
                   className="w-full py-3 sm:py-3.5 text-sm sm:text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300"
                   disabled={!remoteIdInput || connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.CONNECTING}
                   isLoading={connectionState === ConnectionState.CONNECTING}
                 >
                   {connectionState === ConnectionState.CONNECTED ? 'Connected' : 'Establish Connection'}
                 </Button>

                 <p className="text-[10px] sm:text-xs text-slate-500 text-center mt-2 flex items-center justify-center gap-1 opacity-70">
                   <CheckCircle2 size={10} /> Peer-to-peer encrypted connection
                 </p>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};