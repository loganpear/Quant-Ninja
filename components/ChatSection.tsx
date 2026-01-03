
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, BrainCircuit, Loader2, Eraser } from 'lucide-react';
import { generateChatResponse } from '../services/gemini';
import { Message } from '../types';

const ChatSection: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useThinking, setUseThinking] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const result = await generateChatResponse(input, history, useThinking);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please check your connection or API key.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
              <BrainCircuit className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Intelligent Reasoning</h2>
              <p className="text-zinc-400 mt-2 text-sm">
                Ask anything. Gemini 3 Pro with Thinking enabled allows for deeper analysis and complex problem solving.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full mt-4">
               {['Explain quantum entanglement', 'Write a complex Rust function', 'Analyze this strategy game'].map(suggestion => (
                 <button 
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-4 py-2 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 transition-colors"
                 >
                   "{suggestion}"
                 </button>
               ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-zinc-500 px-2">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-zinc-400" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  useThinking 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-400'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                Thinking: {useThinking ? 'ON' : 'OFF'}
              </button>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] text-zinc-500 hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="relative group">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="w-full bg-zinc-900 border border-zinc-800 group-focus-within:border-blue-500/50 rounded-xl px-4 py-4 pr-12 focus:outline-none transition-all placeholder:text-zinc-600 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                input.trim() && !isLoading 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-zinc-500 italic">
            Gemini 3 Pro reasoning model active. Complex queries may take longer to process.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;
