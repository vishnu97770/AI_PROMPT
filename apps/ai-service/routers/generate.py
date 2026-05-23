import logging
import os
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse

from models.schemas import GenerateRequest, GenerateResponse
from engines.orchestrator import PromptOrchestrator

logger = logging.getLogger(__name__)
router = APIRouter()

# Single shared orchestrator instance per process
_orchestrator = PromptOrchestrator()


def _verify_secret(x_service_secret: str | None) -> None:
    """Optional shared-secret auth between Next.js and this service."""
    secret = os.getenv("SERVICE_SECRET")
    if secret and x_service_secret != secret:
        logger.warning("Rejected request with invalid service secret")
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/stream")
async def generate_stream(
    request: GenerateRequest,
    x_service_secret: str | None = Header(default=None),
):
    """
    SSE endpoint — streams tokens as they arrive from the LLM.

    Event format:
      data: {"event": "start", "model": "openai/gpt-4o-mini"}
      data: {"token": "word"}
      ...
      data: {"done": true, "result": {...GenerateResponse...}}
      data: [DONE]
    """
    _verify_secret(x_service_secret)
    logger.info(
        "Stream request: user=%s category=%s plan=%s",
        request.user_id, request.category_slug, request.user_plan.value,
    )

    async def event_generator():
        try:
            async for chunk_json in _orchestrator.generate_stream(request):
                yield f"data: {chunk_json}\n\n"
        except Exception as exc:
            logger.error("Unhandled error in stream: %s", exc, exc_info=True)
            import json
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/", response_model=GenerateResponse)
async def generate(
    request: GenerateRequest,
    x_service_secret: str | None = Header(default=None),
):
    """
    Non-streaming endpoint — waits for the full response before returning.
    Useful for testing and for clients that don't support SSE.
    """
    _verify_secret(x_service_secret)
    logger.info(
        "Non-stream request: user=%s category=%s",
        request.user_id, request.category_slug,
    )
    try:
        return await _orchestrator.generate(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Generation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Generation failed")
