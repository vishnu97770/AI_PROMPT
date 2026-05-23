import logging
from string import Template

logger = logging.getLogger(__name__)


class TemplateEngine:
    """
    Synchronous fallback templates used when LLM calls fail.
    Each template produces a usable (if basic) prompt without any API call.
    """

    FALLBACK_TEMPLATES: dict[str, str] = {
        "ai-image-generation": (
            "$input, highly detailed, professional photography, "
            "golden hour lighting, 8K resolution, cinematic composition, "
            "shallow depth of field, photorealistic, ArtStation trending"
        ),
        "photo-editing": (
            "Edit this photo: $input. "
            "Apply: natural color correction, enhance shadows and highlights, "
            "slight warmth in tones, reduce noise, sharpen details, "
            "professional portrait retouching style"
        ),
        "video-editing": (
            "Video scene: $input. "
            "Settings: 24fps cinematic, teal-orange color grade, "
            "smooth camera movement, professional lighting, "
            "clean cut editing, subtle motion blur"
        ),
        "cinematic-reels": (
            "Cinematic reel: $input. "
            "Style: golden hour lighting, rack focus, slow-motion moments, "
            "teal-orange color grade, rhythmic cuts synced to beat, "
            "9:16 vertical format, 30 seconds duration"
        ),
        "coding-projects": (
            "Implement the following feature: $input. "
            "Requirements: clean TypeScript, follow SOLID principles, "
            "include error handling, add JSDoc comments, write unit tests, "
            "follow existing project conventions"
        ),
        "ui-ux-design": (
            "Design component: $input. "
            "Specs: 8pt grid system, WCAG AA accessible, "
            "all interactive states (default/hover/focus/active/disabled), "
            "responsive (mobile-first), consistent with design system"
        ),
        "resume-creation": (
            "Resume section for: $input. "
            "Format: ATS-optimized, strong action verbs, "
            "quantified achievements (%, $, users), "
            "relevant keywords, concise professional tone"
        ),
        "presentation-gen": (
            "Presentation slide for: $input. "
            "Structure: clear headline, 3 supporting points, "
            "data visualization recommendation, "
            "executive summary format, one idea per slide"
        ),
        "startup-ideas": (
            "Startup concept: $input. "
            "Include: problem statement, proposed solution, "
            "target market, basic business model, "
            "key competitive advantage, MVP definition"
        ),
        "youtube-thumbnails": (
            "YouTube thumbnail for: $input. "
            "Design: bold text (3-4 words max), "
            "high-contrast colors, emotional face if applicable, "
            "1280x720px, curiosity-gap headline, clean background"
        ),
        "game-development": (
            "Game concept: $input. "
            "Include: core gameplay loop, target platform, "
            "art style direction, main mechanics, "
            "progression system, player motivation"
        ),
        "chatgpt-optimization": (
            "System prompt for: $input. "
            "You are an expert assistant specializing in this domain. "
            "Respond clearly and concisely. "
            "Ask clarifying questions when needed. "
            "Always provide actionable, specific guidance."
        ),
        "midjourney-specific": (
            "$input, ultra-detailed, photorealistic, "
            "professional lighting, high contrast, "
            "8K resolution, masterpiece quality "
            "--ar 16:9 --stylize 750 --q 2 --v 6.1"
        ),
        "video-ai-tools": (
            "Video generation: $input. "
            "Camera: slow push-in, stable movement. "
            "Lighting: natural, warm tones. "
            "Duration: 6 seconds, 24fps, 16:9 aspect ratio. "
            "Style: cinematic, photorealistic"
        ),
        "website-design": (
            "Website section: $input. "
            "Design: clean layout, clear visual hierarchy, "
            "primary CTA prominent, mobile-responsive, "
            "fast loading, conversion-optimized, "
            "trust signals included"
        ),
    }

    _DEFAULT_FALLBACK = (
        "Professional AI prompt for: $input. "
        "Create a detailed, optimized version with "
        "relevant technical parameters and quality descriptors."
    )

    def generate_fallback(self, category: str, user_input: str) -> str:
        """
        Return a simple template-filled fallback prompt.
        Never raises — always returns a usable string.
        """
        template_str = self.FALLBACK_TEMPLATES.get(category, self._DEFAULT_FALLBACK)
        try:
            result = Template(template_str).substitute(input=user_input)
            logger.info("Generated fallback for category '%s' (len=%d)", category, len(result))
            return result
        except Exception as exc:
            logger.error("Template substitution failed: %s", exc)
            return f"Professional prompt for: {user_input}"
