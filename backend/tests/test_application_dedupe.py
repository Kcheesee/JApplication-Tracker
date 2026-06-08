from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.user import User  # noqa: F401 - required for FK table creation
from app.models.application import Application
from app.models.status_history import StatusHistory  # noqa: F401 - required for FK table creation
from app.services.application_dedupe import (
    append_unique_note,
    find_existing_gmail_application,
    sync_email_reference,
)


def make_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()


def test_finds_existing_application_by_gmail_thread_id():
    db = make_session()
    existing = Application(
        user_id=1,
        company="Acme",
        position="Software Engineer",
        status="Applied",
        email_id="message-1",
        email_thread_id="thread-1",
    )
    db.add(existing)
    db.commit()

    found = find_existing_gmail_application(
        db=db,
        user_id=1,
        email={"id": "message-2", "thread_id": "thread-1", "urls": []},
        job_data={"company": "Acme", "position": "Software Engineer"},
    )

    assert found.id == existing.id


def test_finds_legacy_gmail_duplicate_by_company_and_position_and_backfills_thread():
    db = make_session()
    existing = Application(
        user_id=1,
        company="Acme Corp",
        position="Senior Backend Engineer",
        status="Applied",
        email_id="legacy-message",
    )
    db.add(existing)
    db.commit()

    email = {"id": "new-message", "thread_id": "new-thread", "urls": []}
    found = find_existing_gmail_application(
        db=db,
        user_id=1,
        email=email,
        job_data={"company": " acme corp ", "position": "Senior   Backend Engineer"},
    )
    sync_email_reference(found, email)

    assert found.id == existing.id
    assert found.email_thread_id == "new-thread"
    assert found.email_id == "legacy-message"


def test_append_unique_note_does_not_duplicate_existing_note():
    assert (
        append_unique_note("Next steps: recruiter screen", "Next steps: recruiter screen")
        == "Next steps: recruiter screen"
    )
    assert append_unique_note("First note", "Second note") == "First note\n\nSecond note"
