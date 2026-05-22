// ─── App ──────────────────────────────────────────────────────────────────────
export const APP_NAME = "PromptCraft";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PLAN_KEYS = ["FREE", "PRO", "CREATOR", "ENTERPRISE"] as const;
export type Plan = (typeof PLAN_KEYS)[number];

export interface PlanConfig {
  key: Plan;
  label: string;
  description: string;
  price: number | null;         // USD/month, null = custom
  dailyLimit: number;           // generations per day
  stripePriceEnvKey?: string;   // env var holding the Stripe price ID
  highlight: boolean;           // shown as "popular"
  badge?: string;
  features: string[];
  limits: {
    collectionsMax: number;
    historyDays: number;
    imageUploads: boolean;
    apiAccess: boolean;
    premiumModels: boolean;
    promptSelling: boolean;
  };
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    key: "FREE",
    label: "Free",
    description: "Perfect for getting started",
    price: 0,
    dailyLimit: 10,
    highlight: false,
    features: [
      "10 AI generations per day",
      "Standard models (Groq Llama)",
      "All 15 prompt categories",
      "Prompt history (7 days)",
      "3 collections",
      "Community prompts access",
    ],
    limits: {
      collectionsMax: 3,
      historyDays: 7,
      imageUploads: false,
      apiAccess: false,
      premiumModels: false,
      promptSelling: false,
    },
  },
  PRO: {
    key: "PRO",
    label: "Pro",
    description: "For power users and professionals",
    price: 9,
    dailyLimit: 200,
    stripePriceEnvKey: "STRIPE_PRO_PRICE_ID",
    highlight: true,
    badge: "Most Popular",
    features: [
      "200 AI generations per day",
      "Premium models (GPT-4o, Claude Sonnet)",
      "Image upload & analysis",
      "Unlimited collections",
      "Prompt history (90 days)",
      "No watermark on exports",
      "Priority generation queue",
    ],
    limits: {
      collectionsMax: Infinity,
      historyDays: 90,
      imageUploads: true,
      apiAccess: false,
      premiumModels: true,
      promptSelling: false,
    },
  },
  CREATOR: {
    key: "CREATOR",
    label: "Creator",
    description: "Build and monetise your prompt library",
    price: 29,
    dailyLimit: Infinity,
    stripePriceEnvKey: "STRIPE_CREATOR_PRICE_ID",
    highlight: false,
    badge: "Best Value",
    features: [
      "Unlimited AI generations",
      "All premium models",
      "API access ($0.002/generation)",
      "Sell prompts on the marketplace",
      "Creator analytics dashboard",
      "Priority support",
      "Custom system prompts",
      "Bulk export",
    ],
    limits: {
      collectionsMax: Infinity,
      historyDays: Infinity,
      imageUploads: true,
      apiAccess: true,
      premiumModels: true,
      promptSelling: true,
    },
  },
  ENTERPRISE: {
    key: "ENTERPRISE",
    label: "Enterprise",
    description: "Custom solutions for teams",
    price: null,
    dailyLimit: Infinity,
    highlight: false,
    features: [
      "Everything in Creator",
      "Team workspaces & SSO",
      "Fine-tuning on company style",
      "Dedicated support & SLA",
      "Custom integrations",
      "Compliance & security review",
      "Volume API pricing",
    ],
    limits: {
      collectionsMax: Infinity,
      historyDays: Infinity,
      imageUploads: true,
      apiAccess: true,
      premiumModels: true,
      promptSelling: true,
    },
  },
};

// ─── Category config ──────────────────────────────────────────────────────────

