import logging
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str


@router.get("/", response_model=HealthResponse)
async def health_check():
    logger.debug("Health check requested")
    return HealthResponse(status="ok", version="1.0.0")
