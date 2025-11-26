"""Resume Matcher - Matches resumes against job requirements."""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum

from .job_parser import ParsedJobPosting, JobRequirement, RequirementCategory


class MatchStrength(str, Enum):
    """Strength of requirement match."""
    STRONG = "strong"       # Clearly meets or exceeds
    MATCH = "match"         # Meets requirement
    PARTIAL = "partial"     # Partially meets
    WEAK = "weak"           # Tangentially related
    GAP = "gap"             # Does not meet


@dataclass
class RequirementMatch:
    """Match result for a single requirement."""
    requirement: JobRequirement
    strength: MatchStrength
    
    # Evidence from resume
    evidence: List[str] = field(default_factory=list)  # Resume bullets that support
    
    # Analysis
    explanation: str = ""
    
    # If gap or partial, what would help
    suggestion: Optional[str] = None
    
    # Confidence in this match assessment
    confidence: float = 0.0


@dataclass
class FitAnalysis:
    """Complete fit analysis result."""
    
    # Overall score
    match_score: float              # 0.0 - 1.0
    match_label: str                # "Strong Match", "Good Match", etc.
    
    # Recommendation
    should_apply: bool
    recommendation: str             # Human-readable recommendation
    
    # Breakdown
    matches: List[RequirementMatch] = field(default_factory=list)
    
    # Summary counts
    strong_matches: int = 0
    matches_count: int = 0
    partial_matches: int = 0
    gaps: int = 0
    
    # Dealbreakers (location, clearance, etc.)
    dealbreakers: List[str] = field(default_factory=list)
    
    # Top suggestions for improvement
    top_suggestions: List[str] = field(default_factory=list)
    
    # Keywords to add to resume
    missing_keywords: List[str] = field(default_factory=list)


@dataclass
class ResumeData:
    """Structured resume data."""
    
    # Contact
    name: str
    email: str
    location: str
    
    # Summary
    summary: str = ""
    
    # Experience
    experiences: List[Dict[str, Any]] = field(default_factory=list)
    # Each: {title, company, start, end, bullets: []}
    
    # Skills
    technical_skills: List[str] = field(default_factory=list)
    soft_skills: List[str] = field(default_factory=list)
    
    # Education
    education: List[Dict[str, Any]] = field(default_factory=list)
    # Each: {degree, school, year, gpa}
    
    # Projects
    projects: List[Dict[str, Any]] = field(default_factory=list)
    # Each: {name, description, technologies, url}
    
    # Certifications
    certifications: List[str] = field(default_factory=list)
    
    # Computed
    total_years_experience: int = 0
    industries: List[str] = field(default_factory=list)


