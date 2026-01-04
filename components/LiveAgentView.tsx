
import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, Eye, Activity, Terminal, Zap, Camera, Search, ExternalLink } from 'lucide-react';

interface LiveAgentViewProps {
  isCapturing: boolean;
  startCapture: () => void;
  stopCapture: () => void;
  stream: MediaStream | null;
  logs: {msg: string, type: 'info' | 'success' | 'warn'}[];
  lastPreview: string | null;
  isScanning: boolean;
  nextScanIn: number;
  onManualScan: () => void;
}

const LiveAgentView: React.FC<LiveAgentViewProps> = ({ 
  isCapturing, 
  startCapture, 
  stopCapture, 
  stream, 
  logs, 
  lastPreview, 
  isScanning, 
  nextScanIn,
  onManualScan
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [flash, setFlash] = useState(false);

  // Sync internal video element with global stream
  useEffect(() => {
    if (isCapturing && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCapturing, stream]);

  // Trigger flash effect when a new preview arrives
  useEffect(() => {
    if (lastPreview) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [lastPreview]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
        {/* Main Viewport Section */}
        <div className={`bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${isCapturing ? 'aspect-video w-full' : 'min-h-[520px] p-8'}`}>
          {isCapturing ? (
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain bg-black" 
              autoPlay 
              muted 
              playsInline 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Eye className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h3 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Ninja Vision</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.3em] mb-8">Autonomous Dashboard Synchronization</p>
              
              <div className="w-full bg-zinc-900/50 border border-zinc-800/80 rounded-[2rem] p-6 text-left shadow-xl backdrop-blur-sm">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Quick Start Sequence
                </h4>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-3 hover:bg-zinc-800/30 rounded-2xl transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-emerald-400 border border-zinc-700">01</div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-100">Prepare Environment</span>
                      <span className="text-[11px] leading-relaxed text-zinc-400">Open <a href="https://crazyninjaodds.com/site/tools/positive-ev.aspx" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/30 inline-flex items-center gap-1">Crazy Ninja Odds <ExternalLink className="w-2.5 h-2.5" /></a> in a separate tab.</span>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 hover:bg-zinc-800/30 rounded-2xl transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-emerald-400 border border-zinc-700">02</div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-100">Establish Link</span>
                      <span className="text-[11px] leading-relaxed text-zinc-400">Select the <b>"Sync Viewport"</b> button below and share that specific Chrome tab.</span>
                    </div>
                  </div>

                  <div className="flex gap-4 p-3 hover:bg-zinc-800/30 rounded-2xl transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-black text-emerald-400 border border-zinc-700">03</div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-100">System Monitoring</span>
                      <span className="text-[11px] leading-relaxed text-zinc-400">The Ninja Agent will perform automated OCR scans every 10 seconds.</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={startCapture} 
                className="mt-10 px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl flex items-center gap-4 transition-all active:scale-95 shadow-[0_20px_40px_rgba(16,185,129,0.2)] uppercase tracking-[0.2em] text-[10px] group"
              >
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /> 
                Sync Viewport
              </button>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className={`w-full h-[3px] ${isScanning ? 'bg-emerald-400 shadow-[0_0_30px_#10b981]' : 'bg-emerald-500/20'} absolute animate-scan top-0 transition-all duration-500`} />
              
              <div className="absolute bottom-6 left-6 flex items-center gap-4 pointer-events-auto">
                 <div className="px-5 py-2.5 bg-black/90 backdrop-blur-2xl border border-zinc-800 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase text-zinc-300 shadow-2xl">
                    <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-zinc-700'}`} />
                    {isScanning ? 'ANALYZING' : `RE-SCAN: ${nextScanIn}S`}
                 </div>
                 <button 
                  onClick={onManualScan} 
                  disabled={isScanning}
                  className="px-6 py-2.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-xl text-[9px] font-black text-zinc-300 uppercase tracking-widest transition-all disabled:opacity-50"
                 >
                   Manual shutter
                 </button>
              </div>

              <button onClick={stopCapture} className="absolute top-6 right-6 p-4 bg-zinc-950/90 hover:bg-rose-600 rounded-2xl border border-zinc-800 text-white pointer-events-auto transition-all shadow-2xl group active:scale-90">
                <Square className="w-5 h-5 fill-current" />
              </button>
            </div>
          )}
        </div>

        {/* Info Cluster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
           <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-[2.5rem] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2">
                 <Camera className="w-4 h-4 text-emerald-500" /> Neural Snapshot
              </div>
              <div className={`aspect-video bg-black rounded-[2rem] border border-zinc-800 overflow-hidden relative group flex items-center justify-center transition-all duration-300 ${flash ? 'ring-2 ring-emerald-400 scale-[1.02]' : ''}`}>
                 {lastPreview ? (
                   <img src={lastPreview} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                 ) : (
                   <div className="flex flex-col items-center gap-3 opacity-20">
                     <Search className="w-8 h-8" />
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Standby</span>
                   </div>
                 )}
                 {flash && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
           </div>
           
           <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] flex flex-col justify-center gap-5 group hover:bg-zinc-900/60 transition-all">
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 w-fit">
                <Zap className={`w-7 h-7 text-emerald-400 ${isScanning ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Vision Layer</div>
                <div className="text-base font-bold text-zinc-100">Flash-Scan Core</div>
              </div>
           </div>

           <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] flex flex-col justify-center gap-5 group hover:bg-zinc-900/60 transition-all">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 w-fit">
                <Activity className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Sync Status</div>
                <div className="text-base font-bold text-zinc-100">{isCapturing ? 'Active Stream' : 'Connection Idle'}</div>
              </div>
           </div>
        </div>
      </div>

      {/* Terminal Interface */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl h-full">
        <div className="p-7 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 backdrop-blur-md">
           <h3 className="font-black flex items-center gap-4 text-[11px] uppercase tracking-[0.3em]">
             <Terminal className="w-5 h-5 text-emerald-500" /> Agent Terminal
           </h3>
           <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${isCapturing ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
        <div className="flex-1 p-8 overflow-y-auto font-mono text-[11px] space-y-6 custom-scrollbar bg-black/40">
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-5 border-l-2 pl-5 py-2 transition-all animate-in slide-in-from-left-4 ${
              log.type === 'success' ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/5 rounded-r-2xl' : 
              log.type === 'warn' ? 'text-rose-400 border-rose-500/40 bg-rose-500/5 rounded-r-2xl' : 'text-zinc-500 border-zinc-800'
            }`}>
              <span className="opacity-30 shrink-0 select-none text-[10px]">[{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]</span>
              <span className="font-medium tracking-tight break-words leading-relaxed">{log.msg}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 gap-6">
               <div className="w-16 h-1.5 bg-zinc-700 rounded-full animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">Terminal Listen</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan { from { top: -5% } to { top: 105% } }
        .animate-scan { animation: scan 6s ease-in-out infinite alternate; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default LiveAgentView;
