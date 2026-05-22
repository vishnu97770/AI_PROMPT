from dataclasses import dataclass
from models.schemas import UserPlan
from models.categories import get_category


@dataclass
class ModelConfig:
    provider: str
    model: str
    max_tokens: int
    temperature: float = 0.7


_circuit_breakers: dict[str, int] = {}


def init_circuit_breakers():
    global _circuit_breakers
    _circuit_breakers = {"openai": 0, "anthropic": 0, "groq": 0}


def score_complexity(user_input: str) -> int:
    words = len(user_input.split())
    if words < 10:
        return 2
    if words < 30:
        return 5
    return 8


def compute_routing_decision(
    user_input: str,
    category: str,
    user_plan: UserPlan,
    has_image: bool,
) -> ModelConfig:
    category_config = get_category(category)
    complexity = score_complexity(user_input)

    budget_map = {
        UserPlan.FREE: 0.005,
        UserPlan.PRO: 0.05,
        UserPlan.CREATOR: 0.50,
        UserPlan.ENTERPRISE: 0.50,
    }
    budget = budget_map[user_plan]

    cinematic_categories = {"cinematic-reels", "image-generation", "video-ai", "video-editing"}
    if category in cinematic_categories:
        complexity = max(complexity, 6)

    if category_config.model_override:
        provider, model = category_config.model_override.split("/", 1)
        return ModelConfig(
            provider=provider,
            model=model,
            max_tokens=category_config.max_tokens,
            temperature=category_config.temperature,
        )

    if has_image:
        return ModelConfig("openai", "gpt-4o", max_tokens=800)

    if complexity <= 3 and budget <= 0.005:
        return ModelConfig("groq", "llama-3.1-70b-versatile", max_tokens=600)
    elif complexity <= 6:
        return ModelConfig("openai", "gpt-4o-mini", max_tokens=800)
    else:
        return ModelConfig("anthropic", "claude-sonnet-4-20250514", max_tokens=1200)
