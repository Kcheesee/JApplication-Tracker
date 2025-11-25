from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db, run_migrations
from app.routes import auth, applications, sync, settings, llm, oauth, cron, analyzer
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Get settings (will validate on startup)
app_settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="Job Application Tracker API",
    description="API for managing job applications with AI-powered parsing",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS - more restrictive settings
# Note: Remove "chrome-extension://*" wildcard - specify exact extension IDs if needed
allowed_origins = [
    app_settings.FRONTEND_URL,
]

# Add localhost for development
if app_settings.ENVIRONMENT == "development":
    allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ])
    logger.warning("Running in development mode with relaxed CORS settings")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # Required for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicit methods
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(sync.router)
app.include_router(settings.router)
app.include_router(llm.router)
app.include_router(oauth.router)
app.include_router(cron.router)
app.include_router(analyzer.router)  # Job Fit Analyzer



@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    logger.info("="*60)
    logger.info("Job Application Tracker API Starting")
    logger.info(f"Version: 2.0.0")
    logger.info(f"Environment: {app_settings.ENVIRONMENT}")
    logger.info(f"Frontend URL: {app_settings.FRONTEND_URL}")
    logger.info("="*60)

    try:
        init_db()
        logger.info("Database tables initialized")
        run_migrations()
        logger.info("Database migrations complete")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
        raise


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
