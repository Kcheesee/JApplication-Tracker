"""Job Fit Analyzer module.

Provides comprehensive job fit analysis with:
- Job posting parsing (Greenhouse, Lever, generic)
- Resume matching with category scoring
- LLM-powered deep gap analysis
- Resume tailoring recommendations

Built with care by Kareem & Claude
"""

from .job_parser import JobPostingParser, ParsedJobPosting, JobRequirement
from .resume_matcher import ResumeMatcher, ResumeData, FitAnalysis, MatchStrength
from .resume_tailor import ResumeTailor
from .llm_analyzer import LLMFitAnalyzer, EnhancedFitAnalysis, DetailedGap, StrengthHighlight

__all__ = [
    # Job parsing
    "JobPostingParser",
    "ParsedJobPosting",
    "JobRequirement",
    # Resume matching
    "ResumeMatcher",
    "ResumeData",
    "FitAnalysis",
    "MatchStrength",
    # Resume tailoring
    "ResumeTailor",
    # LLM-powered analysis
    "LLMFitAnalyzer",
    "EnhancedFitAnalysis",
    "DetailedGap",
    "StrengthHighlight",
]
