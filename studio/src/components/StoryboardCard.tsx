import React, { useRef, useState } from 'react';
import { StoryboardScene, AspectRatio, EngineType } from '../types';
import {
  Play,
  Sparkles,
  Wand2,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Film,
  AlertTriangle,
  Cpu,
  ExternalLink,
  Download,
  FolderOpen,
  Upload,
} from 'lucide-react';
import { uploadMediaToKie, DEFAULT_KIE_KEY, COLAB_NOTEBOOK_URL } from '../services/aiEngine';

interface StoryboardCardProps {
  scene: StoryboardScene;
  aspectRatio: AspectRatio;
  engine: EngineType;
  klingApiKey: string;
  colabUrl: string;
  setColabUrl: (url: string) => void;
  onUpdateScene: (updated: StoryboardScene) => void;
  onDeleteScene: (id: string) => void;
  onGenerateScene: (id: string) => void;
  onGenerateFrame: (id: string) => void;
  onUpscaleScene: (id: string) => void;
  onDemoRenderScene?: (id: string) => void;
}

export const StoryboardCard: React.FC<StoryboardCardProps> = ({
  scene,
  aspectRatio,
  engine,
  klingApiKey,
  colabUrl,
  setColabUrl,
  onUpdateScene,
  onDeleteScene,
  onGenerateScene,
  onGenerateFrame,
  onUpscaleScene,
  onDemoRenderScene,
}) => {
  const startFileRef = useRef<HTMLInputElement>(null);
  const endFileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inlineColabInput, setInlineColabInput] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'image'>('video');

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleStartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    onUpdateScene({ ...scene, startImageUrl: dataUrl });

    if (engine === 'kling' && (klingApiKey || DEFAULT_KIE_KEY)) {
      try {
        setIsUploading(true);
        const publicUrl = await uploadMediaToKie(file, klingApiKey || DEFAULT_KIE_KEY);
        onUpdateScene({ ...scene, startImageUrl: publicUrl });
      } catch (err) {
        console.warn('Local preview active (CDN upload note):', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleEndUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    onUpdateScene({ ...scene, endImageUrl: dataUrl });

    if (engine === 'kling' && (klingApiKey || DEFAULT_KIE_KEY)) {
      try {
        setIsUploading(true);
        const publicUrl = await uploadMediaToKie(file, klingApiKey || DEFAULT_KIE_KEY);
        onUpdateScene({ ...scene, endImageUrl: publicUrl });
      } catch (err) {
        console.warn('Local preview active (CDN upload note):', err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="bg-chroma-card border border-chroma-border rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3.5 hover:border-zinc-700 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-zinc-800 text-white font-mono font-bold text-xs flex items-center justify-center">
            {scene.sceneNumber}
          </span>
          <span className="text-xs font-bold text-zinc-300">{scene.title}</span>
          <select
            value={scene.durationSec}
            onChange={(e) => onUpdateScene({ ...scene, durationSec: Number(e.target.value) })}
            title="Select Scene Duration"
            className="bg-zinc-900 border border-white/10 hover:border-indigo-500/50 rounded-md px-1.5 py-0.5 text-[10px] text-indigo-300 font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value={5}>5s</option>
            <option value={8}>8s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {scene.isUpscaled && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
              4K Enhanced
            </span>
          )}

          <button
            type="button"
            onClick={() => onDeleteScene(scene.id)}
            title="Delete Scene"
            className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Media Canvas / Preview Area (Always consistent height & structure) */}
      <div className="relative w-full rounded-xl bg-zinc-950 overflow-hidden border border-white/5 flex flex-col items-center justify-center min-h-[210px] max-h-[250px]">
        {scene.status === 'generating' ? (
          <div className="p-5 w-full text-center space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono px-2">
              <span className="text-indigo-400 font-bold flex items-center gap-1.5 text-left truncate mr-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
                <span className="truncate">{scene.progressStage || 'Rendering Video...'}</span>
              </span>
              <span className="text-white font-black shrink-0">{scene.progress || 0}%</span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 shadow-lg shadow-indigo-500/50"
                style={{ width: `${Math.max(5, scene.progress || 0)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-2 pt-1 border-t border-white/5">
              <span>⏱️ {scene.elapsedSec || 0}s elapsed</span>
              <span className="text-emerald-400">🛡️ Watermark Shield Active</span>
            </div>
          </div>
        ) : scene.status === 'failed' ? (
          !colabUrl && engine === 'colab' ? (
            <div className="p-4 w-full text-center space-y-2.5 bg-purple-950/30 border border-purple-500/40 rounded-xl animate-fadeIn">
              <Cpu className="w-5 h-5 text-purple-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-white">Connect Free Google Colab GPU</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Pre-configured with Wan 2.1, SVD-XT Neural Video & 4K Upscaler (100% Free)
                </p>
              </div>

              <a
                href={COLAB_NOTEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-md shadow-purple-950/50 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>1. Open Google Colab (1-Click)</span>
              </a>

              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="2. Paste https://xxxx.gradio.live link"
                  value={inlineColabInput}
                  onChange={(e) => setInlineColabInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inlineColabInput.trim()) {
                      setColabUrl(inlineColabInput.trim());
                      setTimeout(() => onGenerateScene(scene.id), 100);
                    }
                  }}
                  disabled={!inlineColabInput.trim()}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Connect & Render Video
                </button>

                {onDemoRenderScene && (
                  <button
                    type="button"
                    onClick={() => onDemoRenderScene(scene.id)}
                    className="w-full py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Instant Demo Preview Render</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 w-full text-center space-y-2 bg-red-950/20 border border-red-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 mx-auto" />
              <p className="text-xs font-bold text-red-300">Generation Alert</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
                {scene.errorMessage === 'Failed to fetch'
                  ? 'Colab link changed or disconnected. Paste your new .gradio.live link below:'
                  : scene.errorMessage || 'AI generation encountered an issue.'}
              </p>
              {engine === 'colab' && (
                <div className="space-y-1.5 pt-1 max-w-xs mx-auto">
                  <input
                    type="text"
                    placeholder="Paste new https://xxxx.gradio.live link"
                    value={inlineColabInput}
                    onChange={(e) => setInlineColabInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                  />
                  {inlineColabInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setColabUrl(inlineColabInput.trim());
                        setTimeout(() => onGenerateScene(scene.id), 100);
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Save & Render
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onGenerateScene(scene.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Retry Render
                </button>
              </div>
            </div>
          )
        ) : scene.videoUrl && activeMediaTab === 'video' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[210px]">
            <video
              src={scene.videoUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain rounded-xl max-h-[230px]"
            />
            {/* Top Bar on Video: Status badge and Frame switch */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] text-emerald-400 font-mono flex items-center gap-1 shadow">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>{scene.isUpscaled ? 'True 4K UHD Ready' : 'AI Video Ready'}</span>
              </span>
              {scene.startImageUrl && (
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('image')}
                  className="pointer-events-auto px-2 py-0.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-[10px] text-zinc-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow"
                >
                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                  <span>View Frame</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full min-h-[210px] flex items-center justify-center p-3 bg-zinc-950">
            {scene.startImageUrl ? (
              <div className="relative group w-full h-[185px] rounded-xl overflow-hidden border border-indigo-500/30">
                <img
                  src={scene.startImageUrl}
                  alt="Start Frame"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                  <span className="text-[10px] font-bold text-indigo-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                    Starting Frame
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startFileRef.current?.click()}
                      title="Search your Mac and select a new photo"
                      className="px-2 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
                    >
                      <FolderOpen className="w-3 h-3 text-white" />
                      <span>Search Photo</span>
                    </button>
                    {scene.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveMediaTab('video')}
                        title="Return to Video"
                        className="px-2 py-0.5 rounded bg-zinc-800/90 hover:bg-zinc-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>Play Video</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onUpdateScene({ ...scene, startImageUrl: undefined })}
                      title="Clear Image"
                      className="p-1 rounded bg-black/70 hover:bg-red-500 text-white cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => startFileRef.current?.click()}
                className="text-center py-6 text-zinc-500 space-y-2 cursor-pointer group"
              >
                <Film className="w-8 h-8 mx-auto opacity-40 text-indigo-400 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-semibold text-zinc-300">Ready to Render</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startFileRef.current?.click();
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Search & Upload Image</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unified Start Frame & End Frame Bar (ALWAYS VISIBLE ON ALL CARDS) */}
      <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5">
        {/* Start Frame Slot */}
        <input
          ref={startFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onClick={(e) => {
            (e.currentTarget as HTMLInputElement).value = '';
          }}
          onChange={handleStartUpload}
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
              <span>Start Frame</span>
              {scene.startImageUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </span>
            {scene.startImageUrl && (
              <button
                type="button"
                onClick={() => onUpdateScene({ ...scene, startImageUrl: undefined })}
                title="Remove start image"
                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {scene.startImageUrl ? (
              <div
                onClick={() => startFileRef.current?.click()}
                title="Click to search and change image from your Mac"
                className="relative group w-9 h-9 rounded-lg overflow-hidden border border-indigo-500/40 shrink-0 bg-zinc-950 cursor-pointer"
              >
                <img src={scene.startImageUrl} alt="Start" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">
                  Change
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-1 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => startFileRef.current?.click()}
                title="Search your Mac to select an image file"
                className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors truncate shadow-sm"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{scene.startImageUrl ? 'Change' : 'Upload'}</span>
              </button>

              <button
                type="button"
                onClick={() => onGenerateFrame(scene.id)}
                title="Generate starting frame using AI text prompt"
                className="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* End Frame Slot (FLF2V Transition) */}
        <input
          ref={endFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onClick={(e) => {
            (e.currentTarget as HTMLInputElement).value = '';
          }}
          onChange={handleEndUpload}
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
              <span>End Frame</span>
              {scene.endImageUrl && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
            </span>
            {scene.endImageUrl && (
              <button
                type="button"
                onClick={() => onUpdateScene({ ...scene, endImageUrl: undefined })}
                title="Remove end image"
                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {scene.endImageUrl ? (
            <div
              onClick={() => endFileRef.current?.click()}
              title="Click to search and change end frame from your Mac"
              className="relative group w-full h-9 rounded-lg overflow-hidden border border-purple-500/40 bg-zinc-950 cursor-pointer"
            >
              <img src={scene.endImageUrl} alt="End" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[9px] font-bold">
                Change End
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => endFileRef.current?.click()}
              title="Search your Mac for an ending transition frame (FLF2V)"
              className="w-full h-9 rounded-lg border border-dashed border-zinc-800 hover:border-purple-500/50 bg-zinc-900/30 text-[10px] text-zinc-300 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Upload End</span>
            </button>
          )}
        </div>
      </div>

      {/* Prompt Inputs */}
      <div className="space-y-2 text-xs">
        <div>
          <label className="text-[10px] text-zinc-400 font-bold block mb-1">Visual Prompt</label>
          <textarea
            value={scene.visualPrompt}
            onChange={(e) => onUpdateScene({ ...scene, visualPrompt: e.target.value })}
            rows={2}
            className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 leading-normal"
          />
        </div>

        <div>
          <label className="text-[10px] text-zinc-400 font-bold block mb-1">Camera & Motion Direction</label>
          <input
            type="text"
            value={scene.motionPrompt}
            onChange={(e) => onUpdateScene({ ...scene, motionPrompt: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Clip Duration Selector (5s, 8s, 10s, 15s) */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-zinc-400 font-bold">Clip Length</span>
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-white/10">
            {[5, 8, 10, 15].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onUpdateScene({ ...scene, durationSec: sec })}
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  scene.durationSec === sec
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={() => onGenerateScene(scene.id)}
          disabled={scene.status === 'generating'}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            scene.status === 'generating'
              ? 'bg-zinc-800 text-indigo-400 border border-indigo-500/30 cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
          }`}
        >
          {scene.status === 'generating' ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Generating ({scene.progress || 0}%)...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>
                {scene.videoUrl
                  ? 'Re-Render Scene'
                  : engine === 'colab'
                  ? 'Render (Colab GPU Free)'
                  : engine === 'kling'
                  ? 'Render (Kling 2.6)'
                  : 'Render (Pollinations)'}
              </span>
            </>
          )}
        </button>

        {scene.videoUrl && (
          <>
            <button
              type="button"
              onClick={() => onUpscaleScene(scene.id)}
              disabled={scene.status === 'generating'}
              title="Upscale clip to True 4K UHD (2160p/3840p)"
              className="px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-emerald-400 border border-emerald-500/20 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>4K</span>
            </button>
            <a
              href={scene.videoUrl}
              download={`scene_${scene.sceneNumber}_${scene.isUpscaled ? '4K_UHD' : '1080p'}.mp4`}
              target="_blank"
              rel="noreferrer"
              title={scene.isUpscaled ? 'Download True 4K UHD Video' : 'Download Scene Video'}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center transition-colors shadow-md shadow-emerald-950/50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </>
        )}
      </div>
    </div>
  );
};
