from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class StatusHistory(Base):
    """
    Track status changes for job applications
    Creates a timeline of application progress
    """
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)

    # Status change details
    old_status = Column(String, nullable=True)  # Null for initial status
    new_status = Column(String, nullable=False)

    # Additional context
    notes = Column(Text, nullable=True)  # Optional notes about why status changed
    changed_by = Column(String, nullable=True)  # Future: track who made the change

    # Timestamp
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="status_history")

    def __repr__(self):
        return f"<StatusHistory(id={self.id}, application_id={self.application_id}, {self.old_status} -> {self.new_status})>"
