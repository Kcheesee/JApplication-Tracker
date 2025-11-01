"""
Cron job endpoints for scheduled tasks
These endpoints should be called by external cron services (like Render Cron Jobs or cron-job.org)
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..models.user_settings import UserSettings
from ..models.application import Application
from ..services.gmail_service import GmailService
from ..services.llm_service import LLMService
from ..utils.api_key_helper import get_llm_api_key
from ..config import get_settings
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cron", tags=["Cron"])

# Secret token for cron job authentication
CRON_SECRET = os.getenv("CRON_SECRET", "change-me-in-production")


@router.post("/daily-gmail-sync")
async def daily_gmail_sync(
    x_cron_secret: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Daily Gmail sync for all users who have auto-sync enabled
    This endpoint should be called once per day by an external cron service

    Authentication: Requires X-Cron-Secret header matching CRON_SECRET env var
    """
    # Verify cron secret
    if x_cron_secret != CRON_SECRET:
        raise HTTPException(status_code=401, detail="Invalid cron secret")

    logger.info("Starting daily Gmail sync for all users...")

    # Get all users with auto-sync enabled
    users_with_autosync = db.query(User).join(UserSettings).filter(
        UserSettings.gmail_enabled == True,
        UserSettings.gmail_auto_sync_enabled == True,
        UserSettings.google_credentials != None,
        UserSettings.google_token != None
    ).all()

    logger.info(f"Found {len(users_with_autosync)} users with auto-sync enabled")

    results = []

    for user in users_with_autosync:
        try:
            result = await sync_user_gmail(user, db)
            results.append({
                "user_id": user.id,
                "username": user.username,
                "success": True,
                **result
            })
        except Exception as e:
            logger.error(f"Error syncing Gmail for user {user.id}: {str(e)}")
            results.append({
                "user_id": user.id,
                "username": user.username,
                "success": False,
                "error": str(e)
            })

    return {
        "success": True,
        "synced_users": len([r for r in results if r["success"]]),
        "failed_users": len([r for r in results if not r["success"]]),
        "results": results
    }


async def sync_user_gmail(user: User, db: Session):
    """Sync Gmail for a single user"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()

    if not settings:
        raise Exception("User settings not found")

    # Get LLM provider and API key
    llm_provider = settings.llm_provider or "anthropic"
    api_key = get_llm_api_key(settings, llm_provider)

    if not api_key:
        raise Exception(f"API key not configured for LLM provider: {llm_provider}")

    # Initialize services
    gmail_service = GmailService(
        credentials_dict=settings.google_credentials,
        token_dict=settings.google_token
    )
    llm_service = LLMService(
        provider=llm_provider,
        api_key=api_key,
        model=settings.llm_model
    )

    # Search for job emails
    keywords = settings.gmail_keywords or ["application", "interview", "position", "offer", "candidate"]
    emails = gmail_service.search_job_emails(
        keywords=keywords,
        days_back=settings.gmail_search_days,
        max_results=500
    )

    # Process emails
    new_count = 0
    updated_count = 0
    skipped_count = 0

    for email in emails:
        # Parse email
        job_data = llm_service.parse_job_email(
            email_body=email['body'],
            email_subject=email['subject'],
            email_date=email['date']
        )

        if not job_data or not job_data.get('company'):
            skipped_count += 1
            continue

        # Check if application already exists
        existing = db.query(Application).filter(
            Application.user_id == user.id,
            Application.email_id == email['id']
        ).first()

        if existing:
            # Update existing
            existing.status = job_data.get('status', existing.status)
            if job_data.get('notes'):
                existing.notes = f"{existing.notes}\n\n{job_data['notes']}" if existing.notes else job_data['notes']
            updated_count += 1
        else:
            # Create new
            new_application = Application(
                user_id=user.id,
                email_id=email['id'],
                company=job_data.get('company'),
                position=job_data.get('position'),
                status=job_data.get('status', 'Applied'),
                application_date=job_data.get('application_date'),
                application_source=job_data.get('application_source'),
                salary_min=job_data.get('salary_min'),
                salary_max=job_data.get('salary_max'),
                interview_date=job_data.get('interview_date'),
                interview_type=job_data.get('interview_type'),
                location=job_data.get('location'),
                work_mode=job_data.get('work_mode'),
                role_duties=job_data.get('role_duties'),
                next_steps=job_data.get('next_steps'),
                recruiter_name=job_data.get('recruiter_name'),
                recruiter_email=job_data.get('recruiter_email'),
                recruiter_phone=job_data.get('recruiter_phone'),
                notes=job_data.get('notes'),
                benefits=job_data.get('benefits'),
                company_size=job_data.get('company_size'),
                industry=job_data.get('industry'),
                application_deadline=job_data.get('application_deadline'),
                job_link=email['urls'][0] if email['urls'] else None
            )
            db.add(new_application)
            new_count += 1

    # Commit changes
    db.commit()

    # Update stored token
    settings.google_token = gmail_service.get_updated_token()
    db.commit()

    return {
        "new_applications": new_count,
        "updated_applications": updated_count,
        "skipped_emails": skipped_count,
        "total_emails_processed": len(emails)
    }
