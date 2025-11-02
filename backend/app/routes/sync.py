from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from ..models.user import User
from ..models.application import Application
from ..models.user_settings import UserSettings
from ..auth.security import get_current_user
from ..services.gmail_service import GmailService
from ..services.llm_service import LLMService
from ..config import get_settings as get_app_settings
from ..utils.api_key_helper import get_llm_api_key

router = APIRouter(prefix="/api/sync", tags=["Sync"])


@router.post("/gmail")
def sync_gmail(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync job applications from Gmail"""
    # Get user settings
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User settings not configured"
        )

    if not settings.gmail_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gmail sync is disabled"
        )

    if not settings.google_credentials or not settings.google_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google credentials not configured"
        )

    # Get LLM provider and decrypted API key
    llm_provider = settings.llm_provider or "anthropic"
    api_key = get_llm_api_key(settings, llm_provider)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key not configured for LLM provider: {llm_provider}"
        )

    # Initialize services
    try:
        gmail_service = GmailService(
            credentials_dict=settings.google_credentials,
            token_dict=settings.google_token
        )
        llm_service = LLMService(
            provider=llm_provider,
            api_key=api_key,
            model=settings.llm_model
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing services: {str(e)}"
        )

    # Search for job emails
    keywords = settings.gmail_keywords or []
    if not keywords:
        keywords = ["application", "interview", "position", "offer", "candidate"]

    # Fetch emails with reasonable limit (increased from 50 but capped at 200 for performance)
    # Pre-filtering will reduce this further to only likely job emails
    emails = gmail_service.search_job_emails(
        keywords=keywords,
        days_back=settings.gmail_search_days,
        max_results=200
    )

    if not emails:
        return {
            "success": True,
            "message": "No job-related emails found",
            "new_applications": 0,
            "updated_applications": 0,
            "skipped_emails": 0,
            "error_count": 0,
            "total_emails_processed": 0
        }

    # Process each email with batch commits and error handling
    new_count = 0
    updated_count = 0
    skipped_count = 0
    error_count = 0
    batch_size = 10  # Commit every 10 applications to avoid losing all progress

    print(f"Starting to process {len(emails)} emails for user {current_user.id}")

    for idx, email in enumerate(emails, 1):
        try:
            # Progress logging every 10 emails
            if idx % 10 == 0:
                print(f"Progress: {idx}/{len(emails)} emails processed. New: {new_count}, Updated: {updated_count}, Skipped: {skipped_count}, Errors: {error_count}")

            # Parse email with configured LLM provider
            job_data = llm_service.parse_job_email(
                email_body=email['body'],
                email_subject=email['subject'],
                email_date=email['date']
            )

            if not job_data:
                skipped_count += 1
                continue

            # Validate required fields (only company is required, position is optional)
            if not job_data.get('company'):
                print(f"Skipping email - missing company: {email['subject']}")
                skipped_count += 1
                continue

            # Check if application already exists (match by company and email_id for updates)
            existing = db.query(Application).filter(
                Application.user_id == current_user.id,
                Application.email_id == email['id']
            ).first()

            if existing:
                # Update existing application
                existing.status = job_data.get('status', existing.status)
                if job_data.get('notes'):
                    existing.notes = f"{existing.notes}\n\n{job_data['notes']}" if existing.notes else job_data['notes']
                updated_count += 1
            else:
                # Create new application
                new_application = Application(
                    user_id=current_user.id,
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

            # Batch commit every N applications to save progress
            if (new_count + updated_count) % batch_size == 0:
                try:
                    db.commit()
                    print(f"Batch commit: Saved {batch_size} applications")
                except Exception as commit_error:
                    print(f"Error committing batch: {str(commit_error)}")
                    db.rollback()
                    error_count += 1

        except Exception as e:
            print(f"Error processing email '{email.get('subject', 'N/A')}': {str(e)}")
            error_count += 1
            # Continue processing other emails even if one fails
            continue

    # Final commit for any remaining applications
    try:
        db.commit()
        print(f"Final commit: All remaining applications saved")
    except Exception as e:
        print(f"Error in final commit: {str(e)}")
        db.rollback()

    # Update stored token (in case it was refreshed)
    settings.google_token = gmail_service.get_updated_token()
    db.commit()

    print(f"Sync complete: New: {new_count}, Updated: {updated_count}, Skipped: {skipped_count}, Errors: {error_count}")

    return {
        "success": True,
        "new_applications": new_count,
        "updated_applications": updated_count,
        "skipped_emails": skipped_count,
        "error_count": error_count,
        "total_emails_processed": len(emails)
    }


@router.post("/parse-job")
def parse_job_posting(
    job_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parse a job posting from browser extension
    Expects: { "job_text": "...", "job_url": "..." }
    """
    # Get user settings
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User settings not configured"
        )

    # Get LLM provider and decrypted API key
    llm_provider = settings.llm_provider or "anthropic"
    api_key = get_llm_api_key(settings, llm_provider)

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"API key not configured for LLM provider: {llm_provider}"
        )

    # Parse job posting with configured LLM provider
    try:
        llm_service = LLMService(
            provider=llm_provider,
            api_key=api_key,
            model=settings.llm_model
        )
        parsed_data = llm_service.parse_job_posting(
            job_text=job_data.get('job_text', ''),
            job_url=job_data.get('job_url', '')
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing LLM service: {str(e)}"
        )

    if not parsed_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not parse job posting"
        )

    return {
        "success": True,
        "data": parsed_data
    }
