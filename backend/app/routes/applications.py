from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.application import Application
from ..models.status_history import StatusHistory
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

    # Create initial status history entry
    initial_history = StatusHistory(
        application_id=new_application.id,
        old_status=None,
        new_status=new_application.status or "Applied",
        notes="Application created"
    )
    db.add(initial_history)
    db.commit()

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

    # Track status change for history
    old_status = application.status
    update_data = application_data.model_dump(exclude_unset=True)
    new_status = update_data.get('status')

    # Update fields
    for field, value in update_data.items():
        setattr(application, field, value)

    # If status changed, create history entry
    if new_status and new_status != old_status:
        status_change = StatusHistory(
            application_id=application.id,
            old_status=old_status,
            new_status=new_status,
            notes=f"Status changed from {old_status} to {new_status}"
        )
        db.add(status_change)

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


@router.get("/{application_id}/history")
def get_status_history(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status change history for an application"""
    # Verify application belongs to user
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Get status history
    history = db.query(StatusHistory).filter(
        StatusHistory.application_id == application_id
    ).order_by(StatusHistory.changed_at.asc()).all()

    return {
        "application_id": application_id,
        "company": application.company,
        "position": application.position,
        "current_status": application.status,
        "history": [
            {
                "id": h.id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "changed_at": h.changed_at
            }
            for h in history
        ]
    }


@router.post("/{application_id}/bulk-update-status")
def bulk_update_status(
    application_ids: List[int] = Body(..., embed=True),
    new_status: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk update status for multiple applications"""
    updated_count = 0
    errors = []

    for app_id in application_ids:
        try:
            application = db.query(Application).filter(
                Application.id == app_id,
                Application.user_id == current_user.id
            ).first()

            if not application:
                errors.append(f"Application {app_id} not found")
                continue

            old_status = application.status

            # Only update if status actually changes
            if old_status != new_status:
                application.status = new_status

                # Create history entry
                status_change = StatusHistory(
                    application_id=application.id,
                    old_status=old_status,
                    new_status=new_status,
                    notes=f"Bulk status update from {old_status} to {new_status}"
                )
                db.add(status_change)
                updated_count += 1

        except Exception as e:
            errors.append(f"Error updating application {app_id}: {str(e)}")

    db.commit()

    return {
        "success": True,
        "updated_count": updated_count,
        "errors": errors
    }


@router.delete("/bulk-delete")
def bulk_delete_applications(
    application_ids: List[int] = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk delete multiple applications"""
    deleted_count = 0
    errors = []

    for app_id in application_ids:
        try:
            application = db.query(Application).filter(
                Application.id == app_id,
                Application.user_id == current_user.id
            ).first()

            if not application:
                errors.append(f"Application {app_id} not found")
                continue

            db.delete(application)
            deleted_count += 1

        except Exception as e:
            errors.append(f"Error deleting application {app_id}: {str(e)}")

    db.commit()

    return {
        "success": True,
        "deleted_count": deleted_count,
        "errors": errors
    }


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
