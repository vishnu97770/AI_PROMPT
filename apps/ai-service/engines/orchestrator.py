import json
import logging
import uuid
from typing import AsyncGenerator

from models.schemas import GenerateRequest, GenerateResponse, ToolVariants
from models.categories import get_category
from engines.safety_filter import SafetyFilter
from engines.model_router import ModelRouter, ModelConfig, record_failure, record_success
from engines.template_engine import TemplateEngine

logger = logging.getLogger(__name__)

# ── Output section headers ────────────────────────────────────────────────────

_SECTION_HEADERS = [
    "MAIN PROMPT",
    "NEGATIVE PROMPT",
    "MIDJOURNEY VERSION",
    "DALLE VERSION",
    "STABLE DIFFUSION VERSION",
    "METADATA",
]

# ── Orchestrator ──────────────────────────────────────────────────────────────

class PromptOrchestrator:
    """
    End-to-end pipeline:
      safety → routing → message build → LLM stream → parse → yield result
    """

    def __init__(self) -> None:
        self.safety_filter = SafetyFilter()
        self.model_router = ModelRouter()
        self.template_engine = TemplateEngine()
        logger.info("PromptOrchestrator initialized")

    # ── Public API ─────────────────────────────────────────────────────────────

    async def generate_stream(
        self, request: GenerateRequest
    ) -> AsyncGenerator[str, None]:
        """
        Yields SSE-compatible JSON strings:
          {"event": "start", "model": "openai/gpt-4o-mini"}
          {"token": "word"} ...
          {"done": true, "result": {...}}
          {"error": "message"} on failure
        """

        # ── Stage 1: Safety filter ─────────────────────────────────────────
        logger.info("Pipeline start — user_id=%s category=%s", request.user_id, request.category_slug)
        safety = await self.safety_filter.check(request.user_input)
        if not safety.is_safe:
            logger.warning("Input blocked: %s", safety.reason)
            yield json.dumps({"error": f"Input blocked: {safety.reason}"})
            return

        # ── Stage 2: Model routing ─────────────────────────────────────────
        complexity = self.model_router.score_complexity(request.user_input)
        model_config = self.model_router.select_model(
            request.category_slug,
            request.user_plan,
            complexity,
            request.has_image,
        )
        model_label = f"{model_config.provider}/{model_config.model}"
        yield json.dumps({"event": "start", "model": model_label})

        # ── Stage 3: Build messages ────────────────────────────────────────
        messages = self.build_messages(request, model_config)
        logger.debug("Messages built (%d messages)", len(messages))

        # ── Stage 4: Stream tokens ─────────────────────────────────────────
        token_buffer: list[str] = []
        try:
            async for token_json in self._stream_from_provider(model_config, messages):
                data = json.loads(token_json)
                token = data.get("token", "")
                if token:
                    token_buffer.append(token)
                yield token_json
            record_success(model_config.provider)
        except Exception as exc:
            record_failure(model_config.provider)
            logger.error("Streaming failed (%s): %s", model_label, exc, exc_info=True)
            # Fallback to template
            fallback_text = self.template_engine.generate_fallback(
                request.category_slug, request.user_input
            )
            yield json.dumps({"token": fallback_text})
            token_buffer = [fallback_text]

        # ── Stage 5: Parse + emit final result ────────────────────────────
        full_text = "".join(token_buffer)
        response = self._parse_response(full_text, request, model_label)
        logger.info("Pipeline complete — prompt_id=%s model=%s", response.prompt_id, model_label)
        yield json.dumps({"done": True, "result": response.model_dump()})

    async def generate(self, request: GenerateRequest) -> GenerateResponse:
        """Non-streaming version — collects the full stream and returns the final response."""
        final: GenerateResponse | None = None
        async for chunk_json in self.generate_stream(request):
            data = json.loads(chunk_json)
            if data.get("done"):
                final = GenerateResponse(**data["result"])
            if data.get("error"):
                raise ValueError(data["error"])
        if final is None:
            raise RuntimeError("Stream ended without a result")
        return final

    # ── Message builder ────────────────────────────────────────────────────────

    def build_messages(
        self, request: GenerateRequest, model_config: ModelConfig
    ) -> list[dict]:
        """
        Assemble the messages list for the chosen provider.
        The system prompt comes from categories.py; the user message
        asks for a structured multi-section output.
        """
        cat = get_category(request.category_slug)

        user_content = (
            f"Convert this into a professional AI prompt:\n{request.user_input}\n\n"
            "Output EXACTLY in this format (fill each section thoroughly):\n\n"
            "MAIN PROMPT: [detailed, optimized prompt — incorporate lighting, mood, "
            "technical parameters, and context the user didn't specify]\n\n"
            "NEGATIVE PROMPT: [things to explicitly avoid for the best result]\n\n"
            "MIDJOURNEY VERSION: [formatted for Midjourney v6.1 with --ar --stylize --q parameters]\n\n"
            "DALLE VERSION: [natural language version optimised for DALL-E 3]\n\n"
            "STABLE DIFFUSION VERSION: [comma-separated quality tags for SDXL]\n\n"
            "METADATA: lighting=[value], mood=[value], camera=[value], style=[value]"
        )

        return [
            {"role": "system", "content": cat.system_prompt},
            {"role": "user",   "content": user_content},
        ]

    # ── Provider streaming methods ─────────────────────────────────────────────

    async def _stream_from_provider(
        self, config: ModelConfig, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        if config.provider == "openai":
            async for chunk in self.stream_openai(config, messages):
                yield chunk
        elif config.provider == "anthropic":
            async for chunk in self.stream_anthropic(config, messages):
                yield chunk
        elif config.provider == "groq":
            async for chunk in self.stream_groq(config, messages):
                yield chunk
        else:
            raise ValueError(f"Unknown provider: {config.provider}")

    async def stream_openai(
        self, config: ModelConfig, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from OpenAI (GPT-4o / GPT-4o-mini)."""
        from openai import AsyncOpenAI
        import os
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        logger.debug("Streaming from openai/%s", config.model)

        stream = await client.chat.completions.create(
            model=config.model,
            messages=messages,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            stream=True,
        )
        async for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield json.dumps({"token": token})

    async def stream_anthropic(
        self, config: ModelConfig, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from Anthropic (Claude Sonnet)."""
        from anthropic import AsyncAnthropic
        import os
        client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        logger.debug("Streaming from anthropic/%s", config.model)

        # Anthropic keeps system prompt separate
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_messages = [m for m in messages if m["role"] != "system"]

        async with client.messages.stream(
            model=config.model,
            system=system,
            messages=user_messages,
            max_tokens=config.max_tokens,
        ) as stream:
            async for text in stream.text_stream:
                if text:
                    yield json.dumps({"token": text})

    async def stream_groq(
        self, config: ModelConfig, messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        """Stream tokens from Groq (Llama 3.1 70B)."""
        from groq import AsyncGroq
        import os
        client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        logger.debug("Streaming from groq/%s", config.model)

        stream = await client.chat.completions.create(
            model=config.model,
            messages=messages,
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            stream=True,
        )
        async for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if token:
                yield json.dumps({"token": token})

    # ── Response parser ────────────────────────────────────────────────────────

    @staticmethod
    def _parse_response(
        full_text: str, request: GenerateRequest, model_used: str
    ) -> GenerateResponse:
        """
        Parse the structured LLM output into a GenerateResponse.
        Gracefully falls back to the raw text if parsing fails.
        """
        sections: dict[str, str] = {}
        current_key: str | None = None
        current_lines: list[str] = []

        for line in full_text.splitlines():
            matched = False
            for header in _SECTION_HEADERS:
                if line.strip().upper().startswith(header + ":"):
                    if current_key:
                        sections[current_key] = " ".join(current_lines).strip()
                    current_key = header
                    current_lines = [line[len(header) + 1:].strip()]
                    matched = True
                    break
            if not matched and current_key:
                current_lines.append(line.strip())

        if current_key:
            sections[current_key] = " ".join(current_lines).strip()

        # Parse METADATA k=v pairs
        metadata: dict[str, str] = {"category": request.category_slug}
        meta_str = sections.get("METADATA", "")
        for item in meta_str.split(","):
            item = item.strip()
            if "=" in item:
                k, v = item.split("=", 1)
                metadata[k.strip().lower()] = v.strip()

        main_prompt = sections.get("MAIN PROMPT") or full_text

        # Clean up N/A values
        def clean(val: str | None) -> str | None:
            if val and val.upper() not in {"N/A", "NA", "NONE", "-"}:
                return val
            return None

        return GenerateResponse(
            prompt_id=str(uuid.uuid4()),
            generated_prompt=main_prompt,
            negative_prompt=clean(sections.get("NEGATIVE PROMPT")),
            tool_variants=ToolVariants(
                midjourney=clean(sections.get("MIDJOURNEY VERSION")),
                dalle=clean(sections.get("DALLE VERSION")),
                stable_diffusion=clean(sections.get("STABLE DIFFUSION VERSION")),
            ),
            metadata=metadata,
            model_used=model_used,
        )
