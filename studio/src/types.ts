export type EngineType = 'pollinations' | 'colab' | 'kling' | 'seedance';
export type AspectRatio = '9:16' | '16:9' | '1:1';

export interface CharacterGuide {
  enabled: boolean;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface StyleGuide {
  enabled: boolean;
  preset: string;
  customPrompt: string;
  moodBoardUrl?: string;
}

export interface StoryboardScene {
  id: string;
  sceneNumber: number;
  title: string;
  narration: string;
  visualPrompt: string;
  motionPrompt: string;
  durationSec: number;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  progress?: number;
  progressStage?: string;
  elapsedSec?: number;
  videoUrl?: string;
  startImageUrl?: string;
  endImageUrl?: string;
  isUpscaled?: boolean;
  errorMessage?: string;
}
