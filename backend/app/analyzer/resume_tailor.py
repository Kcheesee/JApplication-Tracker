"""Resume Tailor - Generates specific suggestions for tailoring resume to job."""
from dataclasses import dataclass, field
from typing import List, Optional

from .job_parser import ParsedJobPosting, JobRequirement
from .resume_matcher import ResumeData, FitAnalysis, MatchStrength


@dataclass
class TailoringAction:
    """Single suggested change to resume."""
    action_type: str  # "add_bullet", "add_skill", "modify_summary", "add_keyword"
    section: str      # Where to make the change
    priority: str     # "high", "medium", "low"
    suggestion: str   # What to do
    example: Optional[str] = None  # Example text if applicable
    addresses_requirement: Optional[str] = None  # Which requirement this helps


@dataclass
class TailoringPlan:
    """Complete tailoring plan for a job."""
    
    job_title: str
    company: str
    
    # Overall assessment
    current_score: float
    projected_score: float  # After tailoring
    
    # Suggested actions
    actions: List[TailoringAction] = field(default_factory=list)
    
    # Quick wins
    keywords_to_add: List[str] = field(default_factory=list)
    
    # Summary rewrite suggestion
    suggested_summary: Optional[str] = None
    
    # Cover letter points
    cover_letter_points: List[str] = field(default_factory=list)


class ResumeTailor:
    """
    Generates specific resume tailoring suggestions.
    """
    
    def __init__(self, llm_provider=None):
        self.llm = llm_provider
    
    def generate_plan(
        self,
        resume: ResumeData,
        job: ParsedJobPosting,
        analysis: FitAnalysis
    ) -> TailoringPlan:
        """
        Generate a tailoring plan based on fit analysis.
        
        Args:
            resume: Resume data
            job: Job posting
            analysis: Fit analysis result
            
        Returns:
            Complete tailoring plan
        """
        actions = []
        
        # Process gaps and partial matches
        for match in analysis.matches:
            if match.strength in [MatchStrength.GAP, MatchStrength.PARTIAL]:
                action = self._create_action(match, resume)
                if action:
                    actions.append(action)
        
        # Sort by priority (high first)
        actions.sort(key=lambda x: (
            x.priority != "high",
            x.priority != "medium"
        ))
        
        # Generate cover letter points for remaining gaps
        cover_points = self._generate_cover_points(analysis)
        
        # Project score improvement
        projected = self._project_score(analysis, actions)
        
        # Generate summary suggestion if needed
        summary = None
        if self.llm:
            summary = self._generate_summary(resume, job)
        
        return TailoringPlan(
            job_title=job.title,
            company=job.company,
            current_score=analysis.match_score,
            projected_score=projected,
            actions=actions,
            keywords_to_add=analysis.missing_keywords[:5],
            suggested_summary=summary,
            cover_letter_points=cover_points
        )
    
    def _create_action(
        self,
        match: 'RequirementMatch',
        resume: ResumeData
    ) -> Optional[TailoringAction]:
        """Create a tailoring action for a gap/partial match."""
        
        req = match.requirement
        
        # Technical skill gaps -> add to skills section
        if req.category.value == "technical" and match.strength == MatchStrength.GAP:
            return TailoringAction(
                action_type="add_skill",
                section="Technical Skills",
                priority="high",
                suggestion=f"Add {', '.join(req.keywords)} to skills if you have any experience",
                addresses_requirement=req.text
            )
        
        # Experience gaps -> suggest bullet addition
        if req.category.value == "experience" and match.strength == MatchStrength.PARTIAL:
            return TailoringAction(
                action_type="add_bullet",
                section="Experience",
                priority="high",
                suggestion=f"Add a bullet demonstrating: {req.text}",
                example=self._generate_bullet_example(req),
                addresses_requirement=req.text
            )
        
        # Partial technical match -> emphasize in bullets
        if req.category.value == "technical" and match.strength == MatchStrength.PARTIAL:
            missing = [kw for kw in req.keywords if kw not in match.evidence]
            if missing:
                return TailoringAction(
                    action_type="add_keyword",
                    section="Experience bullets",
                    priority="medium",
                    suggestion=f"Incorporate these keywords into existing bullets: {', '.join(missing)}",
                    addresses_requirement=req.text
                )
        
        # Education gaps
        if req.category.value == "education" and match.strength == MatchStrength.GAP:
            return TailoringAction(
                action_type="add_skill",
                section="Education",
                priority="medium",
                suggestion=f"Add education details or relevant certifications",
                addresses_requirement=req.text
            )
        
        # Soft skills gaps
        if req.category.value == "soft_skills" and match.strength in [MatchStrength.GAP, MatchStrength.WEAK]:
            return TailoringAction(
                action_type="add_bullet",
                section="Experience",
                priority="low",
                suggestion=f"Demonstrate '{req.text}' in experience bullets with specific examples",
                addresses_requirement=req.text
            )
        
        return None
    
    def _generate_bullet_example(self, req: JobRequirement) -> str:
        """Generate an example bullet for a requirement."""
        # This would ideally use LLM for better examples
        if req.keywords:
            keywords_text = ' and '.join(req.keywords[:2])
            return f"• [Action verb] + [specific achievement] using {keywords_text}, resulting in [measurable outcome]"
        return "• [Action verb] + [specific achievement] demonstrating [relevant skill], resulting in [measurable outcome]"
    
    def _generate_cover_points(self, analysis: FitAnalysis) -> List[str]:
        """Generate points to address in cover letter."""
        points = []
        
        for match in analysis.matches:
            if match.strength == MatchStrength.GAP:
                if match.requirement.requirement_type.value == "required":
                    points.append(
                        f"Address gap in: {match.requirement.text} - "
                        f"Explain transferable skills or rapid learning ability"
                    )
        
        return points[:3]  # Top 3 only
    
    def _project_score(
        self,
        analysis: FitAnalysis,
        actions: List[TailoringAction]
    ) -> float:
        """Project score after implementing actions."""
        # Simple heuristic: high priority actions worth 0.05 each
        improvement = sum(
            0.05 if a.priority == "high" else 0.02
            for a in actions[:5]  # Cap improvement
        )
        return min(1.0, analysis.match_score + improvement)
    
    def _generate_summary(
        self,
        resume: ResumeData,
        job: ParsedJobPosting
    ) -> Optional[str]:
        """Generate a tailored summary using LLM."""
        if not self.llm:
            return None
        
        # Would use LLM to rewrite summary targeting job requirements
        # Placeholder for future LLM integration
        return None
