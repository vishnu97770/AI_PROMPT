from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
import os

from models.schemas import GenerateRequest, GenerateResponse
from engines.orchestrator import run_pipeline

router = APIRouter()


def verify_secret(x_service_secret: str | None):
    secret = os.getenv("SERVICE_SECRET")
    if secret and x_service_secret != secret:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/", response_model=GenerateResponse)
async def generate_prompt(
    request: GenerateRequest,
    x_service_secret: str | None = Header(default=None),
):
    verify_secret(x_service_secret)
    result = await run_pipeline(request)
    return result


@router.post("/stream")
async def generate_prompt_stream(
    request: GenerateRequest,
    x_service_secret: str | None = Header(default=None),
):
    verify_secret(x_service_secret)

    async def event_generator():
        async for chunk in run_pipeline(request, stream=True):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
