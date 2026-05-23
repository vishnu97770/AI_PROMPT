"use client";

import { create } from "zustand";
import type { CategoryConfig } from "@/lib/constants";
import type { GenerateResponse } from "@promptcraft/types";

export interface StylePreferences {
  mood: string;
  lighting: string;
  colorPalette: string;
}

interface GenerateStore {
  // Input
  selectedCategory: CategoryConfig | null;
  userInput: string;
  stylePreferences: StylePreferences;

  // Generation state
  isGenerating: boolean;
  streamModel: string;
  streamedText: string;
  finalResult: GenerateResponse | null;
  savedPromptId: string | null;
  error: string | null;

  // Credits (populated from /api/user/stats)
  creditsUsed: number;
  creditsLimit: number;

  // Actions
  setSelectedCategory: (cat: CategoryConfig | null) => void;
  setUserInput: (text: string) => void;
  setStylePreferences: (prefs: Partial<StylePreferences>) => void;
  startGeneration: () => void;
  setStreamModel: (model: string) => void;
  appendToken: (token: string) => void;
  setFinalResult: (result: GenerateResponse) => void;
  setSavedPromptId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setCredits: (used: number, limit: number) => void;
  incrementCreditsUsed: () => void;
  resetOutput: () => void;
}

export const useGenerateStore = create<GenerateStore>()((set) => ({
  selectedCategory: null,
  userInput: "",
  stylePreferences: { mood: "", lighting: "", colorPalette: "" },
  isGenerating: false,
  streamModel: "",
  streamedText: "",
  finalResult: null,
  savedPromptId: null,
  error: null,
  creditsUsed: 0,
  creditsLimit: 10,

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setUserInput: (text) => set({ userInput: text }),
  setStylePreferences: (prefs) =>
    set((s) => ({ stylePreferences: { ...s.stylePreferences, ...prefs } })),

  startGeneration: () =>
    set({
      isGenerating: true,
      streamedText: "",
      streamModel: "",
      finalResult: null,
      savedPromptId: null,
      error: null,
    }),

  setStreamModel: (model) => set({ streamModel: model }),
  appendToken: (token) => set((s) => ({ streamedText: s.streamedText + token })),

  setFinalResult: (result) =>
    set({ finalResult: result, isGenerating: false }),

  setSavedPromptId: (id) => set({ savedPromptId: id }),
  setError: (error) => set({ error, isGenerating: false }),

  setCredits: (used, limit) => set({ creditsUsed: used, creditsLimit: limit }),
  incrementCreditsUsed: () => set((s) => ({ creditsUsed: s.creditsUsed + 1 })),

  resetOutput: () =>
    set({
      isGenerating: false,
      streamedText: "",
      streamModel: "",
      finalResult: null,
      savedPromptId: null,
      error: null,
    }),
}));
