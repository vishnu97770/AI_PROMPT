// ─── Shared domain types ──────────────────────────────────────────────────────

export type Plan = "FREE" | "PRO" | "CREATOR" | "ENTERPRISE";

export interface User {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  plan: Plan;
  creditsRemaining: number;
  createdAt: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder: number;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

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
  camera?: string;
  style?: string;
  category?: string;
  [key: string]: unknown;
}

export interface Prompt {
  id: string;
  userId: string;
  categoryId: string;
  userInput: string;
  generatedPrompt: string;
  negativePrompt?: string;
  toolVariants?: ToolVariants;
  metadata?: PromptMetadata;
  qualityScore?: number;
  modelUsed?: string;
  copyCount: number;
  likeCount: number;
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Prompt row with its category relation pre-joined */
export interface PromptWithCategory extends Prompt {
  category: Pick<Category, "id" | "slug" | "name" | "icon">;
}

// ─── API request / response ───────────────────────────────────────────────────

export interface GenerateRequest {
  userInput: string;
  categorySlug: string;
  hasImage?: boolean;
}

export interface GenerateResponse {
  promptId: string;
  generatedPrompt: string;
  negativePrompt?: string;
  toolVariants: ToolVariants;
  metadata: PromptMetadata;
  modelUsed: string;
  cached: boolean;
  qualityScore?: number;
}

/** SSE token event streamed by /api/generate/stream */
export type StreamEvent =
  | { event: "start"; model: string }
  | { token: string }
  | { done: true; result: GenerateResponse }
  | { error: string };

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
}

// ─── Rate limit ───────────────────────────────────────────────────────────────

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until daily reset
}

// ─── Consistent API error shape ───────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
  status: number;
}
