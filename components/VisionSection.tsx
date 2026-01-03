
import React, { useState, useRef } from 'react';
import { Upload, Camera, ScanSearch, Loader2, Image as ImageIcon, X, ArrowRight } from 'lucide-react';
import { analyzeImage } from '../services/gemini';

const VisionSection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prompt, setPrompt] = useState('Describe this image in detail and identify key objects.');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(selectedImage, prompt);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Input Side */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 bg-zinc-900/30 relative overflow-hidden group">
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Select an Image</h3>
                  <p className="text-sm text-zinc-500 max-w-[240px] mt-1">Upload a photo for Gemini 3 Flash to analyze in real-time.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Query Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Object Identification",
                "Text OCR Extraction",
                "Spatial Awareness",
                "Color Palette Analysis"
              ].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setPrompt(`Perform: ${opt}. Additionally, describe everything you see.`)}
                  className={`px-3 py-2 border rounded-lg text-xs text-left transition-all ${
                    prompt.includes(opt) ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output Side */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <ScanSearch className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Insights</span>
              </div>
              {isAnalyzing && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
              {analysis ? (
                <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {analysis}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                  <ScanSearch className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Ready for analysis...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What would you like to know about this image?"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 text-sm"
            />
            <button 
              disabled={!selectedImage || isAnalyzing}
              onClick={handleAnalyze}
              className={`p-3 rounded-xl transition-all ${
                selectedImage && !isAnalyzing 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionSection;
