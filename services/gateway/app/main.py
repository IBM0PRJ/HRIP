from contextlib import asynccontextmanager

from fastapi import FastAPI

from hrip_shared.db import init_db

from .routes.auth import router as auth_router
from .routes.health import router as health_router
from .routes.ingest import router as ingest_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(title="hrip-gateway", lifespan=lifespan)
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(ingest_router)

