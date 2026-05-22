from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routers import generate, health
from engines.model_router import init_circuit_breakers


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_circuit_breakers()
    yield


app = FastAPI(
    title="PromptCraft AI Service",
    version="0.1.0",
    description="AI inference engine for PromptCraft",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
