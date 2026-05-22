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
    category: str = Field(..., description="Category slug from constants")
    user_id: str
    user_plan: UserPlan = UserPlan.FREE
    has_image: bool = False
    image_metadata: dict[str, Any] | None = None
    fresh: bool = False  # bypass cache


class ToolVariants(BaseModel):
    midjourney: str | None = None
    dalle: str | None = None
    stable_diffusion: str | None = None
    runway: str | None = None
    kling: str | None = None


class GenerateResponse(BaseModel):
    prompt_id: str
    generated_prompt: str
    tool_variants: ToolVariants
    metadata: dict[str, Any]
    model_used: str
    cached: bool = False
    quality_score: float | None = None
