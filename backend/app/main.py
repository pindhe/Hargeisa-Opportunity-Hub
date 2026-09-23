import logging
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import BASE_DIR, settings
from app.database import Base, SessionLocal, engine
from app.routers import account, admin, ai, auth, catalog
from app.seed import seed_if_empty
from app.services.deadlines import run_deadline_checks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hoh")
UPLOAD_DIR = BASE_DIR / "uploads"


def _deadline_loop() -> None:
    while True:
        time.sleep(1800)
        db = SessionLocal()
        try:
            created = run_deadline_checks(db)
            if created:
                logger.info("Created %s deadline reminders", created)
        except Exception:
            logger.exception("Deadline check failed")
            db.rollback()
        finally:
            db.close()


@asynccontextmanager
async def lifespan(_: FastAPI):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
        run_deadline_checks(db)
    finally:
        db.close()
    threading.Thread(target=_deadline_loop, daemon=True).start()
    yield


UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app = FastAPI(title="HOH API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(account.router)
app.include_router(ai.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"name": "HOH API", "docs": "/docs"}
