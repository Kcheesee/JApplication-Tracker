"""API routes for Job Fit Analyzer."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import httpx
from bs4 import BeautifulSoup

from ..database import get_db
from ..models.user import User
from ..auth.security import get_current_user
from ..schemas.analyzer import (
    AnalyzeRequest,
    AnalyzeResponse,
    TailorRequest,
    TailorResponse,
    QuickCheckRequest,
    QuickCheckResponse,
    RequirementMatchResponse,
    TailoringActionResponse,
)
from ..analyzer.job_parser import JobPostingParser
from ..analyzer.resume_matcher import ResumeMatcher, ResumeData, MatchStrength
from ..analyzer.resume_tailor import ResumeTailor


router = APIRouter(prefix="/api/analyzer", tags=["Job Fit Analyzer"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_job_fit(
    request: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze how well a resume fits a job posting.
    
    Returns match score, detailed breakdown, and recommendations.
    """
    try:
        # Fetch job HTML if not provided
        job_html = request.job_html
        if not job_html:
            async with httpx.AsyncClient() as client:
                response = await client.get(request.job_url, follow_redirects=True)
                job_html = response.text
        
        # Parse job posting
        parser = JobPostingParser()
        
        # Determine format and parse
        if "greenhouse" in request.job_url.lower():
            raw_data = parser._parse_greenhouse(job_html)
        else:
            raw_data = parser._parse_generic(job_html)
        
        # Extract requirements
        requirements = parser._extract_requirements(raw_data)
        
        # Create ParsedJobPosting
        from ..analyzer.job_parser import ParsedJobPosting
        job = ParsedJobPosting(
            url=request.job_url,
            title=raw_data.get("title", "Unknown"),
            company=raw_data.get("company", "Unknown"),
            location=raw_data.get("location", "Unknown"),
            requirements=requirements
        )
        
        # Convert request resume data to ResumeData
        resume = ResumeData(**request.resume_data.model_dump())
        
        # Perform analysis
        matcher = ResumeMatcher()
        analysis = matcher.analyze_fit(resume, job)
        
        # Convert to response format
        return AnalyzeResponse(
            match_score=analysis.match_score,
            match_label=analysis.match_label,
            should_apply=analysis.should_apply,
            recommendation=analysis.recommendation,
            matches=[
                RequirementMatchResponse(
                    requirement_text=m.requirement.text,
                    category=m.requirement.category.value,
                    strength=m.strength.value,
                    evidence=m.evidence,
                    explanation=m.explanation,
                    suggestion=m.suggestion
                )
                for m in analysis.matches
            ],
            strong_matches=analysis.strong_matches,
            matches_count=analysis.matches_count,
            partial_matches=analysis.partial_matches,
            gaps=analysis.gaps,
            dealbreakers=analysis.dealbreakers,
            top_suggestions=analysis.top_suggestions,
            missing_keywords=analysis.missing_keywords
        )
        
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch job posting: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing job fit: {str(e)}"
        )


