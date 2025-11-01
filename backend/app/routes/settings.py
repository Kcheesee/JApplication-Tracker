from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.user_settings import UserSettings
from ..schemas.settings import UserSettingsUpdate, UserSettingsResponse
from ..auth.security import get_current_user
from ..utils.encryption import encrypt_api_key
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=UserSettingsResponse)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found"
        )

    # Return settings without exposing sensitive data
    return UserSettingsResponse(
        id=settings.id,
        user_id=settings.user_id,
        llm_provider=settings.llm_provider or "anthropic",
        llm_model=settings.llm_model,
        has_anthropic_key=bool(settings.anthropic_api_key),
        has_openai_key=bool(settings.openai_api_key),
        has_google_key=bool(settings.google_api_key),
        has_openrouter_key=bool(settings.openrouter_api_key),
        has_google_credentials=bool(settings.google_credentials),
        spreadsheet_id=settings.spreadsheet_id,
        auto_sync_enabled=settings.auto_sync_enabled,
        sync_interval_hours=settings.sync_interval_hours,
        gmail_enabled=settings.gmail_enabled,
        gmail_search_days=settings.gmail_search_days,
        gmail_keywords=settings.gmail_keywords or [],
        gmail_auto_sync_enabled=settings.gmail_auto_sync_enabled or False,
        email_notifications=settings.email_notifications,
        daily_summary_enabled=settings.daily_summary_enabled
    )


@router.put("", response_model=UserSettingsResponse)
def update_settings(
    settings_data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Settings not found"
        )

    # Update fields with encryption for API keys
    update_data = settings_data.model_dump(exclude_unset=True)

    # Encrypt API keys before storing
    api_key_fields = ['anthropic_api_key', 'openai_api_key', 'google_api_key', 'openrouter_api_key']
    for field in api_key_fields:
        if field in update_data and update_data[field]:
            try:
                update_data[field] = encrypt_api_key(update_data[field])
            except Exception as e:
                # Log the actual error for debugging
                error_trace = traceback.format_exc()
                logger.error(f"Encryption error for {field}: {str(e)}\n{error_trace}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to encrypt API key: {str(e)}"
                )

    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    # Return updated settings
    return UserSettingsResponse(
        id=settings.id,
        user_id=settings.user_id,
        llm_provider=settings.llm_provider or "anthropic",
        llm_model=settings.llm_model,
        has_anthropic_key=bool(settings.anthropic_api_key),
        has_openai_key=bool(settings.openai_api_key),
        has_google_key=bool(settings.google_api_key),
        has_openrouter_key=bool(settings.openrouter_api_key),
        has_google_credentials=bool(settings.google_credentials),
        spreadsheet_id=settings.spreadsheet_id,
        auto_sync_enabled=settings.auto_sync_enabled,
        sync_interval_hours=settings.sync_interval_hours,
        gmail_enabled=settings.gmail_enabled,
        gmail_search_days=settings.gmail_search_days,
        gmail_keywords=settings.gmail_keywords or [],
        gmail_auto_sync_enabled=settings.gmail_auto_sync_enabled or False,
        email_notifications=settings.email_notifications,
        daily_summary_enabled=settings.daily_summary_enabled
    )