class ResumeMatcher:
    """
    Matches resume against job requirements.
    
    Uses TrustChain's criteria decomposition approach.
    """
    
    def __init__(self, llm_provider=None):
        self.llm = llm_provider
    
    def analyze_fit(
        self,
        resume: ResumeData,
        job: ParsedJobPosting
    ) -> FitAnalysis:
        """
        Analyze how well resume fits job requirements.
        
        Args:
            resume: Parsed resume data
            job: Parsed job posting
            
        Returns:
            Complete fit analysis
        """
        matches = []
        
        for req in job.requirements:
            match = self._match_requirement(resume, req)
            matches.append(match)
        
        # Calculate overall score
        score = self._calculate_score(matches)
        
        # Determine label
        label = self._score_to_label(score)
        
        # Check dealbreakers
        dealbreakers = self._check_dealbreakers(resume, job, matches)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(matches)
        
        # Find missing keywords
        missing_kw = self._find_missing_keywords(resume, job)
        
        # Count by strength
        strong = sum(1 for m in matches if m.strength == MatchStrength.STRONG)
        match_count = sum(1 for m in matches if m.strength == MatchStrength.MATCH)
        partial = sum(1 for m in matches if m.strength == MatchStrength.PARTIAL)
        gaps = sum(1 for m in matches if m.strength == MatchStrength.GAP)
        
        # Recommendation
        should_apply = score >= 0.5 and len(dealbreakers) == 0
        recommendation = self._generate_recommendation(
            score, matches, dealbreakers
        )
        
        return FitAnalysis(
            match_score=score,
            match_label=label,
            should_apply=should_apply,
            recommendation=recommendation,
            matches=matches,
            strong_matches=strong,
            matches_count=match_count,
            partial_matches=partial,
            gaps=gaps,
            dealbreakers=dealbreakers,
            top_suggestions=suggestions[:5],
            missing_keywords=missing_kw[:10]
        )
    
    def _match_requirement(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match a single requirement against resume."""
        
        # Strategy depends on requirement category
        if req.category == RequirementCategory.EXPERIENCE:
            return self._match_experience(resume, req)
        elif req.category == RequirementCategory.TECHNICAL_SKILLS:
            return self._match_technical(resume, req)
        elif req.category == RequirementCategory.EDUCATION:
            return self._match_education(resume, req)
        elif req.category == RequirementCategory.SOFT_SKILLS:
            return self._match_soft_skills(resume, req)
        elif req.category == RequirementCategory.LOGISTICS:
            return self._match_logistics(resume, req)
        else:
            return self._match_generic(resume, req)
    
    def _match_experience(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match experience requirements."""
        
        if req.years_experience:
            if resume.total_years_experience >= req.years_experience:
                strength = MatchStrength.STRONG if resume.total_years_experience >= req.years_experience + 2 else MatchStrength.MATCH
                return RequirementMatch(
                    requirement=req,
                    strength=strength,
                    evidence=[f"{resume.total_years_experience} years of experience"],
                    explanation=f"Resume shows {resume.total_years_experience} years, requirement is {req.years_experience}+",
                    confidence=0.95
                )
            elif resume.total_years_experience >= req.years_experience - 1:
                return RequirementMatch(
                    requirement=req,
                    strength=MatchStrength.PARTIAL,
                    evidence=[f"{resume.total_years_experience} years of experience"],
                    explanation=f"Slightly under requirement ({resume.total_years_experience} vs {req.years_experience}+)",
                    suggestion="Emphasize depth of experience and accelerated growth",
                    confidence=0.85
                )
            else:
                return RequirementMatch(
                    requirement=req,
                    strength=MatchStrength.GAP,
                    explanation=f"Gap: {resume.total_years_experience} years vs {req.years_experience}+ required",
                    suggestion="Address in cover letter if applying - focus on quality over quantity",
                    confidence=0.9
                )
        
        # Generic experience match
        return self._keyword_match(resume, req)
    
    def _match_technical(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match technical skill requirements."""
        
        resume_skills_lower = [s.lower() for s in resume.technical_skills]
        
        matched_keywords = []
        for kw in req.keywords:
            # Check if keyword is contained WITHIN any skill (substring match)
            if any(kw.lower() in skill for skill in resume_skills_lower):
                matched_keywords.append(kw)
        
        # Also check summary, experience bullets, and projects
        all_text = (resume.summary or "").lower() + " "

        all_text += " ".join([
            " ".join(exp.get("bullets", []))
            for exp in resume.experiences
        ]).lower()

        all_text += " ".join([
            p.get("description", "") + " ".join(p.get("technologies", []))
            for p in resume.projects
        ]).lower()
        
        for kw in req.keywords:
            if kw.lower() in all_text and kw not in matched_keywords:
                matched_keywords.append(kw)
        
        if len(matched_keywords) == len(req.keywords) and req.keywords:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.STRONG,
                evidence=matched_keywords,
                explanation=f"All keywords found: {', '.join(matched_keywords)}",
                confidence=0.9
            )
        elif len(matched_keywords) > 0:
            missing = [kw for kw in req.keywords if kw not in matched_keywords]
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.PARTIAL,
                evidence=matched_keywords,
                explanation=f"Partial match: found {matched_keywords}, missing {missing}",
                suggestion=f"Add {', '.join(missing)} to skills section if you have this experience",
                confidence=0.8
            )
        else:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.GAP,
                explanation=f"Keywords not found: {req.keywords}",
                suggestion=f"Consider adding relevant experience or noting transferable skills",
                confidence=0.85
            )
    
    def _match_education(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match education requirements."""
        # Check if candidate has any degree
        if resume.education:
            # Simple check: if they have a degree, consider it a match
            degree_text = " ".join([
                f"{ed.get('degree', '')} {ed.get('school', '')}"
                for ed in resume.education
            ]).lower()
            
            # Check for key education terms
            if any(keyword in degree_text for keyword in ["bachelor", "bs", "b.s.", "master", "ms", "m.s."]):
                return RequirementMatch(
                    requirement=req,
                    strength=MatchStrength.MATCH,
                    evidence=[resume.education[0].get("degree", "Degree")],
                    explanation="Education requirement met",
                    confidence=0.9
                )
        
        return RequirementMatch(
            requirement=req,
            strength=MatchStrength.GAP,
            explanation="No matching education found",
            suggestion="Add education details if you have relevant degree",
            confidence=0.8
        )
    
    def _match_soft_skills(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match soft skill requirements."""
        # Check if soft skills are mentioned
        resume_soft_lower = [s.lower() for s in resume.soft_skills]
        req_keywords_lower = [k.lower() for k in req.keywords]
        
        # Also check in experience bullets for evidence
        bullets_text = " ".join([
            " ".join(exp.get("bullets", []))
            for exp in resume.experiences
        ]).lower()
        
        matched = []
        for skill in resume_soft_lower:
            if any(kw in skill for kw in req_keywords_lower):
                matched.append(skill)
        
        # Check bullets for evidence
        if any(kw in bullets_text for kw in req_keywords_lower):
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.MATCH,
                evidence=matched or ["Demonstrated in experience"],
                explanation="Soft skill evidenced in experience",
                confidence=0.75
            )
        elif matched:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.MATCH,
                evidence=matched,
                confidence=0.7
            )
        else:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.WEAK,
                explanation="Soft skill not explicitly mentioned",
                suggestion="Demonstrate this skill in experience bullets",
                confidence=0.6
            )
    
    def _match_logistics(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match logistics requirements (location, clearance, etc.)."""
        req_lower = req.text.lower()
        
        # Check clearance
        if "clearance" in req_lower:
            resume_certs = " ".join(resume.certifications).lower()
            if "clearance" in resume_certs:
                return RequirementMatch(
                    requirement=req,
                    strength=MatchStrength.MATCH,
                    evidence=["Clearance noted in resume"],
                    confidence=0.9
                )
            else:
                return RequirementMatch(
                    requirement=req,
                    strength=MatchStrength.GAP,
                    explanation="Security clearance required but not found on resume",
                    suggestion="Add clearance status if you have one, or note eligibility",
                    confidence=0.85
                )
        
        # Can't auto-determine location compatibility
        return RequirementMatch(
            requirement=req,
            strength=MatchStrength.PARTIAL,
            explanation="Location/logistics requirement - verify compatibility",
            suggestion="Confirm you can meet location/logistics requirements",
            confidence=0.5
        )
    
    def _match_generic(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Generic matching using keyword search."""
        return self._keyword_match(resume, req)
    
    def _keyword_match(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Fallback keyword-based matching."""
        # Combine all resume text
        all_text = f"{resume.summary} "
        all_text += " ".join([
            f"{exp.get('title', '')} {exp.get('company', '')} {' '.join(exp.get('bullets', []))}"
            for exp in resume.experiences
        ])
        all_text += " ".join([
            f"{p.get('name', '')} {p.get('description', '')}"
            for p in resume.projects
        ])
        all_text = all_text.lower()
        
        # Check requirement keywords
        matches = sum(1 for kw in req.keywords if kw.lower() in all_text)
        
        if matches == len(req.keywords) and req.keywords:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.MATCH,
                evidence=req.keywords,
                confidence=0.7
            )
        elif matches > 0:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.PARTIAL,
                evidence=[kw for kw in req.keywords if kw.lower() in all_text],
                confidence=0.6
            )
        else:
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.WEAK,
                confidence=0.5
            )
    
    def _calculate_score(self, matches: List[RequirementMatch]) -> float:
        """Calculate overall match score."""
        if not matches:
            return 0.0
        
        strength_scores = {
            MatchStrength.STRONG: 1.0,
            MatchStrength.MATCH: 0.85,
            MatchStrength.PARTIAL: 0.5,
            MatchStrength.WEAK: 0.25,
            MatchStrength.GAP: 0.0
        }
        
        # Weight required requirements higher
        total_weight = 0
        weighted_score = 0
        
        for m in matches:
            weight = 2.0 if m.requirement.requirement_type.value == "required" else 1.0
            score = strength_scores[m.strength] * m.confidence
            
            weighted_score += score * weight
            total_weight += weight
        
        return weighted_score / total_weight if total_weight > 0 else 0.0
    
    def _score_to_label(self, score: float) -> str:
        """Convert score to human label."""
        if score >= 0.85:
            return "Strong Match"
        elif score >= 0.7:
            return "Good Match"
        elif score >= 0.5:
            return "Moderate Match"
        elif score >= 0.3:
            return "Weak Match"
        else:
            return "Poor Fit"
    
    def _check_dealbreakers(
        self,
        resume: ResumeData,
        job: ParsedJobPosting,
        matches: List[RequirementMatch]
    ) -> List[str]:
        """Check for dealbreaker mismatches."""
        dealbreakers = []
        
        for m in matches:
            if m.requirement.is_dealbreaker and m.strength == MatchStrength.GAP:
                dealbreakers.append(m.requirement.text)
        
        return dealbreakers
    
    def _generate_suggestions(
        self,
        matches: List[RequirementMatch]
    ) -> List[str]:
        """Generate top suggestions from gaps and partial matches."""
        suggestions = []
        
        # Prioritize required gaps, then required partials, then preferred
        for m in sorted(matches, key=lambda x: (
            x.requirement.requirement_type.value != "required",
            x.strength != MatchStrength.GAP,
            x.strength != MatchStrength.PARTIAL
        )):
            if m.suggestion and m.strength in [MatchStrength.GAP, MatchStrength.PARTIAL]:
                suggestions.append(m.suggestion)
        
        return suggestions
    
    def _find_missing_keywords(
        self,
        resume: ResumeData,
        job: ParsedJobPosting
    ) -> List[str]:
        """Find keywords in job posting missing from resume."""
        all_resume_text = f"{resume.summary} "
        all_resume_text += " ".join(resume.technical_skills)
        all_resume_text += " ".join([
            " ".join(exp.get("bullets", []))
            for exp in resume.experiences
        ])
        all_resume_text = all_resume_text.lower()
        
        missing = []
        for req in job.requirements:
            for kw in req.keywords:
                if kw.lower() not in all_resume_text and kw not in missing:
                    missing.append(kw)
        
        return missing
    
    def _generate_recommendation(
        self,
        score: float,
        matches: List[RequirementMatch],
        dealbreakers: List[str]
    ) -> str:
        """Generate human-readable recommendation."""
        if dealbreakers:
            return f"CAUTION: Dealbreaker requirements not met: {', '.join(dealbreakers)}. Apply only if you can address these."
        
        if score >= 0.85:
            return "STRONG FIT: Your background aligns well. Apply with confidence."
        elif score >= 0.7:
            return "GOOD FIT: Solid match with minor gaps. Apply and address gaps in cover letter."
        elif score >= 0.5:
            return "MODERATE FIT: You meet core requirements but have notable gaps. Apply if you can make a compelling case for transferable skills."
        elif score >= 0.3:
            return "STRETCH: Significant gaps exist. Consider if this is worth your time, or use as a growth target."
        else:
            return "NOT RECOMMENDED: Major misalignment with requirements. Focus energy elsewhere."
