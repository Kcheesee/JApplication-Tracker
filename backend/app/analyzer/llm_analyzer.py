"""LLM-Powered Gap Analysis Service.

Provides deep, AI-driven analysis of resume vs job fit using
TrustChain's counterfactual criteria decomposition approach.

Built with care by Kareem & Claude
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

from .resume_matcher import ResumeData, FitAnalysis, RequirementMatch, MatchStrength
from .job_parser import ParsedJobPosting, JobRequirement

logger = logging.getLogger(__name__)


class GapSeverity(str, Enum):
    """Severity level of identified gaps."""
    CRITICAL = "critical"      # Dealbreaker - likely auto-reject
    SIGNIFICANT = "significant"  # Major concern but addressable
    MODERATE = "moderate"      # Notable but won't reject alone
    MINOR = "minor"           # Nice-to-have gap


class GapCategory(str, Enum):
    """Categories of skill/experience gaps."""
    YEARS_EXPERIENCE = "years_experience"
    TECHNICAL_SKILLS = "technical_skills"
    DOMAIN_EXPERTISE = "domain_expertise"
    LEADERSHIP = "leadership"
    EDUCATION = "education"
    CERTIFICATIONS = "certifications"
    SOFT_SKILLS = "soft_skills"
    INDUSTRY_KNOWLEDGE = "industry_knowledge"
    TOOLS_PLATFORMS = "tools_platforms"


@dataclass
class DetailedGap:
    """Detailed gap analysis with actionable insights."""
    gap_id: str
    category: GapCategory
    severity: GapSeverity
    requirement_text: str
    your_level: str
    required_level: str
    gap_description: str
    impact_on_application: str
    bridging_strategies: List[str]
    time_to_bridge: Optional[str] = None
    transferable_skills: List[str] = field(default_factory=list)
    talking_points: List[str] = field(default_factory=list)


@dataclass
class StrengthHighlight:
    """Key strength that exceeds requirements."""
    strength_id: str
    category: str
    title: str
    description: str
    evidence: List[str]
    competitive_advantage: str
    how_to_leverage: str


@dataclass
class EnhancedFitAnalysis:
    """Enhanced fit analysis with LLM-powered insights."""
    # Core scoring
    overall_score: float
    confidence_score: float
    fit_tier: str  # "Excellent", "Strong", "Good", "Stretch", "Long Shot"

    # Executive summary
    executive_summary: str
    key_verdict: str  # One-line decision helper

    # Detailed breakdowns
    gaps: List[DetailedGap]
    strengths: List[StrengthHighlight]

    # Category scores (0-100)
    category_scores: Dict[str, int]

    # Strategic guidance
    application_strategy: str
    cover_letter_focus: List[str]
    interview_prep: List[str]
    questions_to_ask: List[str]

    # Risk assessment
    rejection_risk: str  # "Low", "Medium", "High"
    rejection_reasons: List[str]
    mitigation_strategies: List[str]

    # Competitive positioning
    competitive_position: str
    differentiators: List[str]

    # Raw data
    raw_analysis: Optional[Dict[str, Any]] = None


class LLMFitAnalyzer:
    """
    LLM-powered job fit analyzer using TrustChain's
    counterfactual reasoning approach.
    """

    def __init__(self, llm_provider=None):
        """
        Initialize analyzer with LLM provider.

        Args:
            llm_provider: Configured LLM provider instance
        """
        self.llm = llm_provider
        self._gap_counter = 0
        self._strength_counter = 0

    def _generate_gap_id(self) -> str:
        """Generate unique gap ID."""
        self._gap_counter += 1
        return f"gap_{self._gap_counter}"

    def _generate_strength_id(self) -> str:
        """Generate unique strength ID."""
        self._strength_counter += 1
        return f"str_{self._strength_counter}"

    async def analyze_fit_deep(
        self,
        resume: ResumeData,
        job: ParsedJobPosting,
        job_description_text: str = ""
    ) -> EnhancedFitAnalysis:
        """
        Perform deep LLM-powered fit analysis.

        Args:
            resume: Parsed resume data
            job: Parsed job posting
            job_description_text: Raw job description for context

        Returns:
            EnhancedFitAnalysis with comprehensive insights
        """
        if not self.llm:
            # Fallback to rule-based if no LLM
            return self._rule_based_analysis(resume, job)

        try:
            # Build analysis prompt
            prompt = self._build_analysis_prompt(resume, job, job_description_text)

            # Get LLM analysis
            response = await self._call_llm(prompt)

            # Parse and structure response
            analysis = self._parse_llm_response(response, resume, job)

            return analysis

        except Exception as e:
            logger.error(f"LLM analysis failed: {e}")
            return self._rule_based_analysis(resume, job)

    def _build_analysis_prompt(
        self,
        resume: ResumeData,
        job: ParsedJobPosting,
        job_description_text: str
    ) -> str:
        """Build comprehensive analysis prompt."""

        # Format resume data
        resume_text = self._format_resume_for_prompt(resume)

        # Format job requirements
        job_text = self._format_job_for_prompt(job, job_description_text)

        return f"""You are an expert career advisor and technical recruiter. Analyze how well this candidate fits the job and provide detailed, actionable insights.

