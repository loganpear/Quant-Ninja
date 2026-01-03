
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppView, Bet, SimulationStats } from './types';
import { 
  TrendingUp, 
  ScanLine, 
  History, 
  RefreshCw,
  Wallet,
  Zap,
  Eye,
  ShieldAlert,
  Power
} from 'lucide-react';
import ScannerView from './components/ScannerView';
import LedgerView from './components/LedgerView';
import DashboardView from './components/DashboardView';
import LiveAgentView from './components/LiveAgentView';
import { syncBetsFromWeb, processLiveFrame } from './services/gemini';

const INITIAL_BANKROLL = 1000;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Background Live Agent State ---
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [agentStream, setAgentStream] = useState<MediaStream | null>(null);
  const [agentLogs, setAgentLogs] = useState<{msg: string, type: 'info' | 'success' | 'warn'}[]>([]);
  const [lastAgentPreview, setLastAgentPreview] = useState<string | null>(null);
  const [isAgentScanning, setIsAgentScanning] = useState(false);
  const [nextScanIn, setNextScanIn] = useState(10);
  
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const agentTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  
  const stateRef = useRef({ isAgentScanning, isAgentActive, agentStream, bets });
  
  useEffect(() => {
    stateRef.current = { isAgentScanning, isAgentActive, agentStream, bets };
  }, [isAgentScanning, isAgentActive, agentStream, bets]);

  const financialData = useMemo(() => {
    let availableCash = INITIAL_BANKROLL;
    let inPlay = 0;
    let totalWins = 0;
    let totalLosses = 0;

    bets.forEach(bet => {
      availableCash -= bet.stake;
      if (bet.status === 'PENDING') {
        inPlay += bet.stake;
      } else if (bet.status === 'WON') {
        availableCash += (bet.stake * bet.odds);
        totalWins++;
      } else if (bet.status === 'LOST') {
        totalLosses++;
      }
    });

    return { 
      availableCash: Math.max(0, availableCash), 
      inPlay, 
      totalWins, 
      totalLosses,
      currentEquity: availableCash + inPlay
    };
  }, [bets]);

  const bankroll = financialData.availableCash;

  const addAgentLog = useCallback((msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setAgentLogs(prev => [{ msg, type }, ...prev].slice(0, 50));
  }, []);

  const stopAgent = useCallback(() => {
    if (agentStream) agentStream.getTracks().forEach(t => t.stop());
    if (agentTimerRef.current) clearInterval(agentTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setAgentStream(null);
    setIsAgentActive(false);
    addAgentLog("System disarmed.", "info");
  }, [agentStream, addAgentLog]);

  const calculateKellyStake = useCallback((ev: number, odds: number, currentBank: number) => {
    if (!ev || !odds || odds <= 1) return 0;
    const b = odds - 1;
    const p = (ev / 100 + 1) / odds;
    const q = 1 - p;
    const fraction = (b * p - q) / b;
    const kelly = Math.max(0, fraction * 0.25); 
    const stake = Math.floor(currentBank * kelly * 100) / 100;
    return isNaN(stake) ? 0 : stake;
  }, []);

  const addNewBets = useCallback((newBets: Bet[]) => {
    setBets(prev => {
      const trulyNew = newBets.filter(nb => {
        if (nb.ev <= 0) return false;
        return !prev.some(existing => 
          existing.event === nb.event && 
          existing.market === nb.market && 
          Math.abs(existing.timestamp - nb.timestamp) < 600000 
        );
      });

      if (trulyNew.length === 0) return prev;

      const finalized = trulyNew.map(nb => {
        const stake = calculateKellyStake(nb.ev, nb.odds, bankroll);
        return { ...nb, stake };
      }).filter(nb => nb.stake > 0);

      if (finalized.length === 0) return prev;
      addAgentLog(`Auto-placed ${finalized.length} positions.`, "success");
      return [...finalized, ...prev];
    });
  }, [bankroll, calculateKellyStake, addAgentLog]);

  const performAgentScan = useCallback(async () => {
    const { isAgentScanning: currentScanning, agentStream: currentStream } = stateRef.current;
    if (currentScanning || !currentStream || !hiddenVideoRef.current) return;
    
    const video = hiddenVideoRef.current;
    const canvas = hiddenCanvasRef.current;
    if (video.videoWidth === 0 || video.readyState < 2 || !canvas) return;

    setIsAgentScanning(true);
    addAgentLog("Scanning viewport...", "info");

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        setLastAgentPreview(frameData); 

        const result = await processLiveFrame(frameData);
        
        if (!result.isValid) {
          addAgentLog("Invalid viewport detected. Auto-terminating link.", "warn");
          stopAgent();
          return;
        }

        if (result.bets.length > 0) {
          addNewBets(result.bets.filter(b => b.ev > 0));
        } else {
          addAgentLog("No new +EV lines found.", "info");
        }
      }
    } catch (e: any) {
      addAgentLog(`Vision error: ${e.message}`, "warn");
    } finally {
      setIsAgentScanning(false);
      setNextScanIn(10);
    }
  }, [addNewBets, addAgentLog, stopAgent]);

  const startAgent = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15 }, displaySurface: 'browser' },
        audio: false
      });
      
      setAgentStream(stream);
      setIsAgentActive(true);
      addAgentLog("Handshake complete. Vision online.", "success");

      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = stream;
        try { await hiddenVideoRef.current.play(); } catch (e) {}
      }

      if (agentTimerRef.current) clearInterval(agentTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      
      agentTimerRef.current = window.setInterval(() => performAgentScan(), 10000);
      countdownRef.current = window.setInterval(() => {
        setNextScanIn(prev => (prev <= 1 ? 10 : prev - 1));
      }, 1000);

      stream.getVideoTracks()[0].onended = stopAgent;
      setTimeout(() => performAgentScan(), 2000);
    } catch (err: any) {
      addAgentLog(`Access failed: ${err.message}`, "warn");
    }
  };

  useEffect(() => {
    const savedBets = localStorage.getItem('ninja_bets');
    if (savedBets) setBets(JSON.parse(savedBets));
  }, []);

  useEffect(() => {
    localStorage.setItem('ninja_bets', JSON.stringify(bets));
  }, [bets]);

  const handleWebSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const discovered = await syncBetsFromWeb();
      addNewBets(discovered.filter(b => b.ev > 0));
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  };

  const stats: SimulationStats = {
    initialBankroll: INITIAL_BANKROLL,
    currentBankroll: bankroll,
    totalBets: bets.length,
    winRate: financialData.totalWins / (bets.filter(b => b.status !== 'PENDING').length || 1) * 100,
    roi: ((financialData.currentEquity - INITIAL_BANKROLL) / INITIAL_BANKROLL) * 100
  };

  return (
    <div className="flex h-screen bg-[#050506] text-zinc-100 overflow-hidden font-sans">
      <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
        <video ref={hiddenVideoRef} muted playsInline autoPlay style={{ width: '1280px', height: '720px' }} />
        <canvas ref={hiddenCanvasRef} />
      </div>

      <nav className="w-20 border-r border-zinc-800 flex flex-col items-center py-8 gap-8 bg-[#09090b] z-50">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Zap className="text-black w-6 h-6 fill-current" />
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          {[
            { id: AppView.DASHBOARD, icon: TrendingUp },
            { id: AppView.LIVE_AGENT, icon: Eye, badge: isAgentActive },
            { id: AppView.SCANNER, icon: ScanLine },
            { id: AppView.LEDGER, icon: History },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`p-3 rounded-xl transition-all relative ${
                activeView === item.id 
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <item.icon className="w-6 h-6" />
              {'badge' in item && item.badge && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={() => confirm("Reset all local data?") && (localStorage.clear(), window.location.reload())}
          className="p-3 text-zinc-600 hover:text-red-400 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-zinc-800 px-8 flex items-center justify-between bg-[#09090b]/50 backdrop-blur-xl z-40">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight italic">QUANT NINJA</h1>
            
            <div className="flex items-center gap-3 h-8 px-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className={`w-2 h-2 rounded-full ${isAgentActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-800'}`} />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {isAgentActive ? `Vision Online: ${nextScanIn}s` : 'Vision Standby'}
              </span>
            </div>
            {isAgentActive && (
              <button 
                onClick={stopAgent}
                className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              >
                <Power className="w-3 h-3" /> Kill Switch
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 px-4 py-1.5 rounded-full">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-mono font-bold">
                  ${bankroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {financialData.inPlay > 0 && (
                <div className="flex items-center gap-1.5 mt-1 mr-4">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">
                    -${financialData.inPlay.toFixed(2)} Risk Exposure
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeView === AppView.DASHBOARD && (
            <DashboardView 
              stats={stats} 
              bets={bets} 
              onSync={handleWebSync} 
              isSyncing={isSyncing} 
              inPlay={financialData.inPlay} 
            />
          )}
          {activeView === AppView.SCANNER && <ScannerView onBetsExtracted={addNewBets} bankroll={bankroll} />}
          {activeView === AppView.LEDGER && <LedgerView bets={bets} onUpdateBets={setBets} />}
          {activeView === AppView.LIVE_AGENT && (
            <LiveAgentView 
              isCapturing={isAgentActive}
              startCapture={startAgent}
              stopCapture={stopAgent}
              stream={agentStream}
              logs={agentLogs}
              lastPreview={lastAgentPreview}
              isScanning={isAgentScanning}
              nextScanIn={nextScanIn}
              onManualScan={performAgentScan}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
