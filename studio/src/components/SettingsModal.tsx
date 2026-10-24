import React from 'react';
import { X, Cpu, Key, ShieldCheck, CheckCircle2, ExternalLink, Sparkles, DollarSign, Zap } from 'lucide-react';
import { DEFAULT_KIE_KEY, COLAB_NOTEBOOK_URL } from '../services/aiEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colabUrl: string;
  setColabUrl: (url: string) => void;
  klingApiKey: string;
  setKlingApiKey: (k: string) => void;
  seedanceApiKey: string;
  setSeedanceApiKey: (k: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  colabUrl,
  setColabUrl,
  klingApiKey,
  setKlingApiKey,
  seedanceApiKey,
  setSeedanceApiKey,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#121624] border border-chroma-border rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Engine & Cloud Settings</h2>
              <p className="text-xs text-zinc-400">Configure free Colab GPU backend or optional commercial APIs</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Google Colab Tunnel URL (Primary 100% Free Engine) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/40 to-indigo-950/20 border border-purple-500/40 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">Google Colab Private GPU (Default & 100% Free)</span>
            </div>
            {colabUrl ? (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Setup Needed
              </span>
            )}
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Run on Google's free T4 / A100 GPU cluster. Pre-configured with <strong>Wan 2.1</strong>, <strong>LTX-Video</strong>, <strong>First & Last Frame (FLF2V)</strong>, and an <strong>AI 4K Video Upscaler</strong>.
          </p>

          {/* 1-Click Launch Button */}
          <a
            href={COLAB_NOTEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Turnkey Notebook in Google Colab (1-Click)</span>
          </a>

          {/* 3 Step Guide */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">1</span>
              <span>Click button above to open notebook in Google Colab.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">2</span>
              <span>Click <strong>Runtime</strong> &gt; <strong>Run all</strong>.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-300 font-mono text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Copy the generated <code>https://xxxx.gradio.live</code> link and paste below:</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-300 font-semibold block mb-1">
              Gradio Live Tunnel URL:
            </label>
            <input
              type="text"
              placeholder="e.g. https://c4819d9b23fa.gradio.live"
              value={colabUrl}
              onChange={(e) => setColabUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-purple-500/40 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {/* 2. Optional Commercial APIs (Kling 2.6 & Seedance) */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Optional Commercial APIs (Kling 2.6 & Seedance)</span>
            </h3>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Optional</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Kie.ai (Kling 2.6) API Key</label>
              <input
                type="password"
                placeholder="Optional - stored privately in your browser only"
                value={klingApiKey}
                onChange={(e) => setKlingApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Seedance (ByteDance) API Key</label>
              <input
                type="password"
                placeholder="Optional - leave blank to use free Colab GPU"
                value={seedanceApiKey}
                onChange={(e) => setSeedanceApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Watermark Shield */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>
            <strong>Watermark Shield Active:</strong> ChromaFlow automatically injects anti-watermark safeguards (<code>watermark, text, branding, logo, signature</code>) into all Wan 2.1, LTX-Video, and Kling prompts.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
