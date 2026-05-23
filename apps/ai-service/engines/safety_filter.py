import re
import os
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SafetyResult:
    is_safe: bool
    reason: str = ""


class SafetyFilter:
    """
    Two-layer safety filter:
      Layer 1 — fast regex check for known injection patterns.
      Layer 2 — OpenAI Moderation API for inputs > 200 characters
                (skipped when OPENAI_API_KEY is not set).
    """

    INJECTION_PATTERNS: list[str] = [
        # Instruction override
        r"ignore\s+(all\s+|any\s+|previous\s+|prior\s+|your\s+)?instructions?",
        r"disregard\s+(all\s+|any\s+|previous\s+|your\s+)?instructions?",
        r"forget\s+(everything|all|your|previous|prior|the above)",
        # Role / persona hijacking
        r"you\s+are\s+now\s+(a\s+|an\s+)?(?!prompted|called)",  # "you are now a hacker"
        r"act\s+as\s+(if\s+you\s+are|though\s+you\s+are|a\s+|an\s+)",
        r"new\s+persona|switch\s+persona|change\s+your\s+persona",
        r"pretend\s+(you\s+are|to\s+be|that\s+you)",
        # Jailbreak patterns
        r"\bDAN\s+mode\b|\bdo\s+anything\s+now\b",
        r"\bjailbreak\b|\bunfiltered\b|\bunrestricted\s+mode\b",
        r"developer\s+mode\s+enabled|enable\s+developer\s+mode",
        # System prompt extraction / injection
        r"(print|show|reveal|repeat|output)\s+(your\s+)?(system\s+prompt|instructions)",
        r"<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]",
        r"---END\s+OF\s+PROMPT---|###\s*SYSTEM",
        # Override / bypass
        r"bypass\s+(safety|filter|guardrail|restriction|moderation)",
        r"override\s+(safety|filter|restriction|system)",
    ]

    def __init__(self) -> None:
        self._compiled = [
            re.compile(p, re.IGNORECASE) for p in self.INJECTION_PATTERNS
        ]
        self._openai_key = os.getenv("OPENAI_API_KEY")
        logger.info(
            "SafetyFilter initialized with %d patterns, moderation API: %s",
            len(self._compiled),
            "enabled" if self._openai_key else "disabled (no OPENAI_API_KEY)",
        )

    async def check(self, text: str) -> SafetyResult:
        """
        Run both safety layers and return a SafetyResult.
        Fails open (allows) if the moderation API is unavailable.
        """
        # Layer 1: regex — fast, always runs
        result = self._regex_check(text)
        if not result.is_safe:
            logger.warning("Safety Layer 1 blocked input: %s", result.reason)
            return result

        # Layer 2: OpenAI Moderation API — only for longer inputs
        if len(text) > 200 and self._openai_key:
            result = await self._moderation_check(text)
            if not result.is_safe:
                logger.warning("Safety Layer 2 blocked input: %s", result.reason)
                return result

        logger.debug("Input passed safety check (len=%d)", len(text))
        return SafetyResult(is_safe=True)

    def _regex_check(self, text: str) -> SafetyResult:
        for pattern in self._compiled:
            if pattern.search(text):
                matched = pattern.pattern[:40]
                return SafetyResult(
                    is_safe=False,
                    reason=f"prompt_injection_detected (pattern: {matched}...)",
                )
        return SafetyResult(is_safe=True)

    async def _moderation_check(self, text: str) -> SafetyResult:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self._openai_key)
            response = await client.moderations.create(input=text)
            result = response.results[0]
            if result.flagged:
                # Find which categories were flagged
                flagged_cats = [
                    cat for cat, flagged in result.categories.model_dump().items()
                    if flagged
                ]
                reason = "content_policy_violation: " + ", ".join(flagged_cats)
                return SafetyResult(is_safe=False, reason=reason)
            return SafetyResult(is_safe=True)
        except Exception as exc:
            # Fail open — never block a user because the moderation API is down
            logger.warning("Moderation API error (failing open): %s", exc)
            return SafetyResult(is_safe=True)
