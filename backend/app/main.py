import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, jobs, public, candidates, pipeline, assessments, interviews, dashboard, emails

# Auto-create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TalentIQ — Intelligent AI Recruitment & ATS Automation Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for resume downloads
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(jobs.router, prefix=api_prefix)
app.include_router(public.router, prefix=api_prefix)
app.include_router(candidates.router, prefix=api_prefix)
app.include_router(pipeline.router, prefix=api_prefix)
app.include_router(assessments.router, prefix=api_prefix)
app.include_router(interviews.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(emails.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "status": "online",
        "platform": "TalentIQ Enterprise API",
        "docs": "/docs",
        "version": settings.VERSION
    }
