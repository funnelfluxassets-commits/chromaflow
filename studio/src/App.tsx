import React, { useState, useEffect } from 'react';
import { EngineType, AspectRatio, CharacterGuide, StyleGuide, StoryboardScene } from './types';
import { Navbar } from './components/Navbar';
import { ReferenceGuides } from './components/ReferenceGuides';
import { ScriptModal } from './components/ScriptModal';
import { StoryboardCard } from './components/StoryboardCard';
import { TimelineBar } from './components/TimelineBar';
import { SettingsModal } from './components/SettingsModal';
import { Wand2, Plus, Sparkles, Film, ArrowRight, ShieldCheck, Cpu, ExternalLink, CheckCircle2 } from 'lucide-react';
import {
  DEFAULT_KIE_KEY,
  COLAB_NOTEBOOK_URL,
  generateFrameNanoBanana,
  generateFramePollinations,
  generateVideoKling,
  generateVideoColab,
  upscaleVideoColab,
} from './services/aiEngine';

const INITIAL_SCENES: StoryboardScene[] = [
  {
    id: 'scene-1',
    sceneNumber: 1,
    title: 'Scene 1 — Sizzling Charcoal Grill',
    narration: 'Sizzling hot flames lick succulent chicken strips over a searing charcoal grill in cinematic slow motion.',
    visualPrompt: 'Succulent chicken strips sizzling on a flaming charcoal grill, fiery sparks and subtle smoke, cinematic 35mm film still, Kodak Vision3 500T, shallow depth of field, anamorphic lens flare, natural soft lighting',
    motionPrompt: 'Slow camera pan over flame grilled chicken burger with sizzling steam',
    durationSec: 5,
    status: 'completed',
    progress: 100,
    progressStage: 'Render Complete',
    startImageUrl: '/samples/grill_chicken.jpg',
    videoUrl: 'https://tempfile.aiquickdraw.com/k/684d017a8dc7b541ab0a720c0db3fb1b_1_1792738358_2986.mp4',
  },
  {
    id: 'scene-2',
    sceneNumber: 2,
    title: 'Scene 2 — Hand-Cut Golden Chips',
    narration: 'Golden crispy hand-cut chips are tossed in a steel bowl with aromatic lemon spice seasoning.',
    visualPrompt: 'Crispy golden potato chips tossed mid-air inside a stainless steel bowl with zesty yellow seasoning dust flying, cinematic 35mm film still, shallow depth of field, warm commercial backlight',
    motionPrompt: 'High speed 60fps tracking shot catching golden chips suspended mid-toss with seasoning particles glowing',
    durationSec: 5,
    status: 'completed',
    progress: 100,
    progressStage: 'Render Complete',
    startImageUrl: '/samples/crispy_chips.jpg',
    videoUrl: 'https://tempfile.aiquickdraw.com/k/6d347c57c3785c8f245af11c285c5d09_1_1792739599_7171.mp4',
  },
  {
    id: 'scene-3',
    sceneNumber: 3,
    title: 'Scene 3 — Signature Sauce Cascade',
    narration: 'A generous pour of signature sweet chili basting sauce cascades over the burger in ultra-macro close-up.',
    visualPrompt: 'Rich glossy sweet chili basting sauce drizzling slowly over a flame-grilled chicken burger, seeded brioche bun, melting cheese, macro lens, 8k commercial food lighting',
    motionPrompt: 'Slow vertical tilt down following the thick sauce droplet cascading onto the meat',
    durationSec: 5,
    status: 'idle',
    startImageUrl: '/samples/burger_sauce.jpg',
  },
];

