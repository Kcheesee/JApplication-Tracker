from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
import os
import logging
from ..database import get_db
from ..models.user import User
from ..models.user_settings import UserSettings
from ..schemas.user import UserCreate, UserResponse, Token
from ..auth.security import get_password_hash, verify_password, create_access_token, get_current_user
from ..config import get_settings

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()

# Google OAuth scopes for login
GOOGLE_LOGIN_SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]

# Cookie settings for secure token storage
COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = 30 * 60  # 30 minutes in seconds


def create_default_user_settings(user_id: int, db: Session) -> UserSettings:
    """
    Create default settings for a new user
    Extracted to avoid code duplication
    """
    user_settings = UserSettings(
        user_id=user_id,
        gmail_keywords=[
            "application",
            "interview",
            "position",
            "unfortunately",
            "offer",
            "candidate",
            "application status",
            "thank you for applying",
            "next steps",
            "recruiter"
        ]
    )
    db.add(user_settings)
    db.commit()
    return user_settings


def set_auth_cookie(response: Response, token: str) -> None:
    """
    Set httpOnly cookie with JWT token for secure storage

    Note: For cross-domain setups (frontend and backend on different domains),
    cookies require samesite="none" and secure=True, but this requires HTTPS.
    """
    # For production with separate frontend/backend domains, use samesite="none"
    # For same-domain setups or development, use samesite="lax"
    is_production = settings.ENVIRONMENT == "production"

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=is_production,  # HTTPS only in production
        samesite="none" if is_production else "lax",  # "none" required for cross-domain
        path="/"
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    logger.info(f"Registration attempt for username: {user_data.username}")

    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        logger.warning(f"Registration failed - email or username already exists: {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default settings using helper function
    create_default_user_settings(new_user.id, db)

    logger.info(f"User registered successfully: {new_user.id}")
    return new_user


@router.post("/login", response_model=Token)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token (also sets httpOnly cookie)"""
    logger.info(f"Login attempt for username: {form_data.username}")

    # Find user by username
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        logger.warning(f"Inactive user login attempt: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    # Set secure httpOnly cookie
    set_auth_cookie(response, access_token)

    logger.info(f"User logged in successfully: {user.id}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout")
def logout(response: Response):
    """Logout user by clearing the authentication cookie"""
    response.delete_cookie(key=COOKIE_NAME, path="/")
    logger.info("User logged out")
    return {"message": "Logged out successfully"}


@router.get("/google/login")
def google_login(request: Request):
    """
    Initiate Google Sign In flow
    Redirects user to Google authentication page
    """
    # Check if Google OAuth credentials are configured
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )

    # Create OAuth flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{settings.FRONTEND_URL}/"]
            }
        },
        scopes=GOOGLE_LOGIN_SCOPES
    )

    # Set redirect URI to our callback
    flow.redirect_uri = f"{request.base_url}api/auth/google/callback"

    # Generate authorization URL
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='false',  # Only request login scopes, not Gmail scopes
        prompt='select_account'
    )

    return RedirectResponse(url=authorization_url)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback
    Creates or logs in user, sets secure httpOnly cookie
    """
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    client_secret = os.getenv('GOOGLE_CLIENT_SECRET')

    # Create OAuth flow
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"{settings.FRONTEND_URL}/"]
            }
        },
        scopes=GOOGLE_LOGIN_SCOPES
    )

    flow.redirect_uri = f"{request.base_url}api/auth/google/callback"

    # Exchange authorization code for credentials
    try:
        flow.fetch_token(authorization_response=str(request.url))
        credentials = flow.credentials

        # Get user info from Google
        service = build('oauth2', 'v2', credentials=credentials)
        user_info = service.userinfo().get().execute()

        email = user_info.get('email')
        google_id = user_info.get('id')
        name = user_info.get('name', email.split('@')[0] if email else 'user')

        if not email:
            logger.error("Google OAuth: Could not get email from user info")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not get email from Google"
            )

        logger.info(f"Google OAuth: Processing login for email: {email}")

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Create new user
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                email=email,
                username=username,
                full_name=name,
                hashed_password=get_password_hash(os.urandom(32).hex()),  # Random password
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Create default settings using helper function
            create_default_user_settings(user.id, db)

            logger.info(f"Google OAuth: Created new user {user.id}")
        else:
            logger.info(f"Google OAuth: Existing user login {user.id}")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )

        # For cross-domain production deployments, httpOnly cookies don't work well
        # So we pass the token as a URL fragment (not query param) for better security
        # The fragment (#) is not sent to the server and is only accessible client-side
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/#token={access_token}")

        # Still set the cookie for same-domain setups
        set_auth_cookie(response, access_token)

        return response

    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=google_auth_failed"
        )
