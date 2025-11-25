from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def run_migrations():
    """
    Run pending column migrations.
    Uses ADD COLUMN IF NOT EXISTS for idempotency.
    """
    migrations = [
        # Fit analysis columns (Phase 3)
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_analysis_score FLOAT NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_analysis_label VARCHAR(255) NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_analysis_should_apply VARCHAR(10) NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_analysis_recommendation TEXT NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_analysis_data TEXT NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS fit_analysis_date TIMESTAMP WITH TIME ZONE NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS tailoring_plan TEXT NULL",
        "ALTER TABLE applications ADD COLUMN IF NOT EXISTS tailoring_plan_date TIMESTAMP WITH TIME ZONE NULL",
    ]

    with engine.connect() as conn:
        for migration in migrations:
            try:
                conn.execute(text(migration))
                conn.commit()
            except Exception as e:
                # Column might already exist or other non-critical error
                logger.debug(f"Migration note: {e}")
                conn.rollback()

    logger.info(f"Ran {len(migrations)} migration checks")
