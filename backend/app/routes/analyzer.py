"""API routes for Job Fit Analyzer."""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import httpx
import json
from bs4 import BeautifulSoup

from ..database import get_db
from ..models.user import User
from ..models.application import Application
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
    EnhancedAnalyzeRequest,
    EnhancedAnalyzeResponse,
    DetailedGapResponse,
    StrengthHighlightResponse,
)
from ..analyzer.job_parser import JobPostingParser
from ..analyzer.resume_matcher import ResumeMatcher, ResumeData, MatchStrength
from ..analyzer.resume_tailor import ResumeTailor
from ..analyzer.llm_analyzer import LLMFitAnalyzer, analysis_to_dict
from ..config import get_settings
from ..models.user_settings import UserSettings
from ..utils.api_key_helper import get_llm_api_key


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


@router.post("/analyze-enhanced", response_model=EnhancedAnalyzeResponse)
async def analyze_job_fit_enhanced(
    request: EnhancedAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enhanced AI-powered job fit analysis.

    Uses LLM for deep gap analysis with actionable insights,
    competitive positioning, and strategic recommendations.
    Inspired by TrustChain's counterfactual reasoning approach.
    """
    try:
        settings = get_settings()

        # Fetch job HTML if not provided
        job_html = request.job_html
        job_description_text = request.job_description or ""

        if not job_html:
            async with httpx.AsyncClient() as client:
                response = await client.get(request.job_url, follow_redirects=True)
                job_html = response.text
                # Extract text for LLM if not provided
                if not job_description_text:
                    soup = BeautifulSoup(job_html, 'html.parser')
                    job_description_text = soup.get_text(separator=' ', strip=True)[:5000]

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

        # Initialize LLM analyzer if API key available
        llm_provider = None
        if request.use_llm:
            # Get user's settings to retrieve their stored API key
            user_settings = db.query(UserSettings).filter(
                UserSettings.user_id == current_user.id
            ).first()

            # Get user's Anthropic API key (falls back to env var if not set)
            anthropic_key = None
            if user_settings:
                anthropic_key = get_llm_api_key(user_settings, "anthropic")
            else:
                # Fallback to environment variable if user has no settings
                anthropic_key = settings.ANTHROPIC_API_KEY

            if anthropic_key:
                from anthropic import Anthropic
                llm_provider = Anthropic(api_key=anthropic_key)

        # Perform enhanced analysis
        analyzer = LLMFitAnalyzer(llm_provider=llm_provider)
        enhanced_analysis = await analyzer.analyze_fit_deep(
            resume=resume,
            job=job,
            job_description_text=job_description_text
        )

        # Also run basic analysis for backward compatibility
        matcher = ResumeMatcher()
        basic_analysis = matcher.analyze_fit(resume, job)

        # Build response
        return EnhancedAnalyzeResponse(
            # Job info
            job_title=job.title,
            company=job.company,
            location=job.location,

            # Enhanced fields
            overall_score=enhanced_analysis.overall_score,
            confidence_score=enhanced_analysis.confidence_score,
            fit_tier=enhanced_analysis.fit_tier,
            executive_summary=enhanced_analysis.executive_summary,
            key_verdict=enhanced_analysis.key_verdict,
            gaps=[
                DetailedGapResponse(
                    gap_id=g.gap_id,
                    category=g.category.value if hasattr(g.category, 'value') else str(g.category),
                    severity=g.severity.value if hasattr(g.severity, 'value') else str(g.severity),
                    requirement_text=g.requirement_text,
                    your_level=g.your_level,
                    required_level=g.required_level,
                    gap_description=g.gap_description,
                    impact_on_application=g.impact_on_application,
                    bridging_strategies=g.bridging_strategies,
                    time_to_bridge=g.time_to_bridge,
                    transferable_skills=g.transferable_skills,
                    talking_points=g.talking_points
                )
                for g in enhanced_analysis.gaps
            ],
            strengths=[
                StrengthHighlightResponse(
                    strength_id=s.strength_id,
                    category=s.category,
                    title=s.title,
                    description=s.description,
                    evidence=s.evidence,
                    competitive_advantage=s.competitive_advantage,
                    how_to_leverage=s.how_to_leverage
                )
                for s in enhanced_analysis.strengths
            ],
            category_scores=enhanced_analysis.category_scores,
            application_strategy=enhanced_analysis.application_strategy,
            cover_letter_focus=enhanced_analysis.cover_letter_focus,
            interview_prep=enhanced_analysis.interview_prep,
            questions_to_ask=enhanced_analysis.questions_to_ask,
            rejection_risk=enhanced_analysis.rejection_risk,
            rejection_reasons=enhanced_analysis.rejection_reasons,
            mitigation_strategies=enhanced_analysis.mitigation_strategies,
            competitive_position=enhanced_analysis.competitive_position,
            differentiators=enhanced_analysis.differentiators,

            # Backward compatibility fields
            match_score=enhanced_analysis.overall_score,
            match_label=enhanced_analysis.fit_tier,
            should_apply=enhanced_analysis.overall_score >= 0.5,
            recommendation=enhanced_analysis.executive_summary,
            matches=[
                RequirementMatchResponse(
                    requirement_text=m.requirement.text,
                    category=m.requirement.category.value,
                    strength=m.strength.value,
                    evidence=m.evidence,
                    explanation=m.explanation,
                    suggestion=m.suggestion
                )
                for m in basic_analysis.matches
            ],
            strong_matches=basic_analysis.strong_matches,
            matches_count=basic_analysis.matches_count,
            partial_matches=basic_analysis.partial_matches,
            gap_count=len(enhanced_analysis.gaps),
            dealbreakers=basic_analysis.dealbreakers,
            top_suggestions=enhanced_analysis.cover_letter_focus[:5],
            missing_keywords=basic_analysis.missing_keywords
        )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch job posting: {str(e)}"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing enhanced analysis: {str(e)}"
        )


@router.post("/applications/{application_id}/save-analysis")
async def save_fit_analysis(
    application_id: int,
    analysis_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save fit analysis results to an application.
    """
    try:
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
        
        # Save analysis data
        application.fit_analysis_score = analysis_data.get("match_score")
        application.fit_analysis_label = analysis_data.get("match_label")
        application.fit_analysis_should_apply = str(analysis_data.get("should_apply", False))
        application.fit_analysis_recommendation = analysis_data.get("recommendation")
        application.fit_analysis_data = json.dumps(analysis_data)
        application.fit_analysis_date = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Fit analysis saved successfully",
            "application_id": application_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving fit analysis: {str(e)}"
        )


@router.get("/applications/{application_id}/analysis")
async def get_fit_analysis(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get saved fit analysis for an application.
    """
    try:
        application = db.query(Application).filter(
            Application.id == application_id,
            Application.user_id == current_user.id
        ).first()
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        if not application.fit_analysis_data:
            return {
                "has_analysis": False,
                "message": "No fit analysis available for this application"
            }
        
        analysis_data = json.loads(application.fit_analysis_data)
        
        return {
            "has_analysis": True,
            "analysis": analysis_data,
            "analysis_date": application.fit_analysis_date
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving fit analysis: {str(e)}"
        )


@router.post("/applications/{application_id}/save-tailoring")
async def save_tailoring_plan(
    application_id: int,
    tailoring_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save tailoring plan to an application.
    """
    try:
        application = db.query(Application).filter(
            Application.id == application_id,
            Application.user_id == current_user.id
        ).first()
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        application.tailoring_plan = json.dumps(tailoring_data)
        application.tailoring_plan_date = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Tailoring plan saved successfully",
            "application_id": application_id
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving tailoring plan: {str(e)}"
        )


# Keep existing endpoints
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
