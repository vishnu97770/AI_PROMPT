import re
from dataclasses import dataclass


INJECTION_PATTERNS = [
    r"ignore\s+(all\s+|previous\s+|prior\s+)?instructions",
    r"you\s+are\s+now",
    r"jailbreak|DAN\s+mode",
    r"system\s+prompt|<\|im_start\|>",
    r"forget\s+(everything|all|your|previous)",
    r"new\s+persona|act\s+as\s+if",
]

COMPILED = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]


@dataclass
class SanitizationResult:
    blocked: bool
    reason: str | None = None


async def sanitize_input(user_input: str) -> SanitizationResult:
    for pattern in COMPILED:
        if pattern.search(user_input):
            return SanitizationResult(blocked=True, reason="prompt_injection")

    if len(user_input) > 200:
        # Placeholder for LLM-based classifier on complex inputs
        pass

    return SanitizationResult(blocked=False)
