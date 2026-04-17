import { create } from 'zustand';

export interface GenerationStep {
  step: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface GenerationState {
  currentJobId: string | null;
  currentAppId: string | null;
  steps: GenerationStep[];
  isGenerating: boolean;
  isComplete: boolean;
  error: string | null;

  startJob: (jobId: string, appId: string) => void;
  addStep: (step: GenerationStep) => void;
  setComplete: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  currentJobId: null,
  currentAppId: null,
  steps: [],
  isGenerating: false,
  isComplete: false,
  error: null,

  startJob: (jobId, appId) =>
    set({
      currentJobId: jobId,
      currentAppId: appId,
      steps: [],
      isGenerating: true,
      isComplete: false,
      error: null,
    }),

  addStep: (step) =>
    set((state) => ({
      steps: [...state.steps, step],
    })),

  setComplete: () =>
    set({ isGenerating: false, isComplete: true }),

  setError: (error) =>
    set({ isGenerating: false, error }),

  reset: () =>
    set({
      currentJobId: null,
      currentAppId: null,
      steps: [],
      isGenerating: false,
      isComplete: false,
      error: null,
    }),
}));
