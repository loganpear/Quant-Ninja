
import React, { useState } from 'react';
import { Bet } from '../types';
import { settleBetsWithSearch } from '../services/gemini';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  History as HistoryIcon,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface LedgerViewProps {
  bets: Bet[];
  onUpdateBets: (updated: Bet[]) => void;
}

const LedgerView: React.FC<LedgerViewProps> = ({ bets, onUpdateBets }) => {
  const [isSettling, setIsSettling] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');

  const handleSettle = async () => {
    if (isSettling) return;
    
    const pendingCount = bets.filter(b => b.status === 'PENDING').length;
    if (pendingCount === 0) return;

    setIsSettling(true);
    try {
      const updated = await settleBetsWithSearch(bets);
      onUpdateBets(updated);
    } catch (error) {
      console.error("Settlement process failed:", error);
    } finally {
      setIsSettling(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this record? This will also revert its impact on your bankroll.")) {
      const updated = bets.filter(b => b.id !== id);
      onUpdateBets(updated);
    }
  };

  const filteredBets = bets.filter(b => filter === 'ALL' || b.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Bet Ledger</h2>
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            {['ALL', 'PENDING', 'WON', 'LOST'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                  filter === f ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleSettle}
          disabled={isSettling || bets.filter(b => b.status === 'PENDING').length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
        >
          {isSettling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying Results...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Auto-Settle Pending
            </>
          )}
        </button>
      </div>

      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Event & Market</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stake</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Odds</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">EV%</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Net</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredBets.map((bet) => (
              <tr key={bet.id} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{bet.event}</span>
                    <span className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-400">{bet.bookie}</span>
                      {bet.market}
                    </span>
                    {bet.resultDetails && (
                      <span className="text-[10px] text-emerald-500/80 italic mt-1 font-medium">{bet.resultDetails}</span>
                    )}
                    {/* Render Citations as required by Google Search Grounding guidelines */}
                    {bet.groundingSources && bet.groundingSources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {bet.groundingSources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-emerald-400 bg-zinc-800/50 px-1.5 py-0.5 rounded transition-all"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {source.title || 'Source'}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-sm">${bet.stake.toFixed(2)}</td>
                <td className="px-6 py-4 font-mono text-sm text-zinc-400">{bet.odds.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
                    +{bet.ev}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${
                    bet.status === 'WON' ? 'text-emerald-400' : 
                    bet.status === 'LOST' ? 'text-rose-400' : 'text-zinc-500'
                  }`}>
                    {bet.status === 'WON' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {bet.status === 'LOST' && <XCircle className="w-3.5 h-3.5" />}
                    {bet.status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                    {bet.status}
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-sm">
                  {bet.status === 'WON' && (
                    <span className="text-emerald-400">+${((bet.stake * bet.odds) - bet.stake).toFixed(2)}</span>
                  )}
                  {bet.status === 'LOST' && (
                    <span className="text-rose-400">-${bet.stake.toFixed(2)}</span>
                  )}
                  {bet.status === 'PENDING' && (
                    <span className="text-zinc-600">$0.00</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => handleDelete(bet.id)}
                    className="p-2 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredBets.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-3">
                    <HistoryIcon className="w-10 h-10 opacity-10" />
                    <p className="text-sm">No bets match your criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerView;
