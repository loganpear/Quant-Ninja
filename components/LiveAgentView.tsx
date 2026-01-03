
import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, Eye, Activity, Terminal, Zap, Camera, Info, Search } from 'lucide-react';

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Main Viewport */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden relative aspect-video flex items-center justify-center shadow-2xl group">
          {isCapturing ? (
            <video 
              ref={videoRef} 
              className="w-full h-full object-contain bg-black" 
              autoPlay 
              muted 
              playsInline 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/90 backdrop-blur-3xl z-40">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 border border-emerald-500/20">
                <Eye className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-4xl font-black italic tracking-tighter uppercase">Ninja Vision</h3>
              <p className="text-zinc-500 text-sm max-w-sm mt-4 font-medium leading-relaxed">Agent status: Disarmed. Establish a data link to begin autonomous market monitoring.</p>
              <button onClick={startCapture} className="mt-8 px-14 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl flex items-center gap-4 transition-all active:scale-95 shadow-[0_0_50px_rgba(16,185,129,0.3)] uppercase tracking-[0.2em] text-[10px]">
                <Play className="w-4 h-4 fill-current" /> Establish Link
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
                   Manual Shutter
                 </button>
              </div>

              <button onClick={stopCapture} className="absolute top-6 right-6 p-4 bg-zinc-950/90 hover:bg-rose-600 rounded-2xl border border-zinc-800 text-white pointer-events-auto transition-all shadow-2xl group active:scale-90">
                <Square className="w-5 h-5 fill-current" />
              </button>
            </div>
          )}
        </div>

        {/* Info Cluster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2.5rem] flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                 <Camera className="w-4 h-4 text-emerald-500" /> Neural Snapshot
              </div>
              <div className={`aspect-video bg-black rounded-3xl border border-zinc-800 overflow-hidden relative group flex items-center justify-center transition-all duration-300 ${flash ? 'ring-2 ring-emerald-400 scale-[1.02]' : ''}`}>
                 {lastPreview ? (
                   <img src={lastPreview} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                 ) : (
                   <div className="flex flex-col items-center gap-2 opacity-20">
                     <Search className="w-6 h-6" />
                     <span className="text-[8px] font-black uppercase tracking-widest italic">Standby</span>
                   </div>
                 )}
                 {flash && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
              </div>
           </div>
           
           <div className="p-7 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] flex flex-col justify-center gap-4 group hover:bg-zinc-900/80 transition-all border-dashed">
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 w-fit">
                <Zap className={`w-6 h-6 text-emerald-400 ${isScanning ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Vision Layer</div>
                <div className="text-sm font-bold text-zinc-100">Flash-Scan Core</div>
              </div>
           </div>

           <div className="p-7 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] flex flex-col justify-center gap-4 group hover:bg-zinc-900/80 transition-all">
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 w-fit">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Status</div>
                <div className="text-sm font-bold text-zinc-100">{isCapturing ? 'Synchronized' : 'Offline'}</div>
              </div>
           </div>
        </div>
      </div>

      {/* Terminal Interface */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl h-full lg:max-h-none">
        <div className="p-7 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
           <h3 className="font-black flex items-center gap-4 text-xs uppercase tracking-[0.3em]">
             <Terminal className="w-5 h-5 text-emerald-500" /> Agent Terminal
           </h3>
           <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${isCapturing ? 'bg-emerald-500 shadow-[0_0_20px_#10b981]' : 'bg-zinc-800'}`} />
        </div>
        <div className="flex-1 p-8 overflow-y-auto font-mono text-[11px] space-y-5 custom-scrollbar bg-black/30">
          {logs.map((log, i) => (
            <div key={i} className={`flex gap-5 border-l-2 pl-5 py-1.5 transition-all animate-in slide-in-from-left-4 ${
              log.type === 'success' ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/5 rounded-r-xl' : 
              log.type === 'warn' ? 'text-rose-400 border-rose-500/40 bg-rose-500/5 rounded-r-xl' : 'text-zinc-500 border-zinc-800'
            }`}>
              <span className="opacity-25 shrink-0 select-none">[{new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]</span>
              <span className="font-medium tracking-tight break-words">{log.msg}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
               <div className="w-12 h-1 bg-zinc-800 rounded-full animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Listening</p>
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
