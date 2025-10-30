from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.application import Application
from ..schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from ..auth.security import get_current_user

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.get("", response_model=List[ApplicationResponse])
def get_applications(
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    company_filter: Optional[str] = Query(None, description="Filter by company name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all applications for the current user"""
    query = db.query(Application).filter(Application.user_id == current_user.id)

    # Apply filters
    if status_filter:
        query = query.filter(Application.status == status_filter)
    if company_filter:
        query = query.filter(Application.company.ilike(f"%{company_filter}%"))

    # Get applications with pagination
    applications = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()

    return applications


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific application"""
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    return application


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job application"""
    # Check for duplicate
    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.company == application_data.company,
        Application.position == application_data.position
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application for this company and position already exists"
        )

    # Create new application
    new_application = Application(
        user_id=current_user.id,
        **application_data.model_dump()
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    return new_application


@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: int,
    application_data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing application"""
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Update fields
    update_data = application_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)

    db.commit()
    db.refresh(application)

    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an application"""
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    db.delete(application)
    db.commit()

    return None


@router.get("/stats/summary")
def get_application_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get application statistics for the current user"""
    applications = db.query(Application).filter(Application.user_id == current_user.id).all()

    # Calculate stats
    total = len(applications)
    status_counts = {}

    for app in applications:
        status = app.status
        status_counts[status] = status_counts.get(status, 0) + 1

    return {
        "total_applications": total,
        "status_breakdown": status_counts,
        "recent_applications": sorted(
            [{"company": app.company, "position": app.position, "status": app.status, "date": app.created_at}
             for app in applications[-10:]],
            key=lambda x: x["date"],
            reverse=True
        )
    }
