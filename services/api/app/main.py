from contextlib import asynccontextmanager

from fastapi import FastAPI

from hrip_shared.db import wait_for_db

from .routes.analytics import router as analytics_router
from .routes.health import router as health_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await wait_for_db()
    yield


app = FastAPI(title="hrip-api", lifespan=lifespan)
app.include_router(health_router)
app.include_router(analytics_router)
