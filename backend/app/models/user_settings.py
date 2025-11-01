from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class UserSettings(Base):
    """User settings and API keys"""
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # LLM Provider Settings
    llm_provider = Column(String, default="anthropic")  # anthropic, openai, google, openrouter
    llm_model = Column(String, nullable=True)  # Optional specific model override

    # API Keys (encrypted in production)
    anthropic_api_key = Column(String, nullable=True)
    openai_api_key = Column(String, nullable=True)
    google_api_key = Column(String, nullable=True)
    openrouter_api_key = Column(String, nullable=True)

    google_credentials = Column(JSON, nullable=True)  # Store Google OAuth credentials
    google_token = Column(JSON, nullable=True)  # Store Google OAuth token

    # Google Sheets settings
    spreadsheet_id = Column(String, nullable=True)
    auto_sync_enabled = Column(Boolean, default=True)
    sync_interval_hours = Column(Integer, default=24)

    # Gmail monitoring settings
    gmail_enabled = Column(Boolean, default=True)
    gmail_search_days = Column(Integer, default=7)
    gmail_keywords = Column(JSON, default=list)  # List of keywords to search
    gmail_auto_sync_enabled = Column(Boolean, default=False)  # Daily auto-sync from Gmail

    # Notification settings
    email_notifications = Column(Boolean, default=True)
    daily_summary_enabled = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="settings")

    def __repr__(self):
        return f"<UserSettings(user_id={self.user_id})>"
