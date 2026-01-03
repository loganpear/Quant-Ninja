
import React from 'react';
import { SimulationStats, Bet } from '../types';
import { 
  TrendingUp, 
  Activity, 
  Target, 
  Globe,
  BarChart3,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface DashboardViewProps {
  stats: SimulationStats;
  bets: Bet[];
  onSync: () => void;
  isSyncing: boolean;
  inPlay: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ stats, bets, onSync, isSyncing, inPlay }) => {
  const pendingCount = bets.filter(b => b.status === 'PENDING').length;
  const netProfit = (stats.currentBankroll + inPlay) - stats.initialBankroll;

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Available Cash', value: `$${stats.currentBankroll.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, icon: Activity, color: 'text-emerald-400', sub: 'Ready for placement' },
          { label: 'In Play', value: `$${inPlay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: ShieldAlert, color: 'text-rose-400', sub: `${pendingCount} active positions` },
          { label: 'Total ROI', value: `${stats.roi.toFixed(2)}%`, icon: TrendingUp, color: netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', sub: 'Net Equity growth' },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, icon: Target, color: 'text-blue-400', sub: 'Settled accuracy' }
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl shadow-sm hover:border-zinc-700 transition-all group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl bg-zinc-950 border border-zinc-800 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-zinc-400 text-xs font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2 tracking-tight">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Account Performance
            </h3>
            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded tracking-widest uppercase">Live P/L Log</div>
          </div>
          
          <div className="h-64 flex items-end gap-1 px-2">
            {bets.slice(0, 40).reverse().map((bet, i) => {
              const h = bet.status === 'WON' ? Math.min(100, (bet.odds - 1) * 35) : bet.status === 'LOST' ? 50 : 15;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-lg transition-all hover:opacity-80 relative group ${
                    bet.status === 'WON' ? 'bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                    bet.status === 'LOST' ? 'bg-rose-500/50' : 'bg-zinc-800'
                  }`}
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#09090b] border border-zinc-800 rounded-xl text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 z-50 shadow-2xl">
                    <div className="font-bold text-zinc-100">{bet.event}</div>
                    <div className="text-zinc-500 mt-0.5">{bet.market} • {bet.status}</div>
                    <div className="text-emerald-400 mt-1 font-mono">${bet.stake.toFixed(2)} @ {bet.odds}</div>
                  </div>
                </div>
              );
            })}
            {bets.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-zinc-800 border-dashed rounded-2xl opacity-40">
                <p className="text-zinc-500 text-sm font-medium">Capture data via Ninja Vision to see metrics.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2 text-zinc-200">
              <Globe className="w-4 h-4 text-purple-400" />
              Exposure Breakdown
            </h3>
          </div>
          <div className="space-y-5">
            {['FanDuel', 'DraftKings', 'BetMGM', 'Caesars'].map(book => {
              const bookBets = bets.filter(b => b.bookie.toLowerCase().includes(book.toLowerCase()));
              const percent = (bookBets.length / (bets.length || 1)) * 100;
              return (
                <div key={book} className="space-y-2 group cursor-default">
                  <div className="flex justify-between text-xs font-bold transition-colors group-hover:text-zinc-100">
                    <span className="text-zinc-400">{book}</span>
                    <span className="text-zinc-600 group-hover:text-zinc-400">{bookBets.length} trades</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/50">
                    <div 
                      className="h-full bg-emerald-500/30 rounded-full transition-all duration-1000 group-hover:bg-emerald-500/50" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 pt-6 border-t border-zinc-800">
             <button className="w-full py-4 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-2 transition-all">
               Deep Risk Analytics
               <ChevronRight className="w-3 h-3" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
