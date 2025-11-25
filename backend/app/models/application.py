from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Application(Base):
    """Job application model"""
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Basic job information
    company = Column(String, nullable=False, index=True)
    position = Column(String, nullable=True, index=True)
    job_link = Column(String, nullable=True)

    # Application details
    status = Column(String, nullable=False, default="Applied", index=True)
    # Status options: Applied, Interview Scheduled, Rejected, Offer Received, Follow-up Needed, Other

    application_date = Column(DateTime(timezone=True), nullable=True)
    application_source = Column(String, nullable=True)
    # Source options: LinkedIn, Indeed, Company Website, Referral, Recruiter, Other

    # Compensation
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    salary_currency = Column(String, default="USD")

    # Interview details
    interview_date = Column(DateTime(timezone=True), nullable=True)
    interview_type = Column(String, nullable=True)
    # Type: Phone Screen, Technical, Onsite, Final Round, etc.

    # Job details
    location = Column(String, nullable=True)
    work_mode = Column(String, nullable=True)
    # Work mode: Remote, Hybrid, Onsite

    job_description = Column(Text, nullable=True)
    role_duties = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)

    # Contact information
    recruiter_name = Column(String, nullable=True)
    recruiter_email = Column(String, nullable=True)
    recruiter_phone = Column(String, nullable=True)

    # Additional information
    notes = Column(Text, nullable=True)
    benefits = Column(Text, nullable=True)
    company_size = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    application_deadline = Column(DateTime(timezone=True), nullable=True)

    # Resume information
    resume_version = Column(String, nullable=True)  # e.g., "Software Engineer V2", "General"
    resume_url = Column(String, nullable=True)  # Link to resume file
    resume_file_name = Column(String, nullable=True)  # Original file name

    # Interview prep and research
    interview_questions = Column(Text, nullable=True)  # Questions asked or to prepare
    interview_notes = Column(Text, nullable=True)  # Notes from interviews
    company_research = Column(Text, nullable=True)  # Research about the company
    
    # Job Fit Analysis (from Job Fit Analyzer)
    fit_analysis_score = Column(Float, nullable=True)  # 0.0 - 1.0
    fit_analysis_label = Column(String, nullable=True)  # "Strong Match", "Good Match", etc.
    fit_analysis_should_apply = Column(String, nullable=True)  # Store as string for boolean
    fit_analysis_recommendation = Column(Text, nullable=True)  # Human-readable recommendation
    fit_analysis_data = Column(Text, nullable=True)  # Full analysis as JSON
    fit_analysis_date = Column(DateTime(timezone=True), nullable=True)  # When analysis was done
    
    # Resume Tailoring Plan
    tailoring_plan = Column(Text, nullable=True)  # Tailoring suggestions as JSON
    tailoring_plan_date = Column(DateTime(timezone=True), nullable=True)  # When plan was generated

    # Metadata
    email_id = Column(String, nullable=True)  # Gmail message ID for reference
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="applications")
    status_history = relationship("StatusHistory", back_populates="application", cascade="all, delete-orphan", order_by="StatusHistory.changed_at")

    def __repr__(self):
        return f"<Application(id={self.id}, company={self.company}, position={self.position}, status={self.status})>"
