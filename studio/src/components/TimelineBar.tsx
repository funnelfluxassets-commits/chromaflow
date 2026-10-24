import React, { useRef } from 'react';
import { StoryboardScene } from '../types';
import { Film, Music, Download, Sparkles, Play, CheckCircle2, RefreshCw } from 'lucide-react';

interface TimelineBarProps {
  scenes: StoryboardScene[];
  onStitchMovie: () => void;
  isStitching: boolean;
  finalMovieUrl?: string;
  musicFile?: File;
  setMusicFile: (f?: File) => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  scenes,
  onStitchMovie,
  isStitching,
  finalMovieUrl,
  musicFile,
  setMusicFile,
}) => {
  const musicInputRef = useRef<HTMLInputElement>(null);

  const completedClips = scenes.filter((s) => s.videoUrl);
  const totalDuration = scenes.reduce((acc, s) => acc + s.durationSec, 0);

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMusicFile(file);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0E121D]/95 backdrop-blur-md border-t border-chroma-border z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Sequence summary & Audio picker */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span>Timeline Sequence</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {completedClips.length} of {scenes.length} Rendered
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Total Length: ~{totalDuration}s</p>
            </div>
          </div>

          {/* Music Upload */}
          <input
            ref={musicInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleMusicChange}
          />
          <button
            type="button"
            onClick={() => musicInputRef.current?.click()}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              musicFile
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{musicFile ? musicFile.name.slice(0, 16) + '...' : 'Add Audio / Music'}</span>
          </button>
        </div>

        {/* Center: Mini Clip Strip */}
        <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
          {scenes.map((s, idx) => (
            <div
              key={s.id}
              className={`h-8 px-2.5 rounded-lg border flex items-center gap-1.5 text-[10px] font-mono shrink-0 transition-all ${
                s.videoUrl
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : s.status === 'generating'
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 animate-pulse'
                  : 'bg-zinc-900 border-white/5 text-zinc-500'
              }`}
            >
              <span>#{s.sceneNumber}</span>
              {s.videoUrl && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </div>
          ))}
        </div>

        {/* Right: Stitch Button & Final Download */}
        <div className="flex items-center gap-2">
          {finalMovieUrl && (
            <a
              href={finalMovieUrl}
              download="chromaflow_final_movie.mp4"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Movie</span>
            </a>
          )}

          <button
            type="button"
            onClick={onStitchMovie}
            disabled={completedClips.length === 0 || isStitching}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-98 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/60 transition-all cursor-pointer disabled:opacity-40"
          >
            {isStitching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Stitching Clips...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Stitch Final Movie</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
