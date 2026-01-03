
import React, { useState, useRef } from 'react';
import { Upload, ScanLine, Loader2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { extractBetsFromImage } from '../services/gemini';
import { Bet } from '../types';

interface ScannerViewProps {
  onBetsExtracted: (bets: Bet[]) => void;
  bankroll: number;
}

const ScannerView: React.FC<ScannerViewProps> = ({ onBetsExtracted, bankroll }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateKellyStake = (ev: number, odds: number, bankroll: number) => {
    // Basic Kelly Criterion: f = (bp - q) / b
    // b = decimal odds - 1
    // p = estimated probability (calculated from EV and Market odds)
    // For this sim, we use a fractional Kelly (0.25) to be conservative
    const b = odds - 1;
    // EV = (Odds * P) - 1 => P = (EV + 1) / Odds
    const p = (ev / 100 + 1) / odds;
    const q = 1 - p;
    const fraction = (b * p - q) / b;
    const kelly = Math.max(0, fraction * 0.25); // Quarter Kelly
    return Math.floor(bankroll * kelly * 100) / 100;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const extracted = await extractBetsFromImage(base64);
        
        // Finalize bets with stakes based on Kelly
        const finalized = extracted.map(b => ({
          ...b,
          stake: calculateKellyStake(b.ev, b.odds, bankroll)
        })).filter(b => b.stake > 0);

        if (finalized.length === 0) {
          setError("No viable +EV bets found in this image or bankroll too low.");
        } else {
          onBetsExtracted(finalized);
        }
      } catch (err) {
        setError("Failed to parse image. Ensure it's a clear screenshot of the odds table.");
        console.error(err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Vision Scanner</h2>
        <p className="text-zinc-500">Upload a screenshot from Crazy Ninja Odds to simulate bets.</p>
      </div>

      <div 
        onClick={() => !isScanning && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all min-h-[400px] ${
          isScanning 
            ? 'border-emerald-500/50 bg-emerald-500/5 animate-pulse' 
            : 'border-zinc-800 bg-zinc-900/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
        
        {isScanning ? (
          <div className="flex flex-col items-center gap-4 text-emerald-400">
            <Loader2 className="w-12 h-12 animate-spin" />
            <div className="text-center">
              <p className="font-bold text-lg">AI Extracting Data...</p>
              <p className="text-sm opacity-70">Gemini is identifying +EV opportunities</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 text-zinc-400 group-hover:text-emerald-400">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
              <Upload className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-zinc-200">Drop screenshot or click to upload</p>
              <p className="text-sm mt-1">Supports PNG, JPG (Crazy Ninja Odds Table View)</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-rose-400 bg-rose-400/10 px-4 py-2 rounded-lg border border-rose-400/20">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Info, title: "Kelly Criterion", desc: "Simulation uses 1/4 Kelly to manage risk." },
          { icon: CheckCircle2, title: "Unique IDs", desc: "Prevents duplicate bet logging." },
          { icon: ScanLine, title: "Vision OCR", desc: "No manual data entry required." }
        ].map((item, idx) => (
          <div key={idx} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-start gap-3">
            <item.icon className="w-5 h-5 text-emerald-500 mt-1" />
            <div>
              <h4 className="text-sm font-bold">{item.title}</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScannerView;
