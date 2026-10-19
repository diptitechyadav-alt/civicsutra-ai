import sys
from pathlib import Path

# Add backend and backend/app to sys.path so imports resolve cleanly
BASE_DIR = Path(__file__).resolve().parent.parent
APP_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(APP_DIR) not in sys.path:
    sys.path.insert(0, str(APP_DIR))

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

from core.config import settings
from database.db import init_db

# Routers
from api.auth_routes import router as auth_router
from api.report_routes import router as report_router
from api.duplicate_routes import router as duplicate_router
from api.cluster_routes import router as cluster_router
from api.analytics_routes import router as analytics_router
from api.audit_routes import router as audit_router
from api.notification_routes import router as notification_router
from api.feedback_routes import router as feedback_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema and seed data are initialized
    init_db(force_reset=False)
    yield

app = FastAPI(
    title="CivicSutra AI — API Documentation",
    description=(
        "AI-Powered Local Problem Intelligence & Response Platform. "
        "Transforms scattered civic grievances into connected, location-aware intelligence "
        "with spatial-semantic duplicate detection, issue clustering, and transparent priority scoring."
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - compliant with credentialed fetch specifications
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads
from fastapi.staticfiles import StaticFiles
uploads_path = BASE_DIR / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# Mount Routers
app.include_router(auth_router)
app.include_router(report_router)
app.include_router(duplicate_router)
app.include_router(cluster_router)
app.include_router(analytics_router)
app.include_router(audit_router)
app.include_router(notification_router)
app.include_router(feedback_router)

@app.get("/api/health", tags=["Health & Status"])
def health_check():
    return {
        "status": "healthy",
        "platform": "CivicSutra AI",
        "framework": "FastAPI",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "ai_provider": settings.ai_provider,
        "database": "SQLite / PostgreSQL Ready"
    }

@app.post("/api/system/reset-demo", tags=["System Maintenance"])
def reset_demo_database():
    """Restores database to verified initial seed state."""
    init_db(force_reset=True)
    return {"success": True, "message": "Database reset to initial demo state."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
