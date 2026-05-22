// ─── User ─────────────────────────────────────────────────────────────────────

export type Plan = "free" | "pro" | "creator" | "enterprise";

export interface User {
  id: string;
  email: string;
  username?: string;
  plan: Plan;
  creditsRemaining: number;
  createdAt: string;
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

export interface ToolVariants {
  midjourney?: string;
  dalle?: string;
  stable_diffusion?: string;
  runway?: string;
  kling?: string;
}

export interface PromptMetadata {
  lighting?: string;
  mood?: string;
  cameraAngle?: string;
  colorGrade?: string;
  filmStock?: string;
  [key: string]: unknown;
}

export interface Prompt {
  id: string;
  userId: string;
  categoryId: string;
  userInput: string;
  generatedPrompt: string;
  toolVariants?: ToolVariants;
  metadata?: PromptMetadata;
  qualityScore?: number;
  copyCount: number;
  isPublic: boolean;
  modelUsed?: string;
  createdAt: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface GenerateRequest {
  userInput: string;
  category: string;
  hasImage?: boolean;
}

export interface GenerateResponse {
  promptId: string;
  generatedPrompt: string;
  toolVariants: ToolVariants;
  metadata: PromptMetadata;
  modelUsed: string;
  cached: boolean;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string;
}