@router.post("/tailor", response_model=TailorResponse)
async def generate_tailoring_plan(
    request: TailorRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a resume tailoring plan based on fit analysis.
    
    Returns specific actions to improve resume match.
    """
    try:
        # Fetch job HTML if not provided
        job_html = request.job_html
        if not job_html:
            async with httpx.AsyncClient() as client:
                response = await client.get(request.job_url, follow_redirects=True)
                job_html = response.text
        
        # Parse job posting
        parser = JobPostingParser()
        if "greenhouse" in request.job_url.lower():
            raw_data = parser._parse_greenhouse(job_html)
        else:
            raw_data = parser._parse_generic(job_html)
        
        requirements = parser._extract_requirements(raw_data)
        
        from ..analyzer.job_parser import ParsedJobPosting
        job = ParsedJobPosting(
            url=request.job_url,
            title=raw_data.get("title", "Unknown"),
            company=raw_data.get("company", "Unknown"),
            location=raw_data.get("location", "Unknown"),
            requirements=requirements
        )
        
        # Convert resume data
        resume = ResumeData(**request.resume_data.model_dump())
        
        # Convert analysis input to FitAnalysis
        from ..analyzer.resume_matcher import FitAnalysis, RequirementMatch
        from ..analyzer.job_parser import JobRequirement, RequirementCategory, RequirementType
        
        # Reconstruct matches from analysis input
        matches = []
        for m_dict in request.analysis.matches:
            req = JobRequirement(
                text=m_dict.get("requirement_text", ""),
                category=RequirementCategory(m_dict.get("category", "domain")),
                requirement_type=RequirementType(m_dict.get("requirement_type", "required")),
                keywords=m_dict.get("keywords", [])
            )
            match = RequirementMatch(
                requirement=req,
                strength=MatchStrength(m_dict.get("strength", "gap")),
                evidence=m_dict.get("evidence", []),
                explanation=m_dict.get("explanation", ""),
                suggestion=m_dict.get("suggestion")
            )
            matches.append(match)
        
        analysis = FitAnalysis(
            match_score=request.analysis.match_score,
            match_label=request.analysis.match_label,
            should_apply=request.analysis.should_apply,
            recommendation=request.analysis.recommendation,
            matches=matches,
            strong_matches=request.analysis.strong_matches,
            matches_count=request.analysis.matches_count,
            partial_matches=request.analysis.partial_matches,
            gaps=request.analysis.gaps,
            dealbreakers=request.analysis.dealbreakers,
            top_suggestions=request.analysis.top_suggestions,
            missing_keywords=request.analysis.missing_keywords
        )
        
        # Generate tailoring plan
        tailor = ResumeTailor()
        plan = tailor.generate_plan(resume, job, analysis)
        
        # Convert to response
        return TailorResponse(
            job_title=plan.job_title,
            company=plan.company,
            current_score=plan.current_score,
            projected_score=plan.projected_score,
            actions=[
                TailoringActionResponse(
                    action_type=a.action_type,
                    section=a.section,
                    priority=a.priority,
                    suggestion=a.suggestion,
                    example=a.example,
                    addresses_requirement=a.addresses_requirement
                )
                for a in plan.actions
            ],
            keywords_to_add=plan.keywords_to_add,
            suggested_summary=plan.suggested_summary,
            cover_letter_points=plan.cover_letter_points
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating tailoring plan: {str(e)}"
        )


@router.post("/quick-check", response_model=QuickCheckResponse)
async def quick_compatibility_check(
    request: QuickCheckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Quick compatibility check between job description and resume summary.
    
    Useful for filtering jobs before full analysis.
    """
    try:
        # Simple keyword-based matching for quick check
        job_lower = request.job_description.lower()
        resume_lower = request.resume_summary.lower()
        
        # Extract common technical keywords
        tech_keywords = [
            "python", "javascript", "java", "react", "vue", "angular",
            "aws", "azure", "gcp", "docker", "kubernetes", "sql",
            "api", "rest", "graphql", "fastapi", "flask", "django"
        ]
        
        matches = []
        gaps = []
        
        for keyword in tech_keywords:
            in_job = keyword in job_lower
            in_resume = keyword in resume_lower
            
            if in_job and in_resume:
                matches.append(keyword)
            elif in_job and not in_resume:
                gaps.append(keyword)
        
        # Calculate simple score
        if matches or gaps:
            score = len(matches) / (len(matches) + len(gaps))
        else:
            score = 0.5  # Neutral if no keywords found
        
        # Determine compatibility
        compatible = score >= 0.4
        
        # Generate recommendation
        if score >= 0.7:
            recommendation = "Strong match - proceed with full analysis"
        elif score >= 0.4:
            recommendation = "Moderate compatibility - worth investigating further"
        else:
            recommendation = "Low compatibility - may not be a good fit"
        
        return QuickCheckResponse(
            compatible=compatible,
            score=score,
            key_matches=matches[:5],
            key_gaps=gaps[:5],
            recommendation=recommendation
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing quick check: {str(e)}"
        )