export interface CategoryConfig {
  slug: string;
  name: string;
  shortName: string;
  icon: string;
  /** Tailwind bg + text class pair for the category chip */
  colorClass: string;
  description: string;
  exampleInput: string;
  modelOverride?: string;
  sortOrder: number;
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    slug: "ai-image-generation",
    name: "AI Image Generation",
    shortName: "Image Gen",
    icon: "🎨",
    colorClass: "bg-purple-500/15 text-purple-400",
    description:
      "Generate stunning images with Midjourney, DALL-E 3, Stable Diffusion, Flux, and Leonardo AI.",
    exampleInput: "A girl reading a book in a rainy café",
    sortOrder: 1,
  },
  {
    slug: "photo-editing",
    name: "Photo Editing",
    shortName: "Photo Edit",
    icon: "📷",
    colorClass: "bg-blue-500/15 text-blue-400",
    description:
      "Precise editing instructions for Lightroom, Photoshop AI, and style transfer tools.",
    exampleInput: "Make my portrait look like a film photo",
    sortOrder: 2,
  },
  {
    slug: "video-editing",
    name: "Video Editing",
    shortName: "Video Edit",
    icon: "🎬",
    colorClass: "bg-red-500/15 text-red-400",
    description:
      "Cinematic motion prompts for Runway Gen-3, Kling 2.0, Sora, and Pika.",
    exampleInput: "Slow-motion waves crashing on a rocky shore at sunset",
    sortOrder: 3,
  },
  {
    slug: "cinematic-reels",
    name: "Cinematic Reels",
    shortName: "Reels",
    icon: "🎥",
    colorClass: "bg-pink-500/15 text-pink-400",
    description:
      "Instagram Reels and short film content with professional cinematic aesthetics.",
    exampleInput: "A travel reel through Tokyo at night",
    modelOverride: "anthropic/claude-sonnet-4-20250514",
    sortOrder: 4,
  },
  {
    slug: "coding-projects",
    name: "Coding Projects",
    shortName: "Coding",
    icon: "💻",
    colorClass: "bg-green-500/15 text-green-400",
    description:
      "Complete project specs and prompts for GitHub Copilot, Cursor, and Claude Code.",
    exampleInput: "Build a real-time chat feature with React and WebSockets",
    sortOrder: 5,
  },
  {
    slug: "ui-ux-design",
    name: "UI/UX Design",
    shortName: "UI/UX",
    icon: "🖼️",
    colorClass: "bg-cyan-500/15 text-cyan-400",
    description:
      "Design system prompts, Figma component specs, and wireframe instructions.",
    exampleInput: "A pricing page for a SaaS product, clean and modern",
    sortOrder: 6,
  },
  {
    slug: "resume-creation",
    name: "Resume Creation",
    shortName: "Resume",
    icon: "📄",
    colorClass: "bg-orange-500/15 text-orange-400",
    description:
      "ATS-optimized, role-specific resumes and cover letters that get interviews.",
    exampleInput: "Software engineer with 3 years React experience applying to Google",
    sortOrder: 7,
  },
  {
    slug: "presentation-gen",
    name: "Presentations",
    shortName: "Slides",
    icon: "📊",
    colorClass: "bg-yellow-500/15 text-yellow-400",
    description:
      "Slide decks with narrative arc, data visualization, and executive storytelling.",
    exampleInput: "Q3 business review for the executive team",
    sortOrder: 8,
  },
  {
    slug: "startup-ideas",
    name: "Startup Ideas",
    shortName: "Startups",
    icon: "🚀",
    colorClass: "bg-violet-500/15 text-violet-400",
    description:
      "Problem/solution framing, market sizing, business models, and pitch narratives.",
    exampleInput: "An app that helps remote teams stay socially connected",
    modelOverride: "anthropic/claude-sonnet-4-20250514",
    sortOrder: 9,
  },
  {
    slug: "youtube-thumbnails",
    name: "YouTube Thumbnails",
    shortName: "Thumbnails",
    icon: "▶️",
    colorClass: "bg-red-500/15 text-red-400",
    description:
      "CTR-optimized thumbnails with emotional triggers, contrast, and curiosity gaps.",
    exampleInput: "I learned a new language in 30 days — shocked reaction",
    sortOrder: 10,
  },
  {
    slug: "game-development",
    name: "Game Development",
    shortName: "Games",
    icon: "🎮",
    colorClass: "bg-emerald-500/15 text-emerald-400",
    description:
      "Game design documents, world-building prompts, and Unity/Unreal asset generation.",
    exampleInput: "A roguelike dungeon crawler set in a corrupted medieval city",
    sortOrder: 11,
  },
  {
    slug: "chatgpt-optimization",
    name: "ChatGPT Optimization",
    shortName: "ChatGPT",
    icon: "🤖",
    colorClass: "bg-teal-500/15 text-teal-400",
    description:
      "System prompts, persona design, chain-of-thought templates, and GPT optimization.",
    exampleInput: "A research assistant that finds academic papers and summarises them",
    sortOrder: 12,
  },
  {
    slug: "midjourney-specific",
    name: "Midjourney Specific",
    shortName: "Midjourney",
    icon: "✨",
    colorClass: "bg-indigo-500/15 text-indigo-400",
    description:
      "Expert Midjourney prompts with precise --ar, --stylize, --sref, --chaos tuning.",
    exampleInput: "Dark fantasy knight standing in front of a burning cathedral",
    sortOrder: 13,
  },
  {
    slug: "video-ai-tools",
    name: "Video AI Tools",
    shortName: "Video AI",
    icon: "🌊",
    colorClass: "bg-sky-500/15 text-sky-400",
    description:
      "Specialised prompts for Runway Gen-3, Kling 2.0, Sora, and HeyGen avatars.",
    exampleInput: "A product demo video for a new smartwatch",
    modelOverride: "anthropic/claude-sonnet-4-20250514",
    sortOrder: 14,
  },
  {
    slug: "website-design",
    name: "Website Design",
    shortName: "Web Design",
    icon: "🌐",
    colorClass: "bg-lime-500/15 text-lime-400",
    description:
      "Component specs, layout systems, color theory, and conversion-optimised web design.",
    exampleInput: "A landing page for a SaaS analytics dashboard",
    sortOrder: 15,
  },
];

export const CATEGORY_MAP: Record<string, CategoryConfig> = Object.fromEntries(
  CATEGORY_CONFIG.map((c) => [c.slug, c])
);

// ─── AI models ────────────────────────────────────────────────────────────────

export const AI_MODELS = {
  FAST:     "groq/llama-3.1-70b-versatile",
  STANDARD: "openai/gpt-4o-mini",
  PREMIUM:  "anthropic/claude-sonnet-4-20250514",
  VISION:   "openai/gpt-4o",
} as const;