## CANDIDATE RESUME
{resume_text}

## JOB POSTING
{job_text}

## ANALYSIS INSTRUCTIONS
Provide a comprehensive fit analysis in JSON format with the following structure:

{{
    "overall_score": <0-100 integer>,
    "confidence_score": <0-100 integer representing how confident you are in this analysis>,
    "fit_tier": "<Excellent|Strong|Good|Stretch|Long Shot>",

    "executive_summary": "<2-3 sentence summary of fit>",
    "key_verdict": "<One compelling sentence: should they apply?>",

    "category_scores": {{
        "technical_skills": <0-100>,
        "experience_level": <0-100>,
        "domain_expertise": <0-100>,
        "leadership": <0-100>,
        "education": <0-100>,
        "culture_fit": <0-100>
    }},

    "gaps": [
        {{
            "category": "<years_experience|technical_skills|domain_expertise|leadership|education|certifications|soft_skills|industry_knowledge|tools_platforms>",
            "severity": "<critical|significant|moderate|minor>",
            "requirement_text": "<what the job requires>",
            "your_level": "<candidate's current level>",
            "required_level": "<job's required level>",
            "gap_description": "<clear explanation of the gap>",
            "impact_on_application": "<how this affects their chances>",
            "bridging_strategies": ["<specific action 1>", "<specific action 2>"],
            "time_to_bridge": "<realistic timeline if applicable>",
            "transferable_skills": ["<relevant skill that partially bridges gap>"],
            "talking_points": ["<how to address in interview>"]
        }}
    ],

    "strengths": [
        {{
            "category": "<category>",
            "title": "<brief title>",
            "description": "<what makes this strong>",
            "evidence": ["<specific evidence from resume>"],
            "competitive_advantage": "<why this matters for this role>",
            "how_to_leverage": "<how to highlight in application>"
        }}
    ],

    "application_strategy": "<paragraph on best approach to application>",
    "cover_letter_focus": ["<key point 1>", "<key point 2>", "<key point 3>"],
    "interview_prep": ["<topic to prepare>", "<topic to prepare>"],
    "questions_to_ask": ["<insightful question for interviewer>"],

    "rejection_risk": "<Low|Medium|High>",
    "rejection_reasons": ["<likely concern 1>", "<likely concern 2>"],
    "mitigation_strategies": ["<how to address concern 1>"],

    "competitive_position": "<paragraph on how they compare to typical applicants>",
    "differentiators": ["<unique selling point 1>", "<unique selling point 2>"]
}}

