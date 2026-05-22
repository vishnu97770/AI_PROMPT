export const APP_NAME = "PromptCraft";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const PLANS = {
  FREE: "free",
  PRO: "pro",
  CREATOR: "creator",
  ENTERPRISE: "enterprise",
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export const PLAN_LIMITS: Record<Plan, number> = {
  free: 10,
  pro: 200,
  creator: Infinity,
  enterprise: Infinity,
};

export const PLAN_PRICES: Record<string, number> = {
  pro: 9,
  creator: 29,
};

export const CATEGORIES = [
  { slug: "image-generation", label: "AI Image Generation", icon: "🎨" },
  { slug: "photo-editing", label: "Photo Editing", icon: "📷" },
  { slug: "video-editing", label: "Video Editing", icon: "🎬" },
  { slug: "cinematic-reels", label: "Cinematic Reels", icon: "🎥" },
  { slug: "coding", label: "Coding Projects", icon: "💻" },
  { slug: "ui-ux", label: "UI/UX Design", icon: "🖼️" },
  { slug: "resume", label: "Resume Creation", icon: "📄" },
  { slug: "presentations", label: "Presentations", icon: "📊" },
  { slug: "startup-ideas", label: "Startup Ideas", icon: "🚀" },
  { slug: "youtube-thumbnails", label: "YouTube Thumbnails", icon: "▶️" },
  { slug: "game-dev", label: "Game Development", icon: "🎮" },
  { slug: "chatgpt", label: "ChatGPT Optimization", icon: "🤖" },
  { slug: "midjourney", label: "Midjourney Specific", icon: "✨" },
  { slug: "video-ai", label: "Video AI Tools", icon: "🌊" },
  { slug: "website-design", label: "Website Design", icon: "🌐" },
] as const;

export const AI_MODELS = {
  FAST: "groq/llama-3.1-70b",
  STANDARD: "openai/gpt-4o-mini",
  PREMIUM: "anthropic/claude-sonnet-4-20250514",
  VISION: "openai/gpt-4o",
} as const;
