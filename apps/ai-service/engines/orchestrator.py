import uuid
import json
from typing import AsyncIterator

from models.schemas import GenerateRequest, GenerateResponse, ToolVariants
from models.categories import get_category
from engines.safety_filter import sanitize_input
from engines.model_router import compute_routing_decision
from engines.template_engine import build_messages


async def run_pipeline(
    request: GenerateRequest,
    stream: bool = False,
) -> GenerateResponse | AsyncIterator[str]:
    # Stage 1: Safety filter
    safety = await sanitize_input(request.user_input)
    if safety.blocked:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Input blocked: {safety.reason}")

    # Stage 2: Model routing
    category_config = get_category(request.category)
    model_config = compute_routing_decision(
        request.user_input,
        request.category,
        request.user_plan,
        request.has_image,
    )

    # Stage 3: Build messages
    messages = build_messages(request.user_input, category_config)

    # Stage 4: LLM call
    generated_prompt = await _call_llm(model_config, messages, stream=stream)

    if stream:
        return generated_prompt  # AsyncIterator

    # Stage 5: Build response
    return GenerateResponse(
        prompt_id=str(uuid.uuid4()),
        generated_prompt=generated_prompt,
        tool_variants=ToolVariants(),
        metadata={
            "category": request.category,
            "complexity": len(request.user_input.split()),
        },
        model_used=f"{model_config.provider}/{model_config.model}",
        cached=False,
    )


async def _call_llm(model_config, messages: list[dict], stream: bool = False):
    provider = model_config.provider

    if provider == "openai":
        from openai import AsyncOpenAI
        client = AsyncOpenAI()
        if stream:
            return _openai_stream(client, model_config, messages)
        resp = await client.chat.completions.create(
            model=model_config.model,
            messages=messages,
            max_tokens=model_config.max_tokens,
            temperature=model_config.temperature,
        )
        return resp.choices[0].message.content or ""

    elif provider == "anthropic":
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic()
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        user_msgs = [m for m in messages if m["role"] != "system"]
        resp = await client.messages.create(
            model=model_config.model,
            system=system,
            messages=user_msgs,
            max_tokens=model_config.max_tokens,
        )
        return resp.content[0].text

    elif provider == "groq":
        from groq import AsyncGroq
        client = AsyncGroq()
        resp = await client.chat.completions.create(
            model=model_config.model,
            messages=messages,
            max_tokens=model_config.max_tokens,
            temperature=model_config.temperature,
        )
        return resp.choices[0].message.content or ""

    raise ValueError(f"Unknown provider: {provider}")


async def _openai_stream(client, model_config, messages):
    stream = await client.chat.completions.create(
        model=model_config.model,
        messages=messages,
        max_tokens=model_config.max_tokens,
        temperature=model_config.temperature,
        stream=True,
    )
    async for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield json.dumps({"token": token})
