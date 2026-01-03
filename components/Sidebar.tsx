
import React from 'react';
import { AppView } from '../types';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  ScanSearch, 
  Settings,
  Sparkles,
  Command
} from 'lucide-react';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: AppView.CHAT, icon: MessageSquare, label: 'Chat', color: 'text-blue-400' },
    { id: AppView.VISION, icon: ScanSearch, label: 'Vision', color: 'text-purple-400' },
    { id: AppView.CANVAS, icon: ImageIcon, label: 'Canvas', color: 'text-emerald-400' },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight">Studio</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              activeView === item.id 
                ? 'bg-zinc-800 text-white shadow-lg shadow-black/20' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeView === item.id ? item.color : 'text-zinc-500 group-hover:text-zinc-300'}`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={() => setActiveView(AppView.SETTINGS)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
            activeView === AppView.SETTINGS 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </button>
        
        <div className="mt-4 p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Command className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Model Status</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Gemini 3 Pro</span>
              <span className="text-emerald-500">Live</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Gemini 2.5 Image</span>
              <span className="text-emerald-500">Live</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
