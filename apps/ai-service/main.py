import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import generate, health

# Load .env before anything else touches os.getenv
load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Service ready — version 1.0.0")
    logger.info(
        "Providers configured — OpenAI: %s | Anthropic: %s | Groq: %s",
        "✓" if os.getenv("OPENAI_API_KEY") else "✗ (missing)",
        "✓" if os.getenv("ANTHROPIC_API_KEY") else "✗ (missing)",
        "✓" if os.getenv("GROQ_API_KEY") else "✗ (missing)",
    )
    yield
    logger.info("AI Service shutting down")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="PromptCraft AI Service",
    version="1.0.0",
    description="AI inference engine — safety filter → model routing → LLM streaming",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────

_extra_origins = (
    os.getenv("ALLOWED_ORIGINS", "").split(",")
    if os.getenv("ALLOWED_ORIGINS")
    else []
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", *_extra_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ───────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method, request.url.path, exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"error": str(exc) or "Internal server error"},
    )

# ── Routers ────────────────────────────────────────────────────────────────────

app.include_router(health.router,   prefix="/health",   tags=["health"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])

# ── Dev entrypoint ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
