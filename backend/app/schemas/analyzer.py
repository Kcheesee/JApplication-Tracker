"""Pydantic schemas for Job Fit Analyzer API."""
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any


class ResumeDataInput(BaseModel):
    """Resume data input for analysis."""
    name: str
    email: str
    location: str
    summary: str = ""
    experiences: List[Dict[str, Any]] = []
    technical_skills: List[str] = []
    soft_skills: List[str] = []
    education: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    certifications: List[str] = []
    total_years_experience: int = 0
    industries: List[str] = [] 


class AnalyzeRequest(BaseModel):
    """Request for job fit analysis."""
    job_url: str
    job_html: Optional[str] = None  # Optional pre-fetched HTML
    resume_data: ResumeDataInput


class RequirementMatchResponse(BaseModel):
    """Response for a single requirement match."""
    requirement_text: str
    category: str
    strength: str
    evidence: List[str] = []
    explanation: str = ""
    suggestion: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Response from job fit analysis."""
    match_score: float
    match_label: str
    should_apply: bool
    recommendation: str
    
    # Breakdown
    matches: List[RequirementMatchResponse] = []
    strong_matches: int
    matches_count: int
    partial_matches: int
    gaps: int
    
    # Additional info
    dealbreakers: List[str] = []
    top_suggestions: List[str] = []
    missing_keywords: List[str] = []


class FitAnalysisInput(BaseModel):
    """Fit analysis as input for tailoring."""
    match_score: float
    match_label: str
    should_apply: bool
    recommendation: str
    matches: List[Dict[str, Any]] = []
    strong_matches: int = 0
    matches_count: int = 0
    partial_matches: int = 0
    gaps: int = 0
    dealbreakers: List[str] = []
    top_suggestions: List[str] = []
    missing_keywords: List[str] = []


class TailorRequest(BaseModel):
    """Request for resume tailoring."""
    job_url: str
    job_html: Optional[str] = None
    resume_data: ResumeDataInput
    analysis: FitAnalysisInput  # From previous analyze call


class TailoringActionResponse(BaseModel):
    """Response for a tailoring action."""
    action_type: str
    section: str
    priority: str
    suggestion: str
    example: Optional[str] = None
    addresses_requirement: Optional[str] = None


class TailorResponse(BaseModel):
    """Response from resume tailoring."""
    job_title: str
    company: str
    current_score: float
    projected_score: float
    actions: List[TailoringActionResponse] = []
    keywords_to_add: List[str] = []
    suggested_summary: Optional[str] = None
    cover_letter_points: List[str] = []


class QuickCheckRequest(BaseModel):
    """Request for quick compatibility check."""
    job_description: str
    resume_summary: str


class QuickCheckResponse(BaseModel):
    """Response from quick compatibility check."""
    compatible: bool
    score: float
    key_matches: List[str] = []
    key_gaps: List[str] = []
    recommendation: str
