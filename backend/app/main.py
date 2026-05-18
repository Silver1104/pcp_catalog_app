import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_cors_origins, settings
from app.database import Base, engine
from app.migrate import run_migrations
from app.routers import admin, products
from app.routers import settings as site_settings_router
from app.storage.r2 import is_r2_configured

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations()
    if is_r2_configured():
        logger.info("R2 uploads enabled (bucket=%s)", settings.r2_bucket_name)
    else:
        logger.warning(
            "R2 uploads disabled. Fill R2_* in backend/.env (save the file), then restart the API."
        )
    yield


app = FastAPI(title="Tile Catalog API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(site_settings_router.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}