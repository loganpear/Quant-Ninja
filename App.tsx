
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
  Power,
  Database,
  ChevronRight,
  ChevronLeft,
  Globe
} from 'lucide-react';
import ScannerView from './components/ScannerView';
import LedgerView from './components/LedgerView';
import DashboardView from './components/DashboardView';
import LiveAgentView from './components/LiveAgentView';
import MarketPulseView from './components/MarketPulseView';
import Sidebar from './components/Sidebar';
import ChatSection from './components/ChatSection';
import VisionSection from './components/VisionSection';
import CanvasSection from './components/CanvasSection';
import { processLiveFrame } from './services/gemini';

const INITIAL_BANKROLL = 1000;
const STORAGE_KEY = 'ninja_bets_v1';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  // --- PERSISTENCE LOGIC ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBets(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load bets from storage", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
    }
  }, [bets, isInitialized]);

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
    const stream = stateRef.current.agentStream;
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (agentTimerRef.current) clearInterval(agentTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setAgentStream(null);
    setIsAgentActive(false);
    addAgentLog("System disarmed.", "info");
  }, [addAgentLog]);

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
          addAgentLog("No active dashboard detected in viewport.", "warn");
          return;
        }

        if (result.bets.length > 0) {
          addNewBets(result.bets.filter(b => b.ev > 0));
        } else {
          addAgentLog("No new +EV lines found.", "info");
        }
      }
    } catch (e: any) {
      const msg = e.message || "API Connection error";
      addAgentLog(`Vision Error: ${msg}`, "warn");
    } finally {
      setIsAgentScanning(false);
      setNextScanIn(10);
    }
  }, [addNewBets, addAgentLog]);

  const startAgent = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15 }, displaySurface: 'browser' },
        audio: false
      });
      
      setAgentStream(stream);
      setIsAgentActive(true);
      addAgentLog("Establishing vision uplink...", "success");

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
        <video ref={hiddenVideoRef} autoPlay playsInline muted />
        <canvas ref={hiddenCanvasRef} />
      </div>

      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {/* Header bar with primary metrics */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Bankroll</span>
              <span className="text-sm font-mono font-bold text-emerald-400">${bankroll.toLocaleString()}</span>
            </div>
            <div className="w-px h-6 bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">In Play</span>
              <span className="text-sm font-mono font-bold text-rose-400">${financialData.inPlay.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isSyncing && (
              <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Market Syncing
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </header>

        {/* Dynamic view rendering */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeView === AppView.DASHBOARD && (
            <DashboardView 
              stats={stats} 
              bets={bets} 
              onSync={() => {}} 
              isSyncing={isSyncing} 
              inPlay={financialData.inPlay}
            />
          )}
          {activeView === AppView.MARKET_PULSE && (
            <MarketPulseView 
              onBetsDiscovered={addNewBets} 
              isSyncing={isSyncing} 
              setIsSyncing={setIsSyncing}
            />
          )}
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
          {activeView === AppView.SCANNER && (
            <ScannerView 
              onBetsExtracted={addNewBets} 
              bankroll={bankroll} 
            />
          )}
          {activeView === AppView.LEDGER && (
            <LedgerView 
              bets={bets} 
              onUpdateBets={setBets} 
            />
          )}
          {activeView === AppView.CHAT && <ChatSection />}
          {activeView === AppView.VISION && <VisionSection />}
          {activeView === AppView.CANVAS && <CanvasSection />}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>
    </div>
  );
};

export default App;
