
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SCANNER = 'SCANNER',
  LEDGER = 'LEDGER',
  SETTINGS = 'SETTINGS',
  LIVE_AGENT = 'LIVE_AGENT',
  CHAT = 'CHAT',
  VISION = 'VISION',
  CANVAS = 'CANVAS',
  MARKET_PULSE = 'MARKET_PULSE'
}

export type BetStatus = 'PENDING' | 'WON' | 'LOST' | 'VOID';

export interface Bet {
  id: string;
  timestamp: number;
  event: string;
  market: string;
  odds: number; 
  ev: number; 
  bookie: string;
  stake: number;
  status: BetStatus;
  resultDetails?: string;
  closingLineValue?: number;
  groundingSources?: { title?: string, uri?: string }[];
}

export interface SimulationStats {
  initialBankroll: number;
  currentBankroll: number;
  totalBets: number;
  winRate: number;
  roi: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}