Be specific, honest, and actionable. Don't sugarcoat gaps but always provide constructive paths forward."""

    def _format_resume_for_prompt(self, resume: ResumeData) -> str:
        """Format resume data for LLM prompt."""
        sections = []

        # Basic info
        sections.append(f"Name: {resume.name}")
        sections.append(f"Location: {resume.location}")
        sections.append(f"Total Experience: {resume.total_years_experience} years")

        # Summary
        if resume.summary:
            sections.append(f"\nSummary:\n{resume.summary}")

        # Technical skills
        if resume.technical_skills:
            sections.append(f"\nTechnical Skills:\n{', '.join(resume.technical_skills)}")

        # Soft skills
        if resume.soft_skills:
            sections.append(f"\nSoft Skills:\n{', '.join(resume.soft_skills)}")

        # Experience
        if resume.experiences:
            sections.append("\nWork Experience:")
            for exp in resume.experiences:
                title = exp.get('title', 'Unknown')
                company = exp.get('company', 'Unknown')
                start = exp.get('start', '')
                end = exp.get('end', 'Present')
                sections.append(f"\n{title} at {company} ({start} - {end})")
                for bullet in exp.get('bullets', []):
                    sections.append(f"  - {bullet}")

        # Education
        if resume.education:
            sections.append("\nEducation:")
            for edu in resume.education:
                degree = edu.get('degree', '')
                school = edu.get('school', '')
                year = edu.get('year', '')
                sections.append(f"  - {degree} from {school} ({year})")

        # Projects
        if resume.projects:
            sections.append("\nProjects:")
            for proj in resume.projects:
                name = proj.get('name', '')
                desc = proj.get('description', '')
                techs = proj.get('technologies', [])
                sections.append(f"  - {name}: {desc}")
                if techs:
                    sections.append(f"    Technologies: {', '.join(techs)}")

        # Certifications
        if resume.certifications:
            sections.append(f"\nCertifications:\n{', '.join(resume.certifications)}")

        return "\n".join(sections)

    def _format_job_for_prompt(
        self,
        job: ParsedJobPosting,
        raw_description: str
    ) -> str:
        """Format job posting for LLM prompt."""
        sections = []

        sections.append(f"Title: {job.title}")
        sections.append(f"Company: {job.company}")
        sections.append(f"Location: {job.location}")

        if job.requirements:
            sections.append("\nRequirements:")
            for req in job.requirements:
                req_type = req.requirement_type.value if hasattr(req.requirement_type, 'value') else req.requirement_type
                sections.append(f"  - [{req_type.upper()}] {req.text}")

        if raw_description:
            sections.append(f"\nFull Description:\n{raw_description[:3000]}")

        return "\n".join(sections)

    async def _call_llm(self, prompt: str) -> str:
        """Call LLM with prompt."""
        try:
            if hasattr(self.llm, 'client'):
                # Anthropic provider
                response = self.llm.client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text
            else:
                # Generic provider interface
                return await self.llm.generate(prompt)
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            raise

    def _parse_llm_response(
        self,
        response: str,
        resume: ResumeData,
        job: ParsedJobPosting
    ) -> EnhancedFitAnalysis:
        """Parse LLM response into structured analysis."""

        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found in LLM response")

        try:
            data = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON: {e}")
            raise

        # Parse gaps
        gaps = []
        for g in data.get('gaps', []):
            try:
                gaps.append(DetailedGap(
                    gap_id=self._generate_gap_id(),
                    category=GapCategory(g.get('category', 'technical_skills')),
                    severity=GapSeverity(g.get('severity', 'moderate')),
                    requirement_text=g.get('requirement_text', ''),
                    your_level=g.get('your_level', 'Not specified'),
                    required_level=g.get('required_level', 'Not specified'),
                    gap_description=g.get('gap_description', ''),
                    impact_on_application=g.get('impact_on_application', ''),
                    bridging_strategies=g.get('bridging_strategies', []),
                    time_to_bridge=g.get('time_to_bridge'),
                    transferable_skills=g.get('transferable_skills', []),
                    talking_points=g.get('talking_points', [])
                ))
            except Exception as e:
                logger.warning(f"Failed to parse gap: {e}")

        # Parse strengths
        strengths = []
        for s in data.get('strengths', []):
            try:
                strengths.append(StrengthHighlight(
                    strength_id=self._generate_strength_id(),
                    category=s.get('category', 'general'),
                    title=s.get('title', ''),
                    description=s.get('description', ''),
                    evidence=s.get('evidence', []),
                    competitive_advantage=s.get('competitive_advantage', ''),
                    how_to_leverage=s.get('how_to_leverage', '')
                ))
            except Exception as e:
                logger.warning(f"Failed to parse strength: {e}")

        return EnhancedFitAnalysis(
            overall_score=data.get('overall_score', 0) / 100,
            confidence_score=data.get('confidence_score', 70) / 100,
            fit_tier=data.get('fit_tier', 'Unknown'),
            executive_summary=data.get('executive_summary', ''),
            key_verdict=data.get('key_verdict', ''),
            gaps=gaps,
            strengths=strengths,
            category_scores=data.get('category_scores', {}),
            application_strategy=data.get('application_strategy', ''),
            cover_letter_focus=data.get('cover_letter_focus', []),
            interview_prep=data.get('interview_prep', []),
            questions_to_ask=data.get('questions_to_ask', []),
            rejection_risk=data.get('rejection_risk', 'Medium'),
            rejection_reasons=data.get('rejection_reasons', []),
            mitigation_strategies=data.get('mitigation_strategies', []),
            competitive_position=data.get('competitive_position', ''),
            differentiators=data.get('differentiators', []),
            raw_analysis=data
        )

    def _rule_based_analysis(
        self,
        resume: ResumeData,
        job: ParsedJobPosting
    ) -> EnhancedFitAnalysis:
        """Fallback rule-based analysis when LLM unavailable."""

        # Simple keyword matching for score
        resume_text = " ".join([
            resume.summary or "",
            " ".join(resume.technical_skills),
            " ".join(resume.soft_skills),
            " ".join(str(exp) for exp in resume.experiences)
        ]).lower()

        total_reqs = len(job.requirements)
        matches = 0
        gaps = []

        for req in job.requirements:
            matched = any(kw.lower() in resume_text for kw in req.keywords) if req.keywords else False
            if matched:
                matches += 1
            else:
                gaps.append(DetailedGap(
                    gap_id=self._generate_gap_id(),
                    category=GapCategory.TECHNICAL_SKILLS,
                    severity=GapSeverity.MODERATE,
                    requirement_text=req.text,
                    your_level="Not demonstrated",
                    required_level="Required",
                    gap_description=f"Keywords not found: {', '.join(req.keywords or ['N/A'])}",
                    impact_on_application="May reduce match score",
                    bridging_strategies=["Add relevant experience to resume", "Address in cover letter"],
                    transferable_skills=[],
                    talking_points=[]
                ))

        score = matches / total_reqs if total_reqs > 0 else 0.5

        # Determine tier
        if score >= 0.85:
            tier = "Excellent"
        elif score >= 0.70:
            tier = "Strong"
        elif score >= 0.50:
            tier = "Good"
        elif score >= 0.30:
            tier = "Stretch"
        else:
            tier = "Long Shot"

        return EnhancedFitAnalysis(
            overall_score=score,
            confidence_score=0.6,
            fit_tier=tier,
            executive_summary=f"Based on keyword analysis, you match {matches} of {total_reqs} requirements.",
            key_verdict="Consider applying with targeted resume improvements." if score >= 0.5 else "Significant gaps exist - apply strategically.",
            gaps=gaps[:5],
            strengths=[],
            category_scores={
                "technical_skills": int(score * 100),
                "experience_level": 50,
                "domain_expertise": 50,
                "leadership": 50,
                "education": 70,
                "culture_fit": 60
            },
            application_strategy="Focus on highlighting matching skills and addressing key gaps in your cover letter.",
            cover_letter_focus=["Highlight relevant technical skills", "Address experience gaps proactively"],
            interview_prep=["Prepare examples for each matched skill", "Practice explaining transferable skills"],
            questions_to_ask=["What does success look like in this role?"],
            rejection_risk="Medium" if score >= 0.5 else "High",
            rejection_reasons=["Missing required skills"] if gaps else [],
            mitigation_strategies=["Customize resume for this role"],
            competitive_position="Average applicant position based on keyword matching.",
            differentiators=[]
        )


def analysis_to_dict(analysis: EnhancedFitAnalysis) -> Dict[str, Any]:
    """Convert EnhancedFitAnalysis to dictionary for JSON serialization."""
    return {
        "overall_score": analysis.overall_score,
        "confidence_score": analysis.confidence_score,
        "fit_tier": analysis.fit_tier,
        "executive_summary": analysis.executive_summary,
        "key_verdict": analysis.key_verdict,
        "gaps": [asdict(g) for g in analysis.gaps],
        "strengths": [asdict(s) for s in analysis.strengths],
        "category_scores": analysis.category_scores,
        "application_strategy": analysis.application_strategy,
        "cover_letter_focus": analysis.cover_letter_focus,
        "interview_prep": analysis.interview_prep,
        "questions_to_ask": analysis.questions_to_ask,
        "rejection_risk": analysis.rejection_risk,
        "rejection_reasons": analysis.rejection_reasons,
        "mitigation_strategies": analysis.mitigation_strategies,
        "competitive_position": analysis.competitive_position,
        "differentiators": analysis.differentiators
    }
