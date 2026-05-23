import logging
import re
from dataclasses import dataclass

from models.schemas import UserPlan
from models.categories import get_category

logger = logging.getLogger(__name__)

# ── Dataclass ──────────────────────────────────────────────────────────────────

@dataclass
class ModelConfig:
    provider: str    # "openai" | "anthropic" | "groq"
    model: str
    max_tokens: int
    temperature: float = 0.75


# ── Circuit breaker ────────────────────────────────────────────────────────────
# Simple consecutive-failure counter; a provider is skipped after 3 failures.

_FAILURE_THRESHOLD = 3
_circuit_state: dict[str, int] = {}


def _is_open(provider: str) -> bool:
    return _circuit_state.get(provider, 0) >= _FAILURE_THRESHOLD


def record_failure(provider: str) -> None:
    _circuit_state[provider] = _circuit_state.get(provider, 0) + 1
    if _circuit_state[provider] >= _FAILURE_THRESHOLD:
        logger.warning("Circuit breaker OPEN for provider: %s", provider)


def record_success(provider: str) -> None:
    if _circuit_state.get(provider, 0) > 0:
        _circuit_state[provider] = 0
        logger.info("Circuit breaker RESET for provider: %s", provider)


# ── Technical word list ────────────────────────────────────────────────────────

_TECHNICAL_TERMS = frozenset({
    "api", "algorithm", "neural", "machine learning", "deep learning",
    "database", "optimization", "architecture", "pipeline", "inference",
    "rendering", "shader", "topology", "recursive", "asynchronous",
    "concurrent", "distributed", "microservice", "transformer", "embedding",
    "vector", "semantic", "photorealistic", "compositing", "interpolation",
    "procedural", "generative", "adversarial", "diffusion", "latent",
})

_AMBIGUITY_WORDS = frozenset({
    "something", "anything", "maybe", "perhaps", "kind of", "sort of",
    "like", "basically", "you know", "whatever", "somehow",
})

# Words that suggest multi-part or complex requests
_COMPLEXITY_CONNECTORS = re.compile(
    r"\b(and also|furthermore|additionally|as well as|plus|not only|but also)\b",
    re.IGNORECASE,
)

# Visual/creative categories that should never route to the cheapest model
_CREATIVE_CATEGORIES = frozenset({
    "cinematic-reels",
    "video-editing",
    "ai-image-generation",
    "video-ai-tools",
    "midjourney-specific",
})


# ── ModelRouter class ──────────────────────────────────────────────────────────

class ModelRouter:
    """Routes generation requests to the most cost-effective capable model."""

    def score_complexity(self, text: str) -> int:
        """
        Returns an integer 1–10 representing prompt complexity.

        Factors: length, question marks (ambiguity), technical vocabulary,
        ambiguity hedging words, and multi-part connectors.
        """
        score = 1
        words = text.split()
        word_count = len(words)
        text_lower = text.lower()

        # Length component (0-4 points)
        if word_count >= 5:
            score += 1
        if word_count >= 15:
            score += 1
        if word_count >= 30:
            score += 1
        if word_count >= 60:
            score += 1

        # Question marks signal underspecified intent (+1)
        if text.count("?") >= 1:
            score += 1

        # Technical terminology (+1 to +2)
        tech_count = sum(1 for term in _TECHNICAL_TERMS if term in text_lower)
        if tech_count >= 1:
            score += 1
        if tech_count >= 3:
            score += 1

        # Ambiguity hedges (+1)
        if any(word in text_lower for word in _AMBIGUITY_WORDS):
            score += 1

        # Multi-part connectors (+1)
        if _COMPLEXITY_CONNECTORS.search(text):
            score += 1

        result = min(10, max(1, score))
        logger.debug("Complexity score for input (%d words): %d", word_count, result)
        return result

    def select_model(
        self,
        category: str,
        user_plan: UserPlan,
        complexity: int,
        has_image: bool,
    ) -> ModelConfig:
        """
        Select the cheapest model that can handle the request.

        Priority order: image vision → category override → plan+complexity rules.
        Falls back to next available provider if circuit breaker is open.
        """
        logger.info(
            "Routing: category=%s plan=%s complexity=%d has_image=%s",
            category, user_plan.value, complexity, has_image,
        )

        # Boost complexity for creative/visual categories
        if category in _CREATIVE_CATEGORIES:
            complexity = max(complexity, 6)
            logger.debug("Complexity boosted to %d for creative category '%s'", complexity, category)

        # Category model override (set in CategoryConfig)
        cat_config = get_category(category)
        if cat_config.model_override:
            provider, model = cat_config.model_override.split("/", 1)
            config = ModelConfig(
                provider=provider,
                model=model,
                max_tokens=cat_config.max_tokens,
                temperature=cat_config.temperature,
            )
            logger.info("Category override → %s/%s", provider, model)
            return config

        # Image vision: requires GPT-4o
        if has_image:
            config = ModelConfig("openai", "gpt-4o", max_tokens=800, temperature=0.7)
            logger.info("Vision request → openai/gpt-4o")
            return config

        # Complexity + plan routing
        candidates = self._build_candidate_list(user_plan, complexity)
        for config in candidates:
            if not _is_open(config.provider):
                logger.info("Selected → %s/%s", config.provider, config.model)
                return config
            logger.warning("Circuit breaker open for '%s', trying next", config.provider)

        # All breakers open — reset and return Groq as last resort
        logger.error("All circuit breakers open — forcing Groq fallback")
        _circuit_state.clear()
        return ModelConfig("groq", "llama-3.1-70b-versatile", max_tokens=600, temperature=0.7)

    @staticmethod
    def _build_candidate_list(user_plan: UserPlan, complexity: int) -> list[ModelConfig]:
        """Return ordered candidate configs from cheapest to most capable."""
        if user_plan == UserPlan.FREE and complexity <= 3:
            return [
                ModelConfig("groq", "llama-3.1-70b-versatile", max_tokens=600, temperature=0.7),
                ModelConfig("openai", "gpt-4o-mini", max_tokens=800, temperature=0.7),
            ]
        if complexity <= 6:
            return [
                ModelConfig("openai", "gpt-4o-mini", max_tokens=800, temperature=0.72),
                ModelConfig("groq", "llama-3.1-70b-versatile", max_tokens=800, temperature=0.7),
                ModelConfig("anthropic", "claude-sonnet-4-20250514", max_tokens=1200, temperature=0.75),
            ]
        # complexity > 6 — use premium model
        return [
            ModelConfig("anthropic", "claude-sonnet-4-20250514", max_tokens=1200, temperature=0.75),
            ModelConfig("openai", "gpt-4o-mini", max_tokens=1000, temperature=0.72),
        ]
