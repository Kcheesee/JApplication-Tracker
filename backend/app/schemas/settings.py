from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class UserSettingsUpdate(BaseModel):
    """Schema for updating user settings"""
    # LLM Provider Settings
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None

    # Google OAuth
    google_credentials: Optional[Dict[str, Any]] = None

    # Sync Settings
    spreadsheet_id: Optional[str] = None
    auto_sync_enabled: Optional[bool] = None
    sync_interval_hours: Optional[int] = None

    # Gmail Settings
    gmail_enabled: Optional[bool] = None
    gmail_search_days: Optional[int] = None
    gmail_keywords: Optional[List[str]] = None
    gmail_auto_sync_enabled: Optional[bool] = None

    # Notification Settings
    email_notifications: Optional[bool] = None
    daily_summary_enabled: Optional[bool] = None


class UserSettingsResponse(BaseModel):
    """Schema for user settings response (hides sensitive data)"""
    id: int
    user_id: int

    # LLM Provider Settings
    llm_provider: str
    llm_model: Optional[str]
    has_anthropic_key: bool  # Don't expose the actual keys
    has_openai_key: bool
    has_google_key: bool
    has_openrouter_key: bool

    # Google OAuth
    has_google_credentials: bool

    # Sync Settings
    spreadsheet_id: Optional[str]
    auto_sync_enabled: bool
    sync_interval_hours: int

    # Gmail Settings
    gmail_enabled: bool
    gmail_search_days: int
    gmail_keywords: List[str]
    gmail_auto_sync_enabled: bool

    # Notification Settings
    email_notifications: bool
    daily_summary_enabled: bool

    class Config:
        from_attributes = True
