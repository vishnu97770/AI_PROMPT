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
  /** Emoji icon kept for backward compatibility */
  icon: string;
  /** Lucide component name (e.g. "Image", "Code2") */
  lucideIcon: string;
  /** Hex accent color */
  color: string;
  /** Tailwind bg + text class pair for small chips */
  colorClass: string;
  description: string;
  exampleInput: string;
  /** Short example of what a generated prompt looks like */
  exampleOutput: string;
  /** 3 power-user tips specific to this category */
  tips: string[];
  modelOverride?: string;
  sortOrder: number;
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    slug: "ai-image-generation",
    name: "AI Image Generation",
    shortName: "Image Gen",
    icon: "🎨",
    lucideIcon: "Image",
    color: "#A855F7",
    colorClass: "bg-purple-500/15 text-purple-400",
    description:
      "Generate stunning images with Midjourney, DALL-E 3, Stable Diffusion, Flux, and Leonardo AI.",
    exampleInput: "A girl reading a book in a rainy café",
    exampleOutput:
      "Solitary girl reading in a rain-soaked Parisian café, warm amber candlelight, steam from espresso, rain-streaked windows, cinematic film grain, Leica M6 35mm f/1.4, shallow depth of field, moody atmosphere --ar 2:3 --stylize 850 --q 2",
    tips: [
      "Always specify aspect ratio (--ar) and quality (--q) for consistent results.",
      "Describe lighting first — it's the single biggest quality lever in image prompts.",
      "Layer styles: combine a real-world reference + art movement + camera spec for unique outputs.",
    ],
    sortOrder: 1,
  },
  {
    slug: "photo-editing",
    name: "Photo Editing",
    shortName: "Photo Edit",
    icon: "📷",
    lucideIcon: "Camera",
    color: "#3B82F6",
    colorClass: "bg-blue-500/15 text-blue-400",
    description:
      "Precise editing instructions for Lightroom, Photoshop AI, and style transfer tools.",
    exampleInput: "Make my portrait look like a film photo",
    exampleOutput:
      "Apply Kodak Portra 400 emulation: raise shadows +15 with warm amber split-tone, slight magenta cast in highlights, reduce global saturation −12, add 25% film grain overlay, apply soft vignette −20, lift blacks to simulate halation. Export at 100% quality, sRGB.",
    tips: [
      "Reference a specific film stock (Portra, Fuji Pro 400H, Ilford HP5) for consistent colour science.",
      "Always specify which tool you're targeting — Lightroom sliders differ from Photoshop Neural Filters.",
      "Include before/after intent: 'transform a flat phone photo into a moody editorial shot' sets the right direction.",
    ],
    sortOrder: 2,
  },
  {
    slug: "video-editing",
    name: "Video Editing",
    shortName: "Video Edit",
    icon: "🎬",
    lucideIcon: "Film",
    color: "#EF4444",
    colorClass: "bg-red-500/15 text-red-400",
    description:
      "Cinematic motion prompts for Runway Gen-3, Kling 2.0, Sora, and Pika.",
    exampleInput: "Slow-motion waves crashing on a rocky shore at sunset",
    exampleOutput:
      "120fps ocean waves on volcanic rock slowed to 24fps, golden-hour backlight with anamorphic lens flare, rack focus from white foam to hazy horizon, teal-orange grade with crushed blacks, subtle motion blur trails on fastest elements, 6-second loop.",
    tips: [
      "Specify frame rate and the playback speed separately — '120fps played at 24fps' is unambiguous.",
      "Mention camera movement explicitly: 'static tripod', 'slow dolly push', 'handheld verité' all yield very different feels.",
      "Describe the grade as a reference film or look (e.g. 'Dune Part Two warm desert palette') for better AI interpretation.",
    ],
    sortOrder: 3,
  },
  {
    slug: "cinematic-reels",
    name: "Cinematic Reels",
    shortName: "Reels",
    icon: "🎥",
    lucideIcon: "Clapperboard",
    color: "#EC4899",
    colorClass: "bg-pink-500/15 text-pink-400",
    description:
      "Instagram Reels and short film content with professional cinematic aesthetics.",
    exampleInput: "A travel reel through Tokyo at night",
    exampleOutput:
      "Opening aerial pull-back over Shibuya crossing 2am, neon reflections on wet asphalt, cut to ground-level speed-ramp through crowds, close-up of ramen steam, trending audio sync at beat drop, colour grade: crushed blacks + neon saturation boost, 9:16 vertical, 30s total.",
    tips: [
      "Structure your prompt as a shot list: opening → middle sequence → closing money shot.",
      "Always specify orientation (9:16 vertical) and target length — AI tools use this to pace cuts.",
      "Name the audio mood ('melancholic lo-fi beat', 'cinematic swell') — it influences pacing suggestions.",
    ],
    modelOverride: "anthropic/claude-sonnet-4-20250514",
    sortOrder: 4,
  },
  {
    slug: "coding-projects",
    name: "Coding Projects",
    shortName: "Coding",
    icon: "💻",
    lucideIcon: "Code2",
    color: "#22C55E",
    colorClass: "bg-green-500/15 text-green-400",
    description:
      "Complete project specs and prompts for GitHub Copilot, Cursor, and Claude Code.",
    exampleInput: "Build a real-time chat feature with React and WebSockets",
    exampleOutput:
      "Build a real-time collaborative chat using React 18, Socket.io, and PostgreSQL. Use Zustand for client state, Prisma ORM, TailwindCSS. Include: typing indicators (debounced 300ms), read receipts (seen/delivered), emoji reactions, room-based channels. Provide full folder structure, TypeScript types, socket event schema, and Prisma migration.",
    tips: [
      "Include your existing stack explicitly — 'I'm already using Next.js 14 App Router with Supabase' saves back-and-forth.",
      "Ask for folder structure first, then implementation — staged prompts produce better architecture.",
      "Specify constraints: 'no new dependencies', 'must work in Edge Runtime', 'mobile-first' guide the solution shape.",
    ],
    sortOrder: 5,
  },
  {
    slug: "ui-ux-design",
    name: "UI/UX Design",
    shortName: "UI/UX",
    icon: "🖼️",
    lucideIcon: "PenTool",
    color: "#06B6D4",
    colorClass: "bg-cyan-500/15 text-cyan-400",
    description:
      "Design system prompts, Figma component specs, and wireframe instructions.",
    exampleInput: "A pricing page for a SaaS product, clean and modern",
    exampleOutput:
      "Pricing page: 3 tiers (Starter $0 / Pro $29 / Enterprise custom), white background, primary CTA in #6366F1, annual/monthly toggle with 20% savings badge, feature comparison table (12 rows), trust logos row (SOC2, GDPR, ISO 27001), FAQ accordion (8 questions). 8pt grid, Inter typeface, max-width 1200px.",
    tips: [
      "Reference a design system (Material 3, Radix Themes, Shadcn) to anchor component vocabulary.",
      "Specify responsive breakpoints explicitly — designers and AI tools interpret 'mobile-friendly' very differently.",
      "Include accessibility requirements upfront: WCAG AA contrast, keyboard nav, ARIA roles.",
    ],
    sortOrder: 6,
  },
  {
    slug: "resume-creation",
    name: "Resume Creation",
    shortName: "Resume",
    icon: "📄",
    lucideIcon: "FileText",
    color: "#F97316",
    colorClass: "bg-orange-500/15 text-orange-400",
    description:
      "ATS-optimized, role-specific resumes and cover letters that get interviews.",
    exampleInput: "Software engineer with 3 years React experience applying to Google",
    exampleOutput:
      "Senior React Engineer resume optimized for Google ATS: impact-led STAR bullets ('Reduced LCP by 43% via lazy-loading, serving 2.3M MAU'), skills matrix (Expert: React, TypeScript, GraphQL | Proficient: Rust, Go), clean single-column layout for ATS parsing, education last, projects section with GitHub links.",
    tips: [
      "Include the exact job description keywords — ATS systems do literal string matching.",
      "Lead every bullet with a strong action verb followed immediately by a quantified outcome.",
      "Ask for a cover letter in the same prompt — consistency between the two documents improves screening rates.",
    ],
    sortOrder: 7,
  },
  {
    slug: "presentation-gen",
    name: "Presentations",
    shortName: "Slides",
    icon: "📊",
    lucideIcon: "BarChart2",
    color: "#EAB308",
    colorClass: "bg-yellow-500/15 text-yellow-400",
    description:
      "Slide decks with narrative arc, data visualization, and executive storytelling.",
    exampleInput: "Q3 business review for the executive team",
    exampleOutput:
      "Q3 Business Review (12 slides): 1 Executive Summary → 2 Revenue Overview (waterfall chart) → 3 YoY Growth → 4 Customer NPS & Churn → 5 Pipeline Analysis → 6 Product Roadmap → 7 Team Highlights → 8 Risks & Mitigations → 9 Q4 Forecast → 10 Ask. Board-ready tone, data-driven, no more than 6 bullets per slide.",
    tips: [
      "Start with the ask — busy executives read backward; put the conclusion on slide 1.",
      "Specify your audience's technical level so the AI calibrates jargon appropriately.",
      "Request a 'slide notes' column — AI-generated speaker notes dramatically reduce prep time.",
    ],
    sortOrder: 8,
  },
  {
    slug: "startup-ideas",
    name: "Startup Ideas",
    shortName: "Startups",
    icon: "🚀",
    lucideIcon: "Rocket",
    color: "#8B5CF6",
    colorClass: "bg-violet-500/15 text-violet-400",
    description:
      "Problem/solution framing, market sizing, business models, and pitch narratives.",
    exampleInput: "An app that helps remote teams stay socially connected",
    exampleOutput:
      "WaterCooler AI: async video rooms that auto-schedule 5-min serendipitous 1:1s based on shared interests and calendar gaps. TAM $4.2B (remote work software, growing 18% YoY). Business model: $8/seat/month, 40% gross margin at scale. MVP: Slack integration + AI scheduler. Moat: proprietary interest-graph that improves with usage.",
    tips: [
      "Anchor your idea in a specific pain point you've personally experienced — AI outputs are sharper when the problem is concrete.",
      "Ask for a 'kill this idea' critique after the pitch — stress-testing upfront saves months.",
      "Request three different business model variants (SaaS, marketplace, usage-based) and compare them.",
    ],
    modelOverride: "anthropic/claude-sonnet-4-20250514",
    sortOrder: 9,
  },
  {
    slug: "youtube-thumbnails",
    name: "YouTube Thumbnails",
    shortName: "Thumbnails",
    icon: "▶️",
    lucideIcon: "Youtube",
    color: "#DC2626",
    colorClass: "bg-red-500/15 text-red-600",
    description:
      "CTR-optimized thumbnails with emotional triggers, contrast, and curiosity gaps.",
    exampleInput: "I learned a new language in 30 days — shocked reaction",
    exampleOutput:
      "Split-screen thumbnail: LEFT — close-cropped shocked face, wide eyes, hand on cheek, pointing right. RIGHT — bold yellow Bebas Neue text 'ARABIC IN 30 DAYS?!' on dark navy background. Red arrow from face to text. No small fonts. Emotion-forward, 1280×720px, high contrast.",
    tips: [
      "The face always goes left, text right — eye tracking studies show this gets the most fixations.",
      "Limit text to 4 words maximum — thumbnails are viewed at 120px on mobile.",
      "Specify the exact emotion (shock, disbelief, excitement) rather than 'expressive' — vague adjectives produce generic faces.",
    ],
    sortOrder: 10,
  },
  {
    slug: "game-development",
    name: "Game Development",
    shortName: "Games",
    icon: "🎮",
    lucideIcon: "Gamepad2",
    color: "#10B981",
    colorClass: "bg-emerald-500/15 text-emerald-400",
    description:
      "Game design documents, world-building prompts, and Unity/Unreal asset generation.",
    exampleInput: "A roguelike dungeon crawler set in a corrupted medieval city",
    exampleOutput:
      "Valdorm Roguelike GDD: Setting — a medieval city rotting from a corruption artifact beneath the cathedral. Core loop: explore 7 procedural floors, collect corruption relics (buffs with side effects), manage sanity meter (0-100). Art: dark pixel art, Blasphemous-inspired. 24 enemy types with behaviour trees. Boss floor 7: The Architect (phase-shifted mirror fight).",
    tips: [
      "Write your GDD prompt as a narrative first, mechanics second — world coherence makes AI-generated systems more consistent.",
      "Ask for enemy behaviour trees in a structured format (IDLE → PATROL → AGGRO → ATTACK) for direct implementation.",
      "Specify engine and version (Unity 6, Unreal 5.4) so asset formats and shader references are correct.",
    ],
    sortOrder: 11,
  },
  {
    slug: "chatgpt-optimization",
    name: "ChatGPT Optimization",
    shortName: "ChatGPT",
    icon: "🤖",
    lucideIcon: "Bot",
    color: "#14B8A6",
    colorClass: "bg-teal-500/15 text-teal-400",
    description:
      "System prompts, persona design, chain-of-thought templates, and GPT optimization.",
    exampleInput: "A research assistant that finds academic papers and summarises them",
    exampleOutput:
      "SYSTEM: You are ResearchBot, a meticulous academic assistant. When given a topic: (1) identify 5 key sub-questions, (2) locate papers published 2020–2025, (3) summarise each in 3 bullets: finding, methodology, limitation, (4) synthesise a literature gap. Format: structured markdown with citation links. Always quantify confidence. Never fabricate citations.",
    tips: [
      "Use XML tags to separate system instructions from examples — <instructions> and <example> blocks reduce hallucination.",
      "Give the persona a name and a specific failure mode to avoid ('never make up citations') for more reliable behaviour.",
      "Include 2-3 few-shot examples directly in the system prompt for tasks that require specific output formats.",
    ],
    sortOrder: 12,
  },
  {
    slug: "midjourney-specific",
    name: "Midjourney Specific",
    shortName: "Midjourney",
    icon: "✨",
    lucideIcon: "Wand2",
    color: "#6366F1",
    colorClass: "bg-indigo-500/15 text-indigo-400",
    description:
      "Expert Midjourney prompts with precise --ar, --stylize, --sref, --chaos tuning.",
    exampleInput: "Dark fantasy knight standing in front of a burning cathedral",
    exampleOutput:
      "Dark fantasy knight before a burning Gothic cathedral, dramatic low-angle shot, volumetric god rays through smoke, ember particles, photorealistic, ArtStation trending, ultra-detailed plate armour with battle damage and engraved runes, ash falling like snow --ar 2:3 --stylize 1000 --chaos 15 --q 2 --v 6.1",
    tips: [
      "Place the most important subject first — Midjourney weights the beginning of prompts most heavily.",
      "Use --sref (style reference) with a URL to lock aesthetic consistency across a series of images.",
      "Dial --chaos between 10-25 to explore variants; drop to 0 for reproducible results with the same seed.",
    ],
    sortOrder: 13,
  },
  {
    slug: "video-ai-tools",
    name: "Video AI Tools",
    shortName: "Video AI",
    icon: "🌊",
    lucideIcon: "Video",
    color: "#0EA5E9",
    colorClass: "bg-sky-500/15 text-sky-400",
    description:
      "Specialised prompts for Runway Gen-3, Kling 2.0, Sora, and HeyGen avatars.",
    exampleInput: "A product demo video for a new smartwatch",
    exampleOutput:
      "Runway Gen-3: close-up of a luxury smartwatch on a wrist, camera orbits slowly 180°, morning light through floor-to-ceiling window, shallow depth of field, chrome face reflecting a blurred city skyline, ambient lens flare at orbit midpoint. 6-second loop, 24fps, 2.39:1 letterbox.",
    tips: [
      "Specify the target tool in the prompt — Runway, Kling, and Sora each have different strengths and prompt conventions.",
      "Keep motion descriptions to one primary movement — multi-axis camera paths confuse current video AI models.",
      "Describe the start frame and end frame explicitly; most tools interpolate between the two.",
    ],
    modelOverride: "anthropic/claude-sonnet-4-20250514",
    sortOrder: 14,
  },
  {
    slug: "website-design",
    name: "Website Design",
    shortName: "Web Design",
    icon: "🌐",
    lucideIcon: "Globe",
    color: "#84CC16",
    colorClass: "bg-lime-500/15 text-lime-400",
    description:
      "Component specs, layout systems, color theory, and conversion-optimised web design.",
    exampleInput: "A landing page for a SaaS analytics dashboard",
    exampleOutput:
      "SaaS analytics landing: hero with animated dashboard mockup floating on gradient background, social proof bar (50+ logos), 6-feature grid (icon + headline + 2-line description), pricing section (3 tiers, Pro highlighted), testimonials carousel (3 quotes), email capture CTA with gradient button. Max-width 1280px, Inter/Geist typefaces, primary #6366F1.",
    tips: [
      "Define the conversion goal first ('capture email', 'book demo', 'start free trial') — it shapes the entire hierarchy.",
      "Ask for a content hierarchy (H1 → primary CTA → trust signals → features → social proof) before asking for visual design.",
      "Specify your brand colors and typefaces upfront; AI tools default to generic palettes without constraints.",
    ],
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
