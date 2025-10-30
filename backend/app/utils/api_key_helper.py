"""
Helper functions for API key management
"""
from typing import Optional
from ..models.user_settings import UserSettings
from ..config import get_settings as get_app_settings
from .encryption import decrypt_api_key


def get_llm_api_key(settings: UserSettings, provider: str) -> Optional[str]:
    """
    Get and decrypt the API key for a given LLM provider

    Args:
        settings: User settings object
        provider: LLM provider name (anthropic, openai, google, openrouter)

    Returns:
        Decrypted API key or None if not configured
    """
    app_settings = get_app_settings()
    encrypted_key = None
    user_key_field = None

    # Get the encrypted key from user settings or environment
    if provider == "anthropic":
        encrypted_key = settings.anthropic_api_key or app_settings.ANTHROPIC_API_KEY
        user_key_field = settings.anthropic_api_key
    elif provider == "openai":
        encrypted_key = settings.openai_api_key or app_settings.OPENAI_API_KEY
        user_key_field = settings.openai_api_key
    elif provider == "google":
        encrypted_key = settings.google_api_key or app_settings.GOOGLE_API_KEY
        user_key_field = settings.google_api_key
    elif provider == "openrouter":
        encrypted_key = settings.openrouter_api_key or app_settings.OPENROUTER_API_KEY
        user_key_field = settings.openrouter_api_key

    if not encrypted_key:
        return None

    # If this is a user-stored key (not from environment), decrypt it
    if user_key_field:
        try:
            return decrypt_api_key(encrypted_key)
        except Exception as e:
            # Fallback to plain text if decryption fails (backward compatibility)
            print(f"Warning: Failed to decrypt API key for {provider}: {e}")
            return encrypted_key

    # Environment keys are plain text
    return encrypted_key
