"""
Google OAuth authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
import json
import os

from ..database import get_db
from ..models.user import User
from ..models.user_settings import UserSettings
from ..auth.security import get_current_user
from ..config import get_settings

router = APIRouter(prefix="/api/oauth", tags=["OAuth"])
settings = get_settings()

# Gmail API scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
]


@router.get("/google/authorize")
def google_authorize(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Initiate Google OAuth flow
    Returns the authorization URL for the user to visit
    """
    # Check if Google OAuth credentials are configured
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
        )

    # Create OAuth flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{settings.FRONTEND_URL}/oauth/callback"]
            }
        },
        scopes=SCOPES
    )

    # Set redirect URI
    flow.redirect_uri = f"{request.base_url}api/oauth/google/callback"

    # Generate authorization URL with user ID encoded in state
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',  # Force consent screen to get refresh token
        state=f"user_{current_user.id}"  # Encode user ID in state
    )

    return {
        "authorization_url": authorization_url,
        "state": state
    }


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle OAuth callback from Google
    Exchanges auth code for tokens and stores them
    """
    # Extract user ID from state
    if not state.startswith("user_"):
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings?oauth=error&message=Invalid state parameter",
            status_code=status.HTTP_302_FOUND
        )

    try:
        user_id = int(state.replace("user_", ""))
    except ValueError:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings?oauth=error&message=Invalid user ID in state",
            status_code=status.HTTP_302_FOUND
        )

    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

    if not client_id or not client_secret:
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings?oauth=error&message=OAuth not configured",
            status_code=status.HTTP_302_FOUND
        )

    # Create OAuth flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{request.base_url}api/oauth/google/callback"]
            }
        },
        scopes=SCOPES,
        state=state
    )

    flow.redirect_uri = f"{request.base_url}api/oauth/google/callback"

    # Exchange authorization code for tokens
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Get user settings
        user_settings = db.query(UserSettings).filter(
            UserSettings.user_id == user_id
        ).first()

        if not user_settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User settings not found"
            )

        # Store credentials
        user_settings.google_credentials = {
            "client_id": client_id,
            "client_secret": client_secret,
            "scopes": SCOPES
        }

        user_settings.google_token = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes
        }

        # Enable Gmail sync
        user_settings.gmail_enabled = True

        db.commit()

        # Redirect back to frontend settings page
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings?oauth=success",
            status_code=status.HTTP_302_FOUND
        )

    except Exception as e:
        print(f"OAuth callback error: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/settings?oauth=error&message={str(e)}",
            status_code=status.HTTP_302_FOUND
        )


@router.post("/google/disconnect")
def google_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect Google account and remove stored credentials
    """
    user_settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not user_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found"
        )

    # Clear Google credentials and tokens
    user_settings.google_credentials = None
    user_settings.google_token = None
    user_settings.gmail_enabled = False

    db.commit()

    return {
        "success": True,
        "message": "Google account disconnected successfully"
    }


@router.get("/google/status")
def google_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if Google OAuth is connected
    """
    user_settings = db.query(UserSettings).filter(
        UserSettings.user_id == current_user.id
    ).first()

    if not user_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User settings not found"
        )

    return {
        "connected": bool(user_settings.google_credentials and user_settings.google_token),
        "gmail_enabled": user_settings.gmail_enabled
    }
