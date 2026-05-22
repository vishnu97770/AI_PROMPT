from dataclasses import dataclass, field


@dataclass
class CategoryConfig:
    slug: str
    name: str
    system_prompt: str
    temperature: float = 0.7
    max_tokens: int = 800
    model_override: str | None = None
    rag_threshold: float = 0.92
    style_vocabulary: list[str] = field(default_factory=list)


CATEGORIES: dict[str, CategoryConfig] = {
    "image-generation": CategoryConfig(
        slug="image-generation",
        name="AI Image Generation",
        system_prompt=(
            "You are an expert AI image prompt engineer specializing in Midjourney, "
            "DALL-E 3, and Stable Diffusion. Transform the user's simple idea into a "
            "detailed, professional prompt. Include: subject, lighting, camera angle, "
            "color grade, film stock, mood, art style, and technical parameters. "
            "Output a master prompt, then tool-specific variants."
        ),
        temperature=0.8,
        max_tokens=1200,
        style_vocabulary=[
            "cinematic", "golden hour", "bokeh", "shallow DOF",
            "Kodak Portra 400", "teal-orange grade", "rule of thirds",
        ],
    ),
    "coding": CategoryConfig(
        slug="coding",
        name="Coding Projects",
        system_prompt=(
            "You are an expert software engineer prompt specialist. Transform the user's "
            "coding request into a detailed, structured prompt for AI coding assistants "
            "like GitHub Copilot, Cursor, or Claude Code. Include: tech stack, "
            "architecture patterns, file structure, edge cases, and acceptance criteria."
        ),
        temperature=0.3,
        max_tokens=1000,
    ),
    "ui-ux": CategoryConfig(
        slug="ui-ux",
        name="UI/UX Design",
        system_prompt=(
            "You are a senior product designer and prompt engineer. Transform the user's "
            "design idea into a detailed Figma/design tool prompt. Include: component "
            "specs, color system, typography, spacing, interaction states, and "
            "accessibility considerations."
        ),
        temperature=0.6,
        max_tokens=900,
    ),
    "cinematic-reels": CategoryConfig(
        slug="cinematic-reels",
        name="Cinematic Reels",
        system_prompt=(
            "You are a cinematographer and video prompt expert. Transform the user's "
            "concept into professional video generation prompts for Runway, Kling, Sora, "
            "and Pika. Include: camera movement, lighting, color grade, pacing, "
            "aesthetic references, and shot composition."
        ),
        temperature=0.8,
        max_tokens=1200,
        model_override="anthropic/claude-sonnet-4-20250514",
    ),
}

def get_category(slug: str) -> CategoryConfig:
    return CATEGORIES.get(slug, CATEGORIES["image-generation"])
