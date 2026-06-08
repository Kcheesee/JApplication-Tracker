from typing import Any, Dict, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from ..models.application import Application


def normalize_job_text(value: Optional[str]) -> str:
    """Normalize parsed job text for duplicate comparisons."""
    if not value:
        return ""
    return " ".join(value.strip().lower().split())


def get_email_thread_id(email: Dict[str, Any]) -> Optional[str]:
    """Return Gmail thread ID from either internal naming convention."""
    return email.get("thread_id") or email.get("threadId")


def get_primary_job_url(email: Dict[str, Any]) -> Optional[str]:
    urls = email.get("urls") or []
    return urls[0] if urls else None


def append_unique_note(existing_notes: Optional[str], new_note: Optional[str]) -> Optional[str]:
    """Append Gmail notes once, avoiding duplicate sync noise."""
    if not new_note:
        return existing_notes

    note = new_note.strip()
    if not note:
        return existing_notes

    if existing_notes and note in existing_notes:
        return existing_notes

    return f"{existing_notes}\n\n{note}" if existing_notes else note


def find_existing_gmail_application(
    db: Session,
    user_id: int,
    email: Dict[str, Any],
    job_data: Dict[str, Any]
) -> Optional[Application]:
    """
    Find an existing app for a Gmail-sourced job.

    Prefer exact Gmail identifiers, then fall back to stable job identity so
    repeated emails from the same application thread do not create duplicate rows.
    """
    message_id = email.get("id")
    if message_id:
        existing = db.query(Application).filter(
            Application.user_id == user_id,
            Application.email_id == message_id
        ).first()
        if existing:
            return existing

    thread_id = get_email_thread_id(email)
    if thread_id:
        existing = db.query(Application).filter(
            Application.user_id == user_id,
            Application.email_thread_id == thread_id
        ).first()
        if existing:
            return existing

    job_url = get_primary_job_url(email)
    if job_url:
        existing = db.query(Application).filter(
            Application.user_id == user_id,
            Application.job_link == job_url
        ).first()
        if existing:
            return existing

    company = normalize_job_text(job_data.get("company"))
    position = normalize_job_text(job_data.get("position"))
    if company and position:
        return db.query(Application).filter(
            Application.user_id == user_id,
            func.lower(func.trim(Application.company)) == company,
            func.lower(func.trim(func.coalesce(Application.position, ""))) == position
        ).first()

    return None


def sync_email_reference(application: Application, email: Dict[str, Any]) -> None:
    """Attach Gmail IDs when the existing row was created before thread tracking."""
    if email.get("id") and not application.email_id:
        application.email_id = email["id"]

    thread_id = get_email_thread_id(email)
    if thread_id and not application.email_thread_id:
        application.email_thread_id = thread_id
