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


# ============================================================================
# Enhanced Analysis Schemas (LLM-powered deep analysis)
# ============================================================================

class DetailedGapResponse(BaseModel):
    """Detailed gap analysis response."""
    gap_id: str
    category: str  # years_experience, technical_skills, domain_expertise, etc.
    severity: str  # critical, significant, moderate, minor
    requirement_text: str
    your_level: str
    required_level: str
    gap_description: str
    impact_on_application: str
    bridging_strategies: List[str] = []
    time_to_bridge: Optional[str] = None
    transferable_skills: List[str] = []
    talking_points: List[str] = []


class StrengthHighlightResponse(BaseModel):
    """Strength highlight response."""
    strength_id: str
    category: str
    title: str
    description: str
    evidence: List[str] = []
    competitive_advantage: str
    how_to_leverage: str


class EnhancedAnalyzeRequest(BaseModel):
    """Request for enhanced LLM-powered analysis."""
    job_url: str
    job_html: Optional[str] = None
    job_description: Optional[str] = None  # Raw job description text
    resume_data: ResumeDataInput
    use_llm: bool = True  # Whether to use LLM for deep analysis


class EnhancedAnalyzeResponse(BaseModel):
    """Response from enhanced LLM-powered analysis."""
    # Job info
    job_title: str = "Unknown Position"
    company: str = "Unknown Company"
    location: str = ""

    # Core scoring
    overall_score: float
    confidence_score: float
    fit_tier: str  # "Excellent", "Strong", "Good", "Stretch", "Long Shot"

    # Executive summary
    executive_summary: str
    key_verdict: str

    # Detailed breakdowns
    gaps: List[DetailedGapResponse] = []
    strengths: List[StrengthHighlightResponse] = []

    # Category scores (0-100)
    category_scores: Dict[str, int] = {}

    # Strategic guidance
    application_strategy: str
    cover_letter_focus: List[str] = []
    interview_prep: List[str] = []
    questions_to_ask: List[str] = []

    # Risk assessment
    rejection_risk: str
    rejection_reasons: List[str] = []
    mitigation_strategies: List[str] = []

    # Competitive positioning
    competitive_position: str
    differentiators: List[str] = []

    # Backward compatibility - include basic match info
    match_score: float  # Same as overall_score
    match_label: str  # Same as fit_tier
    should_apply: bool
    recommendation: str  # Same as executive_summary

    # Basic breakdown for backward compatibility
    matches: List[RequirementMatchResponse] = []
    strong_matches: int = 0
    matches_count: int = 0
    partial_matches: int = 0
    gap_count: int = 0
    dealbreakers: List[str] = []
    top_suggestions: List[str] = []
    missing_keywords: List[str] = []
