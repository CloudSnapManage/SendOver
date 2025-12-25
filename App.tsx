import React, { useState } from 'react';
import { usePeer } from './hooks/usePeer';
import { Connection } from './components/Connection';
import { FileInput } from './components/FileInput';
import { Status } from './components/Status';
import { IncomingRequest } from './components/IncomingRequest';
import { Toast } from './components/Toast';
import { TypewriterName } from './components/TypewriterName';
import { TypewriterText } from './components/TypewriterText';
import { ConnectionState } from './types';
import { Send, ShieldCheck, Zap, Github } from 'lucide-react';

export default function App() {
  const { 
    myPeerId, 
    connectionState, 
    progress, 
    connectToPeer,
    disconnect, 
    sendFile, 
    acceptFile, 
    rejectFile,
    downloadReceivedFile,
    resetTransfer,
    nextRotationTime,
    notification,
    latency,
    dismissToast
  } = usePeer();

  // Simple mode switching: True = Host (Wait), False = Join (Connect)
  const [isHost, setIsHost] = useState(true);

  const isConnected = connectionState === ConnectionState.CONNECTED;

  const handleFileSelect = (files: File[]) => {
    sendFile(files);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center relative overflow-x-hidden bg-slate-950 selection:bg-indigo-500/30">
      
      {/* GitHub Corner Container */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 flex flex-col items-end">
        <a 
          href="https://github.com/CloudSnapManage/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 sm:p-2.5 bg-slate-800/30 hover:bg-slate-700/50 backdrop-blur-md rounded-full text-slate-500 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300 group shadow-lg hover:shadow-indigo-500/20 mb-1"
          aria-label="View on GitHub"
          title="View on GitHub"
        >
          <Github className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
        </a>
        
        {/* Animated Name */}
        <TypewriterName />
      </div>

      {/* Toast Notification Container */}
      <Toast notification={notification} onDismiss={dismissToast} />

      {/* Dynamic Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         {/* Subtle Gradient Mesh Background */}
         <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 animate-gradient-slow opacity-100" />
         
         {/* Floating Blobs with Mix Blend Modes for Depth - Responsive Sizes */}
         <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] md:w-[600px] md:h-[600px] bg-indigo-500/10 rounded-full blur-[80px] md:blur-[120px] animate-float opacity-60 mix-blend-screen" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] md:w-[500px] md:h-[500px] bg-cyan-500/10 rounded-full blur-[60px] md:blur-[100px] animate-float-reverse opacity-50 mix-blend-screen" style={{ animationDelay: '-5s' }} />
         <div className="absolute top-[40%] left-[20%] w-[50vw] h-[50vw] md:w-[400px] md:h-[400px] bg-purple-500/10 rounded-full blur-[50px] md:blur-[90px] animate-float opacity-40 mix-blend-screen" style={{ animationDelay: '-2s' }} />
         <div className="absolute bottom-[20%] left-[-10%] w-[40vw] h-[40vw] md:w-[300px] md:h-[300px] bg-blue-600/10 rounded-full blur-[40px] md:blur-[80px] animate-float-reverse opacity-30 mix-blend-screen" style={{ animationDelay: '-7s' }} />
      </div>

      {/* Main Content Wrapper */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center px-4 py-8 sm:p-8 md:p-12 lg:p-16">
        
        {/* Header */}
        <header className="w-full text-center mb-8 md:mb-12 animate-fade-in-up">
          <div 
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center p-3 md:p-4 bg-slate-800/40 backdrop-blur-md rounded-2xl mb-4 md:mb-6 ring-1 ring-white/10 shadow-2xl shadow-indigo-500/10 hover:scale-105 hover:shadow-indigo-500/20 transition-all duration-500 cursor-pointer group"
          >
            <Send className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4 md:mb-6 drop-shadow-lg animate-shrink-in">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 animate-text-shimmer">
              SendOver
            </span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl max-w-md mx-auto leading-relaxed font-light px-2 min-h-[56px] sm:min-h-[64px]">
            <span className="block sm:inline">
              <TypewriterText 
                text="Secure, direct peer-to-peer file transfer." 
                delay={500} 
                baseTextColor="text-slate-400" 
              />
            </span>
            <span className="hidden sm:inline"> </span>
            <span className="block sm:inline">
              <TypewriterText 
                text="No servers. No limits. Just web." 
                delay={1300} 
                baseTextColor="text-slate-500" 
              />
            </span>
          </p>
        </header>

        <main className="w-full max-w-lg space-y-6 md:space-y-8 pb-12 flex-1">
          
          {/* Connection Section */}
          <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Connection 
              myPeerId={myPeerId}
              connectionState={connectionState}
              onConnect={connectToPeer}
              onDisconnect={disconnect}
              isHost={isHost}
              toggleMode={() => setIsHost(!isHost)}
              nextRotationTime={nextRotationTime}
              latency={latency}
            />
          </section>

          {/* Transfer Section - Only visible when connected */}
          {isConnected && (
            <section className="bg-slate-800/30 backdrop-blur-md rounded-3xl p-1 shadow-2xl border border-white/5 animate-fade-in-up transition-all hover:border-white/10">
              <div className="bg-slate-900/60 rounded-[20px] p-4 sm:p-6 border border-slate-800/50">
                <h2 className="text-base sm:text-lg font-semibold mb-6 flex items-center gap-2 text-slate-200">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                    <Zap className="text-indigo-400" size={16} />
                  </div>
                  Transfer Console
                </h2>
                
                <div className="space-y-6">
                  {progress.status === 'INCOMING' ? (
                     <IncomingRequest 
                        fileName={progress.fileName}
                        fileSize={progress.totalSize}
                        onAccept={acceptFile}
                        onReject={rejectFile}
                     />
                  ) : progress.status === 'IDLE' ? (
                     <FileInput onFileSelect={handleFileSelect} />
                  ) : (
                     <Status 
                       progress={progress} 
                       onDownload={downloadReceivedFile}
                       onDismiss={resetTransfer}
                     />
                  )}
                </div>
              </div>
              
              <div className="py-3 text-center">
                 <p className="text-[10px] text-slate-600 font-medium uppercase tracking-widest flex items-center justify-center gap-1.5">
                   <ShieldCheck size={12} className="text-indigo-500/50" /> End-to-End Encrypted via WebRTC
                 </p>
              </div>
            </section>
          )}

        </main>

        {/* Footer */}
        <footer className="mt-auto text-slate-600 text-xs sm:text-sm font-medium py-6 animate-fade-in-up text-center w-full" style={{ animationDelay: '0.2s' }}>
          <p className="opacity-50 hover:opacity-100 transition-opacity">
            &copy; {new Date().getFullYear()} SendOver. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}