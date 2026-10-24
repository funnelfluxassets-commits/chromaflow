import React from 'react';
import { EngineType, AspectRatio } from '../types';
import { Sparkles, Cpu, Sliders, Smartphone, Monitor, Square, FileText, ExternalLink } from 'lucide-react';
import { COLAB_NOTEBOOK_URL } from '../services/aiEngine';

interface NavbarProps {
  engine: EngineType;
  setEngine: (e: EngineType) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  colabUrl: string;
  onOpenSettings: () => void;
  onOpenScriptModal: () => void;
  scenesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  engine,
  setEngine,
  aspectRatio,
  setAspectRatio,
  colabUrl,
  onOpenSettings,
  onOpenScriptModal,
  scenesCount,
}) => {
  return (
    <header className="h-16 border-b border-chroma-border bg-[#0E121D]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-white">ChromaFlow</h1>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Colab GPU Active
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 hidden sm:block">AI Script-to-Video Production Suite</p>
        </div>
      </div>

      {/* Middle: Engine Switcher & Aspect Ratio */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Engine Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-chroma-card border border-chroma-border">
          <button
            type="button"
            onClick={() => setEngine('colab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              engine === 'colab'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-200" />
            <span>Colab GPU (Free)</span>
            {colabUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setEngine('pollinations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              engine === 'pollinations'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Pollinations</span>
          </button>

          <button
            type="button"
            onClick={() => setEngine('kling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              engine === 'kling'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Kling 2.6</span>
          </button>
        </div>

        {/* 1-Click Colab Button if not connected */}
        {engine === 'colab' && !colabUrl && (
          <a
            href={COLAB_NOTEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 text-xs font-bold transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Colab</span>
          </a>
        )}

        {/* Aspect Ratio Selector */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-chroma-card border border-chroma-border">
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            title="Vertical (TikTok, Reels, Shorts)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              aspectRatio === '9:16' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('16:9')}
            title="Landscape (YouTube, Video)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              aspectRatio === '16:9' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio('1:1')}
            title="Square (Instagram Feed)"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              aspectRatio === '1:1' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenScriptModal}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-950/50 cursor-pointer transition-all"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">Input Script</span>
          {scenesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
              {scenesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Engine & Cloud Settings"
          className="p-2 rounded-xl bg-chroma-card border border-chroma-border text-zinc-400 hover:text-white transition-colors cursor-pointer relative"
        >
          <Sliders className="w-4 h-4" />
          {engine === 'colab' && !colabUrl && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
      </div>
    </header>
  );
};
