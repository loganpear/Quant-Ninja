
import React, { useState } from 'react';
import { Globe, Search, Zap, ExternalLink, Loader2, Radar, ShieldCheck, Clock, Check, Trash2, TrendingUp } from 'lucide-react';
import { Bet } from '../types';
import { syncBetsFromWeb } from '../services/gemini';

interface MarketPulseViewProps {
  onBetsDiscovered: (bets: Bet[]) => void;
  isSyncing: boolean;
  setIsSyncing: (val: boolean) => void;
}

const MarketPulseView: React.FC<MarketPulseViewProps> = ({ onBetsDiscovered, isSyncing, setIsSyncing }) => {
  const [discovered, setDiscovered] = useState<Bet[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const results = await syncBetsFromWeb();
      setDiscovered(results);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePlaceBet = (bet: Bet) => {
    onBetsDiscovered([bet]);
    setDiscovered(prev => prev.filter(b => b.id !== bet.id));
  };

  const handleDiscard = (id: string) => {
    setDiscovered(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/40 border border-zinc-800 p-8 rounded-[3rem]">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em]">
             <Radar className={`w-4 h-4 ${isSyncing ? 'animate-ping' : ''}`} />
             Market Pulse Core
           </div>
           <h2 className="text-3xl font-black italic tracking-tighter uppercase">Discovery Engine</h2>
           <p className="text-zinc-500 text-sm max-w-md">Gemini AI crawls live betting aggregators to identify current +EV opportunities across major markets.</p>
        </div>
        
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black rounded-3xl transition-all shadow-2xl shadow-emerald-600/20 flex items-center gap-4 group uppercase tracking-[0.2em] text-[10px] active:scale-95"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scanning Global Markets...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Initialize Scan
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Opportunity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-black uppercase tracking-widest text-xs text-zinc-400">Potential Positions</h3>
            {lastSync && (
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Last Search: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {discovered.map((bet) => (
              <div key={bet.id} className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-6 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <TrendingUp className="w-32 h-32 text-emerald-500" />
                </div>

                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-[9px] font-black uppercase tracking-widest border border-zinc-700">{bet.bookie}</span>
                         <h4 className="font-bold text-lg text-zinc-100">{bet.event}</h4>
                      </div>
                      <p className="text-zinc-400 font-medium text-sm">{bet.market}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {bet.groundingSources?.slice(0, 2).map((src, idx) => (
                          <a 
                            key={idx} 
                            href={src.uri} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-bold text-zinc-500 hover:text-emerald-400 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {src.title?.length ? src.title.substring(0, 15) + '...' : 'Verify Odds'}
                          </a>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 self-start md:self-center">
                      <div className="text-right">
                        <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Odds</div>
                        <div className="text-xl font-mono font-bold text-zinc-100">{bet.odds.toFixed(2)}</div>
                      </div>
                      <div className="w-[1px] h-10 bg-zinc-800" />
                      <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center group-hover:bg-emerald-500/20 transition-all shadow-inner">
                        <div className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest mb-1">EV%</div>
                        <div className="text-xl font-black text-emerald-400">+{bet.ev}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
                     <button 
                       onClick={() => handlePlaceBet(bet)}
                       className="flex-1 py-3 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                     >
                        <Check className="w-4 h-4" />
                        Confirm and Place
                     </button>
                     <button 
                       onClick={() => handleDiscard(bet.id)}
                       className="px-6 py-3 bg-zinc-900 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 border border-zinc-800 hover:border-rose-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </div>
            ))}
            
            {discovered.length === 0 && !isSyncing && (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-[3rem] text-zinc-600 gap-4">
                 <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                    <Zap className="w-8 h-8 opacity-20" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-[0.3em]">Pulse Silent - Scan Required</p>
              </div>
            )}

            {isSyncing && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-44 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-[3rem] animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Status/Info */}
        <div className="space-y-6">
           <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-8 space-y-6 sticky top-8">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl w-fit">
                 <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Market Pulse Protocol</h3>
              <div className="space-y-5">
                 <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_#10b981]" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">Temporal Filtering</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">System cross-references current UTC time to prevent historical line drift.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_#10b981]" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">Grounding Check</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">Gemini verify bookmaker odds against live web results via Google Search.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_#10b981]" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-zinc-200 uppercase tracking-widest">Manual Confirmation</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">No bets are logged without your explicit 'Confirm' command to manage bankroll risk.</p>
                    </div>
                 </div>
              </div>
              <div className="pt-6 border-t border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Always verify lines on the specific bookmaker before manual placement.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MarketPulseView;
