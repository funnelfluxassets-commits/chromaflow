import React, { useRef } from 'react';
import { CharacterGuide, StyleGuide } from '../types';
import { User, Palette, Image as ImageIcon, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReferenceGuidesProps {
  characterGuide: CharacterGuide;
  setCharacterGuide: React.Dispatch<React.SetStateAction<CharacterGuide>>;
  styleGuide: StyleGuide;
  setStyleGuide: React.Dispatch<React.SetStateAction<StyleGuide>>;
}

export const ReferenceGuides: React.FC<ReferenceGuidesProps> = ({
  characterGuide,
  setCharacterGuide,
  styleGuide,
  setStyleGuide,
}) => {
  const charFileRef = useRef<HTMLInputElement>(null);
  const moodFileRef = useRef<HTMLInputElement>(null);

  const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCharacterGuide((prev) => ({ ...prev, imageUrl: url, enabled: true }));
    }
  };

  const handleMoodImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setStyleGuide((prev) => ({ ...prev, moodBoardUrl: url, enabled: true }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* ── Character Reference Guide ── */}
      <div className={`p-4 rounded-2xl border transition-all ${
        characterGuide.enabled ? 'bg-indigo-950/20 border-indigo-500/40' : 'bg-chroma-card border-chroma-border'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Character Reference Guide</span>
                {characterGuide.enabled && (
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.2 rounded font-black">
                    LOCKED
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">Keeps actor or product identical in all scenes</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={characterGuide.enabled}
              onChange={(e) => setCharacterGuide((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Character Name (e.g. Maya)"
              value={characterGuide.name}
              onChange={(e) => setCharacterGuide((prev) => ({ ...prev, name: e.target.value }))}
              className="w-1/3 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Visual traits (e.g. 28yo woman, curly brown hair, green utility jacket)"
              value={characterGuide.description}
              onChange={(e) => setCharacterGuide((prev) => ({ ...prev, description: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Reference Image Drop */}
          <div className="flex items-center gap-3">
            <input
              ref={charFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCharImageUpload}
            />
            {characterGuide.imageUrl ? (
              <div className="relative group w-12 h-12 rounded-xl overflow-hidden border border-indigo-500/50">
                <img src={characterGuide.imageUrl} alt="Character" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCharacterGuide((prev) => ({ ...prev, imageUrl: undefined }))}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => charFileRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Upload Face / Reference Photo</span>
              </button>
            )}

            {characterGuide.enabled && (
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active on all generations</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scene Style Reference Guide ── */}
      <div className={`p-4 rounded-2xl border transition-all ${
        styleGuide.enabled ? 'bg-purple-950/20 border-purple-500/40' : 'bg-chroma-card border-chroma-border'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Scene Style Reference Guide</span>
                {styleGuide.enabled && (
                  <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded font-black">
                    ACTIVE
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400">Forces unified cinematic lighting & texture</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={styleGuide.enabled}
              onChange={(e) => setStyleGuide((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex gap-2">
            <select
              value={styleGuide.preset}
              onChange={(e) => setStyleGuide((prev) => ({ ...prev, preset: e.target.value }))}
              className="w-1/2 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="cinematic_35mm">🎞️ Cinematic 35mm (Kodak)</option>
              <option value="hyperrealistic_commercial">💎 Luxury Commercial 8K</option>
              <option value="vibrant_food_studio">🍔 Food Commercial Studio</option>
              <option value="moody_film_noir">🕵️ Moody Film Noir</option>
              <option value="anime_ghibli">🎨 Studio Ghibli Anime</option>
              <option value="cyberpunk_neon">🌆 Cyberpunk Neon</option>
            </select>

            <input
              type="text"
              placeholder="Or custom camera/style prompt (e.g. anamorphic, golden hour)"
              value={styleGuide.customPrompt}
              onChange={(e) => setStyleGuide((prev) => ({ ...prev, customPrompt: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Mood Board Reference */}
          <div className="flex items-center gap-3">
            <input
              ref={moodFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMoodImageUpload}
            />
            {styleGuide.moodBoardUrl ? (
              <div className="relative group w-12 h-12 rounded-xl overflow-hidden border border-purple-500/50">
                <img src={styleGuide.moodBoardUrl} alt="Mood Board" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setStyleGuide((prev) => ({ ...prev, moodBoardUrl: undefined }))}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => moodFileRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Upload Style Mood Board</span>
              </button>
            )}

            {styleGuide.enabled && (
              <div className="flex items-center gap-1.5 text-[11px] text-purple-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Color grading synced</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
