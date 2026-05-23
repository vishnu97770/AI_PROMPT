from pydantic import BaseModel, Field
from typing import Any
from enum import Enum


class UserPlan(str, Enum):
    FREE = "free"
    PRO = "pro"
    CREATOR = "creator"
    ENTERPRISE = "enterprise"


class GenerateRequest(BaseModel):
    user_input: str = Field(..., min_length=3, max_length=2000)
    category_slug: str = Field(..., description="Category slug, e.g. 'ai-image-generation'")
    user_id: str
    user_plan: UserPlan = UserPlan.FREE
    has_image: bool = False
    image_metadata: dict[str, Any] | None = None
    fresh: bool = False  # bypass semantic cache


class ToolVariants(BaseModel):
    midjourney: str | None = None
    dalle: str | None = None
    stable_diffusion: str | None = None
    runway: str | None = None
    kling: str | None = None


class GenerateResponse(BaseModel):
    prompt_id: str
    generated_prompt: str
    negative_prompt: str | None = None
    tool_variants: ToolVariants = Field(default_factory=ToolVariants)
    metadata: dict[str, Any] = Field(default_factory=dict)
    model_used: str
    cached: bool = False
    quality_score: float | None = None