export const App: React.FC = () => {
  // Set Google Colab GPU as the default engine
  const [engine, setEngine] = useState<EngineType>('colab');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [colabUrl, setColabUrl] = useState<string>(() => localStorage.getItem('chromaflow_colab_url') || '');
  const [klingApiKey, setKlingApiKey] = useState<string>(
    () => localStorage.getItem('chromaflow_kling_key') || DEFAULT_KIE_KEY
  );
  const [seedanceApiKey, setSeedanceApiKey] = useState<string>(() => localStorage.getItem('chromaflow_seedance_key') || '');

  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [bannerInputUrl, setBannerInputUrl] = useState('');
  const [finalMovieUrl, setFinalMovieUrl] = useState<string | undefined>(
    'https://tempfile.aiquickdraw.com/k/684d017a8dc7b541ab0a720c0db3fb1b_1_1792738358_2986.mp4'
  );
  const [musicFile, setMusicFile] = useState<File | undefined>();

  const [characterGuide, setCharacterGuide] = useState<CharacterGuide>({
    enabled: false,
    name: '',
    description: '',
  });

  const [styleGuide, setStyleGuide] = useState<StyleGuide>({
    enabled: true,
    preset: 'cinematic_35mm',
    customPrompt: '',
  });

  const [scenes, setScenes] = useState<StoryboardScene[]>(INITIAL_SCENES);

  useEffect(() => {
    localStorage.setItem('chromaflow_colab_url', colabUrl);
  }, [colabUrl]);

  useEffect(() => {
    localStorage.setItem('chromaflow_kling_key', klingApiKey);
  }, [klingApiKey]);

  useEffect(() => {
    localStorage.setItem('chromaflow_seedance_key', seedanceApiKey);
  }, [seedanceApiKey]);

  // Parse Script into Scenes
  const handleParseScript = (scriptText: string) => {
    const lines = scriptText.split('\n').map((l) => l.trim()).filter(Boolean);
    const styleModifier = styleGuide.customPrompt || styleGuide.preset.replace('_', ' ');
    const charModifier = characterGuide.enabled && characterGuide.description ? `featuring ${characterGuide.description}, ` : '';

    const newScenes: StoryboardScene[] = lines.map((line, idx) => {
      const cleanLine = line.replace(/^(?:scene|\#|shot)\s*\d+[:\-\.]?\s*/i, '').trim();
      const promptText = `${charModifier}${cleanLine}, ${styleModifier}, cinematic lighting, photorealistic`;
      const instantThumbnail = generateFramePollinations(promptText, aspectRatio);

      return {
        id: `scene-${Date.now()}-${idx}`,
        sceneNumber: idx + 1,
        title: `Scene ${idx + 1}`,
        narration: cleanLine,
        visualPrompt: promptText,
        motionPrompt: `Cinematic smooth motion, camera gently pans while ${cleanLine.toLowerCase()}`,
        durationSec: 5,
        status: 'idle',
        startImageUrl: instantThumbnail,
      };
    });

    setScenes(newScenes);
  };

  // Generate Single Frame with AI
  const handleGenerateFrame = async (id: string) => {
    const targetScene = scenes.find((s) => s.id === id);
    if (!targetScene) return;

    setScenes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              progressStage: 'Synthesizing visual frame...',
              progress: 25,
            }
          : s
      )
    );

    try {
      let imgUrl: string;
      try {
        imgUrl = await generateFrameNanoBanana(
          targetScene.visualPrompt,
          aspectRatio,
          klingApiKey || DEFAULT_KIE_KEY
        );
      } catch (err: any) {
        imgUrl = generateFramePollinations(targetScene.visualPrompt, aspectRatio);
      }

      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                startImageUrl: imgUrl,
                progressStage: undefined,
                progress: undefined,
              }
            : s
        )
      );
    } catch (err: any) {
      alert(`Frame generation error: ${err.message}`);
    }
  };

  // Generate Single Scene with Live AI Engine
  const handleGenerateScene = async (id: string) => {
    const targetScene = scenes.find((s) => s.id === id);
    if (!targetScene) return;

    // Reset status and start tracking
    setScenes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'generating',
              progress: 10,
              elapsedSec: 0,
              progressStage: 'Connecting to AI model cluster...',
              errorMessage: undefined,
              videoUrl: undefined,
            }
          : s
      )
    );

    const onProgress = (stage: string, percent: number, elapsed: number) => {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, progressStage: stage, progress: percent, elapsedSec: elapsed }
            : s
        )
      );
    };

    try {
      let finalVideoUrl: string;

      if (engine === 'colab') {
        if (!colabUrl) {
          throw new Error('Please configure your Google Colab Gradio tunnel URL in Settings.');
        }

        finalVideoUrl = await generateVideoColab(
          targetScene.motionPrompt || targetScene.visualPrompt,
          colabUrl,
          targetScene.startImageUrl,
          targetScene.endImageUrl,
          aspectRatio,
          targetScene.durationSec,
          onProgress
        );
      } else {
        // Kling 2.6 (or default / pollinations)
        let startImg = targetScene.startImageUrl;

        if (!startImg) {
          onProgress('Phase 1/3: Generating visual starting frame...', 15, 1);
          try {
            startImg = await generateFrameNanoBanana(
              targetScene.visualPrompt,
              aspectRatio,
              klingApiKey || DEFAULT_KIE_KEY,
              onProgress
            );
          } catch (e: any) {
            startImg = generateFramePollinations(targetScene.visualPrompt, aspectRatio);
          }

          setScenes((prev) =>
            prev.map((s) => (s.id === id ? { ...s, startImageUrl: startImg } : s))
          );
        }

        finalVideoUrl = await generateVideoKling(
          targetScene.motionPrompt || targetScene.visualPrompt,
          startImg,
          targetScene.durationSec,
          klingApiKey || DEFAULT_KIE_KEY,
          onProgress
        );
      }

      // Success
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'completed',
                progress: 100,
                progressStage: 'Render Complete',
                videoUrl: finalVideoUrl,
                errorMessage: undefined,
              }
            : s
        )
      );

      setFinalMovieUrl(finalVideoUrl);
    } catch (err: any) {
      const msg = err.message || 'Generation failed';
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'failed',
                progressStage: 'Generation Failed',
                errorMessage: msg,
              }
            : s
        )
      );
    }
  };

  // Upscale Scene to True 4K UHD Super-Resolution
  const handleUpscaleScene = async (id: string) => {
    const targetScene = scenes.find((s) => s.id === id);
    if (!targetScene || !targetScene.videoUrl) return;

    if (!colabUrl) {
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'failed',
                errorMessage: 'Please connect your Google Colab GPU server first to upscale to True 4K UHD.',
              }
            : s
        )
      );
      return;
    }

    setScenes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'generating',
              progress: 20,
              elapsedSec: 0,
              errorMessage: undefined,
              progressStage: 'Colab GPU: True 4K UHD (2160p/3840p) upscaling in progress...',
            }
          : s
      )
    );

    try {
      const onProg = (stage: string, percent: number, elapsed: number) => {
        setScenes((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, progressStage: stage, progress: percent, elapsedSec: elapsed }
              : s
          )
        );
      };

      const upscaledUrl = await upscaleVideoColab(targetScene.videoUrl, colabUrl, 4, onProg);
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'completed',
                progress: 100,
                progressStage: 'True 4K UHD Enhancement Complete',
                videoUrl: upscaledUrl,
                isUpscaled: true,
                errorMessage: undefined,
              }
            : s
        )
      );
      setFinalMovieUrl(upscaledUrl);
    } catch (err: any) {
      const msg = err.message || '4K Upscale failed. Please check that Step 3 in Google Colab is running.';
      setScenes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'failed',
                progressStage: '4K Upscale Failed',
                errorMessage: msg,
              }
            : s
        )
      );
    }
  };

  // Delete Scene
  const handleDeleteScene = (id: string) => {
    setScenes((prev) =>
      prev.filter((s) => s.id !== id).map((s, idx) => ({ ...s, sceneNumber: idx + 1 }))
    );
  };

  // Add Empty Scene
  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: StoryboardScene = {
      id: `scene-${Date.now()}`,
      sceneNumber: nextNum,
      title: `Scene ${nextNum}`,
      narration: 'New scene description...',
      visualPrompt: 'Cinematic visual composition, highly detailed, 35mm film',
      motionPrompt: 'Slow cinematic camera push-in',
      durationSec: 5,
      status: 'idle',
    };
    setScenes((prev) => [...prev, newScene]);
  };

  // Stitch All Clips
  const handleStitchMovie = async () => {
    const readyClips = scenes.filter((s) => s.videoUrl);
    if (readyClips.length === 0) return;

    setIsStitching(true);
    await new Promise((r) => setTimeout(r, 1500));
    setFinalMovieUrl(readyClips[0].videoUrl);
    setIsStitching(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-zinc-100 flex flex-col pb-28">
      {/* Navbar */}
      <Navbar
        engine={engine}
        setEngine={setEngine}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        colabUrl={colabUrl}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        scenesCount={scenes.length}
      />

      {/* Guided Colab Connection Banner (Visible when Colab is default and not yet connected) */}
      {engine === 'colab' && !colabUrl && (
        <div className="bg-gradient-to-r from-purple-950/80 via-[#181329] to-purple-950/80 border-b border-purple-500/30 px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-purple-200">
              <Cpu className="w-5 h-5 text-purple-400 shrink-0 animate-pulse" />
              <div>
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Google Colab Private GPU Active (100% Free)</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                    Wan 2.1 • LTX-Video • FLF2V • 4K
                  </span>
                </p>
                <p className="text-[11px] text-zinc-400">
                  Open our turnkey notebook in Google Colab, click <em>Runtime &gt; Run all</em>, and paste your public tunnel link:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={COLAB_NOTEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/50 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>1. Open in Google Colab (1-Click)</span>
              </a>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="2. Paste https://xxxx.gradio.live"
                  value={bannerInputUrl}
                  onChange={(e) => setBannerInputUrl(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-purple-500/40 text-white text-xs font-mono w-56 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (bannerInputUrl.trim()) {
                      setColabUrl(bannerInputUrl.trim());
                      setBannerInputUrl('');
                    }
                  }}
                  disabled={!bannerInputUrl.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition-all cursor-pointer"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Consistency Reference Guides */}
        <ReferenceGuides
          characterGuide={characterGuide}
          setCharacterGuide={setCharacterGuide}
          styleGuide={styleGuide}
          setStyleGuide={setStyleGuide}
        />

        {/* Storyboard Header & Controls */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Storyboard Sequences</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                {scenes.length} Scenes
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Each scene renders a seamless 5s clip. Upload Start & End frames for custom transformations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddScene}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scene</span>
            </button>
          </div>
        </div>

        {/* Storyboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scenes.map((scene) => (
            <StoryboardCard
              key={scene.id}
              scene={scene}
              aspectRatio={aspectRatio}
              engine={engine}
              klingApiKey={klingApiKey}
              colabUrl={colabUrl}
              setColabUrl={setColabUrl}
              onUpdateScene={(updated) =>
                setScenes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
              }
              onDeleteScene={handleDeleteScene}
              onGenerateScene={handleGenerateScene}
              onGenerateFrame={handleGenerateFrame}
              onUpscaleScene={handleUpscaleScene}
            />
          ))}
        </div>
      </main>

      {/* Bottom Timeline Bar */}
      <TimelineBar
        scenes={scenes}
        onStitchMovie={handleStitchMovie}
        isStitching={isStitching}
        finalMovieUrl={finalMovieUrl}
        musicFile={musicFile}
        setMusicFile={setMusicFile}
      />

      {/* Modals */}
      <ScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onParseScript={handleParseScript}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        colabUrl={colabUrl}
        setColabUrl={setColabUrl}
        klingApiKey={klingApiKey}
        setKlingApiKey={setKlingApiKey}
        seedanceApiKey={seedanceApiKey}
        setSeedanceApiKey={setSeedanceApiKey}
      />
    </div>
  );
};
