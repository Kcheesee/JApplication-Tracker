from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ApplicationBase(BaseModel):
    """Base schema for application"""
    company: str
    position: Optional[str] = None
    job_link: Optional[str] = None
    status: str = "Applied"
    application_date: Optional[datetime] = None
    application_source: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "USD"
    interview_date: Optional[datetime] = None
    interview_type: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    job_description: Optional[str] = None
    role_duties: Optional[str] = None
    next_steps: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    recruiter_phone: Optional[str] = None
    notes: Optional[str] = None
    benefits: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    application_deadline: Optional[datetime] = None
    resume_version: Optional[str] = None
    resume_url: Optional[str] = None
    resume_file_name: Optional[str] = None
    interview_questions: Optional[str] = None
    interview_notes: Optional[str] = None
    company_research: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    """Schema for creating an application"""
    pass


class ApplicationUpdate(BaseModel):
    """Schema for updating an application (all fields optional)"""
    company: Optional[str] = None
    position: Optional[str] = None
    job_link: Optional[str] = None
    status: Optional[str] = None
    application_date: Optional[datetime] = None
    application_source: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_type: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    job_description: Optional[str] = None
    role_duties: Optional[str] = None
    next_steps: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    recruiter_phone: Optional[str] = None
    notes: Optional[str] = None
    benefits: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    application_deadline: Optional[datetime] = None
    resume_version: Optional[str] = None
    resume_url: Optional[str] = None
    resume_file_name: Optional[str] = None
    interview_questions: Optional[str] = None
    interview_notes: Optional[str] = None
    company_research: Optional[str] = None


class ApplicationResponse(ApplicationBase):
    """Schema for application response"""
    id: int
    user_id: int
    email_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete request"""
    application_ids: List[int]
