import sys
import os
from pathlib import Path

# Add parent directory to path for imports to work
backend_dir = Path(__file__).resolve().parent.parent
print(f"DEBUG: __file__ = {__file__}")
print(f"DEBUG: backend_dir = {backend_dir}")
print(f"DEBUG: backend_dir exists = {backend_dir.exists()}")
print(f"DEBUG: app dir path = {backend_dir / 'app'}")
print(f"DEBUG: app dir exists = {(backend_dir / 'app').exists()}")
print(f"DEBUG: Files in app dir: {list((backend_dir / 'app').iterdir()) if (backend_dir / 'app').exists() else 'N/A'}")
print(f"DEBUG: config.py exists = {(backend_dir / 'app' / 'config.py').exists()}")
print(f"DEBUG: __init__.py exists = {(backend_dir / 'app' / '__init__.py').exists()}")
print(f"DEBUG: sys.path before = {sys.path}")
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
print(f"DEBUG: sys.path after = {sys.path}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db
from app.routes import auth, applications, sync, settings, llm, oauth

# Get settings
app_settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Job Application Tracker API",
    description="API for managing job applications with AI-powered parsing",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[app_settings.FRONTEND_URL, "http://localhost:3000", "chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(sync.router)
app.include_router(settings.router)
app.include_router(llm.router)
app.include_router(oauth.router)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Job Application Tracker API",
        "version": "2.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if app_settings.ENVIRONMENT == "development" else False
    )
