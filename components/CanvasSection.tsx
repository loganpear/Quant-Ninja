
import React, { useState } from 'react';
import { ImageIcon, Sparkles, Download, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { generateImage } from '../services/gemini';
import { GeneratedImage } from '../types';

const CanvasSection: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      const newImg: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt,
        timestamp: new Date()
      };
      setImages(prev => [newImg, ...prev]);
      setActiveImage(newImg);
      setPrompt('');
    } catch (error) {
      console.error(error);
      alert("Image generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-black">
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4">
        {/* Left Side: Parameters */}
        <div className="lg:col-span-1 p-6 border-r border-zinc-800 bg-zinc-950 overflow-y-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Prompt
              </h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create... e.g., 'A cyberpunk street in Tokyo with neon signs, raining, cinematic lighting'"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 h-32 focus:outline-none focus:border-emerald-500/50 text-sm resize-none transition-all"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aspect Ratio</h3>
              <div className="grid grid-cols-3 gap-2">
                {(["1:1", "16:9", "9:16"] as const).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                      aspectRatio === ratio 
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                        : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`border-2 border-current rounded-sm ${
                      ratio === "1:1" ? "w-6 h-6" : ratio === "16:9" ? "w-8 h-4.5" : "w-4.5 h-8"
                    }`}></div>
                    <span className="text-[10px] font-bold">{ratio}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={!prompt.trim() || isGenerating}
              onClick={handleGenerate}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
                prompt.trim() && !isGenerating
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20' 
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Magic
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center: Preview */}
        <div className="lg:col-span-3 bg-black flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 relative">
            {activeImage ? (
              <div className="relative group max-h-full">
                <img 
                  src={activeImage.url} 
                  alt={activeImage.prompt} 
                  className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl shadow-emerald-500/10 object-contain" 
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-2xl">
                  <a 
                    href={activeImage.url} 
                    download={`gemini-gen-${activeImage.id}.png`}
                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-zinc-700 flex flex-col items-center space-y-4">
                <ImageIcon className="w-24 h-24 opacity-10" />
                <p className="text-lg font-medium tracking-tight">Your creation will appear here</p>
              </div>
            )}
          </div>

          {/* Bottom: History Strip */}
          <div className="h-40 border-t border-zinc-800 bg-zinc-950 p-4 overflow-x-auto">
            <div className="flex gap-4 h-full">
              {images.map(img => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img)}
                  className={`relative flex-shrink-0 h-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage?.id === img.id ? 'border-emerald-500' : 'border-transparent hover:border-zinc-700'
                  }`}
                >
                  <img src={img.url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2 opacity-0 hover:opacity-100">
                    <span className="text-[8px] text-white truncate">{img.prompt}</span>
                  </div>
                </button>
              ))}
              {images.length === 0 && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-xl text-zinc-600">
                  <span className="text-xs uppercase font-bold tracking-widest">No recent generations</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasSection;
