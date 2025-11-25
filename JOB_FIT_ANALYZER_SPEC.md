# Job Fit Analyzer - Feature Spec

**Purpose**: Integrate TrustChain's evaluation framework into Job Application Tracker to give candidates the transparency employers won't provide.

**Author**: Kareem Primo + Claude (November 2025)

---

## The Problem

Candidates apply blind. They read a job posting, guess if they match, tailor their resume based on vibes, and hope for the best. They get ghosted with no feedback. They don't know:

- Which requirements they actually meet
- Which gaps are killing their application
- What to add to their resume
- Whether it's even worth applying

Meanwhile, employers use AI to screen them out in seconds.

**The fix**: Give candidates the same AI-powered analysis. Level the playing field.

---

## The Solution

**Job Fit Analyzer** - paste a job URL, get an honest assessment.

```
┌─────────────────────────────────────────────────────────────────┐
│                      JOB FIT ANALYZER                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Paste Job URL: [https://company.com/jobs/12345    ]   │   │
│  │                                           [Analyze]     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │   MATCH SCORE: 84%              [STRONG MATCH]         │   │
│  │                                                         │   │
│  │   ✓ 6 requirements met                                  │   │
│  │   ○ 2 partial matches                                   │   │
│  │   ✗ 1 gap to address                                    │   │
│  │                                                         │   │
│  │   Recommendation: APPLY - address gaps in cover letter  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [View Full Analysis]  [Tailor Resume]  [Save to Tracker]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow

### Flow 1: Quick Analysis

```
1. User finds interesting job posting
2. Copies URL
3. Pastes into Job Fit Analyzer
4. System fetches and parses job posting
5. System runs resume against requirements
6. User sees match score + breakdown
7. User decides whether to apply
```

### Flow 2: Resume Tailoring

```
1. User runs analysis (Flow 1)
2. Clicks "Tailor Resume"
3. System shows specific suggestions:
   - Bullets to add
   - Keywords to include
   - Gaps to address in cover letter
4. User applies suggestions
5. Re-runs analysis to confirm improvement
```

### Flow 3: Application Tracking Integration

```
1. User runs analysis (Flow 1)
2. Clicks "Save to Tracker"
3. Job automatically added to tracker with:
   - Company, title, URL
   - Match score
   - Analysis snapshot
   - Status: "Ready to Apply"
4. User can track progress from there
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     JOB APPLICATION TRACKER                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   JOB FIT ANALYZER                       │   │
│  │                                                         │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │   │
│  │  │ Job Parser  │───▶│ Requirement │───▶│ Gap        │  │   │
│  │  │             │    │ Extractor   │    │ Analyzer   │  │   │
│  │  └─────────────┘    └─────────────┘    └────────────┘  │   │
│  │         │                  │                  │         │   │
│  │         ▼                  ▼                  ▼         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              TRUSTCHAIN CORE                     │   │   │
│  │  │                                                 │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │   │   │
│  │  │  │ Criteria    │  │ Gap         │  │ Resume  │ │   │   │
│  │  │  │ Decomp      │  │ Analysis    │  │ Tailor  │ │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────┘ │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                          │                              │   │
│  │                          ▼                              │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │              FIT ANALYSIS OUTPUT                 │   │   │
│  │  │  - Match score                                   │   │   │
│  │  │  - Criteria breakdown                            │   │   │
│  │  │  - Gaps + suggestions                            │   │   │
│  │  │  - Tailoring recommendations                     │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐   │
│  │ Resume Storage  │  │ Job Tracker DB  │  │ Analysis Log  │   │
│  └─────────────────┘  └─────────────────┘  └───────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Specs

### 1. Job Posting Parser

**File**: `backend/analyzer/job_parser.py`

Fetches and extracts structured data from job posting URLs.

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum
import httpx
from bs4 import BeautifulSoup
import re


class RequirementType(str, Enum):
    REQUIRED = "required"
    PREFERRED = "preferred"
    NICE_TO_HAVE = "nice_to_have"


class RequirementCategory(str, Enum):
    EXPERIENCE = "experience"          # Years, industry, role type
    TECHNICAL_SKILLS = "technical"     # Languages, tools, platforms
    SOFT_SKILLS = "soft_skills"        # Communication, leadership
    EDUCATION = "education"            # Degree, certifications
    DOMAIN = "domain"                  # Industry knowledge
    LOGISTICS = "logistics"            # Location, travel, clearance


@dataclass
class JobRequirement:
    """Single extracted requirement from job posting."""
    text: str                                    # Original text
    category: RequirementCategory
    requirement_type: RequirementType
    keywords: List[str] = field(default_factory=list)
    years_experience: Optional[int] = None       # If experience requirement
    is_dealbreaker: bool = False                 # Location, clearance, etc.


@dataclass
class ParsedJobPosting:
    """Structured representation of a job posting."""
    
    # Basic info
    url: str
    title: str
    company: str
    location: str
    
    # Parsed requirements
    requirements: List[JobRequirement] = field(default_factory=list)
    
    # Raw sections (for reference)
    description: str = ""
    responsibilities: List[str] = field(default_factory=list)
    qualifications: List[str] = field(default_factory=list)
    benefits: List[str] = field(default_factory=list)
    
    # Metadata
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None  # Full-time, contract, etc.
    remote_policy: Optional[str] = None    # Remote, hybrid, onsite
    
    # Parsing metadata
    parse_confidence: float = 0.0
    parse_warnings: List[str] = field(default_factory=list)


class JobPostingParser:
    """
    Parses job posting URLs into structured requirements.
    
    Handles common job boards:
    - Greenhouse
    - Lever
    - LinkedIn
    - Workday
    - Direct company pages
    """
    
    # Patterns for requirement extraction
    EXPERIENCE_PATTERNS = [
        r"(\d+)\+?\s*years?\s*(of)?\s*(experience)?",
        r"(\d+)-(\d+)\s*years?",
        r"at least (\d+) years?",
        r"minimum (\d+) years?",
    ]
    
    REQUIRED_SIGNALS = [
        "required", "must have", "must be", "need to have",
        "you have", "you bring", "requirements"
    ]
    
    PREFERRED_SIGNALS = [
        "preferred", "nice to have", "bonus", "ideally",
        "advantage", "a plus", "beneficial"
    ]
    
    def __init__(self, llm_provider=None):
        """
        Initialize parser.
        
        Args:
            llm_provider: Optional LLM for enhanced parsing
        """
        self.llm = llm_provider
        self.client = httpx.AsyncClient(
            follow_redirects=True,
            timeout=30.0,
            headers={"User-Agent": "Mozilla/5.0 (compatible; JobAnalyzer/1.0)"}
        )
    
    async def parse(self, url: str) -> ParsedJobPosting:
        """
        Parse a job posting URL.
        
        Args:
            url: Job posting URL
            
        Returns:
            ParsedJobPosting with extracted requirements
        """
        # Fetch the page
        html = await self._fetch_page(url)
        
        # Detect job board type and use appropriate extractor
        if "greenhouse.io" in url:
            raw_data = self._parse_greenhouse(html)
        elif "lever.co" in url:
            raw_data = self._parse_lever(html)
        elif "linkedin.com" in url:
            raw_data = self._parse_linkedin(html)
        else:
            raw_data = self._parse_generic(html)
        
        # Extract structured requirements
        requirements = await self._extract_requirements(raw_data)
        
        return ParsedJobPosting(
            url=url,
            title=raw_data.get("title", "Unknown"),
            company=raw_data.get("company", "Unknown"),
            location=raw_data.get("location", "Unknown"),
            requirements=requirements,
            description=raw_data.get("description", ""),
            responsibilities=raw_data.get("responsibilities", []),
            qualifications=raw_data.get("qualifications", []),
            salary_range=raw_data.get("salary"),
            employment_type=raw_data.get("employment_type"),
            remote_policy=raw_data.get("remote_policy"),
            parse_confidence=raw_data.get("confidence", 0.5)
        )
    
    async def _fetch_page(self, url: str) -> str:
        """Fetch page HTML."""
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text
    
    def _parse_greenhouse(self, html: str) -> Dict[str, Any]:
        """Parse Greenhouse job board format."""
        soup = BeautifulSoup(html, 'html.parser')
        # Greenhouse-specific selectors
        # ... implementation
        pass
    
    def _parse_lever(self, html: str) -> Dict[str, Any]:
        """Parse Lever job board format."""
        pass
    
    def _parse_linkedin(self, html: str) -> Dict[str, Any]:
        """Parse LinkedIn job format."""
        pass
    
    def _parse_generic(self, html: str) -> Dict[str, Any]:
        """Generic parser for unknown formats."""
        pass
    
    async def _extract_requirements(
        self, 
        raw_data: Dict[str, Any]
    ) -> List[JobRequirement]:
        """
        Extract structured requirements from raw text.
        
        Uses pattern matching + optional LLM for complex parsing.
        """
        requirements = []
        
        # Combine qualifications and any requirements sections
        qual_text = raw_data.get("qualifications", [])
        if isinstance(qual_text, str):
            qual_text = qual_text.split("\n")
        
        for line in qual_text:
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            req = self._parse_requirement_line(line)
            if req:
                requirements.append(req)
        
        # Use LLM for enhanced extraction if available
        if self.llm and raw_data.get("description"):
            llm_requirements = await self._llm_extract_requirements(
                raw_data["description"]
            )
            requirements.extend(llm_requirements)
        
        return self._dedupe_requirements(requirements)
    
    def _parse_requirement_line(self, line: str) -> Optional[JobRequirement]:
        """Parse a single requirement line."""
        line_lower = line.lower()
        
        # Determine if required or preferred
        req_type = RequirementType.REQUIRED
        for signal in self.PREFERRED_SIGNALS:
            if signal in line_lower:
                req_type = RequirementType.PREFERRED
                break
        
        # Determine category
        category = self._categorize_requirement(line)
        
        # Extract years of experience if present
        years = None
        for pattern in self.EXPERIENCE_PATTERNS:
            match = re.search(pattern, line_lower)
            if match:
                years = int(match.group(1))
                break
        
        # Extract keywords
        keywords = self._extract_keywords(line)
        
        return JobRequirement(
            text=line,
            category=category,
            requirement_type=req_type,
            keywords=keywords,
            years_experience=years
        )
    
    def _categorize_requirement(self, text: str) -> RequirementCategory:
        """Categorize a requirement."""
        text_lower = text.lower()
        
        if any(w in text_lower for w in ["year", "experience", "background"]):
            return RequirementCategory.EXPERIENCE
        elif any(w in text_lower for w in ["python", "java", "sql", "api", "cloud", "aws"]):
            return RequirementCategory.TECHNICAL_SKILLS
        elif any(w in text_lower for w in ["degree", "bachelor", "master", "phd", "certification"]):
            return RequirementCategory.EDUCATION
        elif any(w in text_lower for w in ["communication", "leadership", "team", "collaborate"]):
            return RequirementCategory.SOFT_SKILLS
        elif any(w in text_lower for w in ["location", "remote", "hybrid", "travel", "clearance"]):
            return RequirementCategory.LOGISTICS
        else:
            return RequirementCategory.DOMAIN
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from requirement text."""
        # Common technical keywords to look for
        tech_keywords = [
            "python", "javascript", "typescript", "java", "sql", "react",
            "fastapi", "flask", "django", "aws", "azure", "gcp", "docker",
            "kubernetes", "api", "rest", "graphql", "postgresql", "mongodb",
            "llm", "ai", "ml", "machine learning", "data", "analytics"
        ]
        
        text_lower = text.lower()
        found = [kw for kw in tech_keywords if kw in text_lower]
        return found
    
    def _dedupe_requirements(
        self, 
        requirements: List[JobRequirement]
    ) -> List[JobRequirement]:
        """Remove duplicate requirements."""
        seen = set()
        unique = []
        for req in requirements:
            key = req.text.lower().strip()
            if key not in seen:
                seen.add(key)
                unique.append(req)
        return unique
```

### 2. Resume Matcher

**File**: `backend/analyzer/resume_matcher.py`

Matches resume against parsed job requirements.

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum

from .job_parser import ParsedJobPosting, JobRequirement, RequirementCategory


class MatchStrength(str, Enum):
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
    match_label: str                # "Strong Match", "Good Match", "Weak Match", "Poor Fit"
    
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
    
    async def analyze_fit(
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
            match = await self._match_requirement(resume, req)
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
    
    async def _match_requirement(
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
            return await self._match_generic(resume, req)
    
    def _match_experience(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match experience requirements."""
        
        if req.years_experience:
            if resume.total_years_experience >= req.years_experience:
                return RequirementMatch(
                    requirement=req,
                    strength=MatchStrength.STRONG if resume.total_years_experience >= req.years_experience + 2 else MatchStrength.MATCH,
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
            if kw.lower() in resume_skills_lower:
                matched_keywords.append(kw)
        
        # Also check experience bullets and projects
        all_text = " ".join([
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
        
        if len(matched_keywords) == len(req.keywords):
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
        # Check degree levels, relevant fields, etc.
        pass
    
    def _match_soft_skills(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match soft skill requirements."""
        # Look for evidence in experience bullets
        pass
    
    def _match_logistics(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Match logistics requirements (location, clearance, etc.)."""
        req_lower = req.text.lower()
        
        # Check location
        if "location" in req_lower or "hybrid" in req_lower or "onsite" in req_lower:
            # This is potentially a dealbreaker
            return RequirementMatch(
                requirement=req,
                strength=MatchStrength.PARTIAL,  # Can't auto-determine
                explanation="Location requirement - verify compatibility",
                suggestion="Confirm you can meet location/hybrid requirements",
                confidence=0.5
            )
        
        # Check clearance
        if "clearance" in req_lower:
            if "clearance" in " ".join(resume.certifications).lower():
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
        
        return self._keyword_match(resume, req)
    
    async def _match_generic(
        self,
        resume: ResumeData,
        req: JobRequirement
    ) -> RequirementMatch:
        """Generic matching using LLM if available."""
        if self.llm:
            # Use LLM to assess match
            pass
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
```

### 3. Resume Tailor

**File**: `backend/analyzer/resume_tailor.py`

Generates specific suggestions for tailoring resume to job.

```python
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
    
    async def generate_plan(
        self,
        resume: ResumeData,
        job: ParsedJobPosting,
        analysis: FitAnalysis
    ) -> TailoringPlan:
        """
        Generate a tailoring plan based on fit analysis.
        """
        actions = []
        
        # Process gaps and partial matches
        for match in analysis.matches:
            if match.strength in [MatchStrength.GAP, MatchStrength.PARTIAL]:
                action = self._create_action(match, resume)
                if action:
                    actions.append(action)
        
        # Sort by priority
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
            summary = await self._generate_summary(resume, job)
        
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
            return TailoringAction(
                action_type="add_keyword",
                section="Experience bullets",
                priority="medium",
                suggestion=f"Incorporate these keywords into existing bullets: {', '.join(missing)}",
                addresses_requirement=req.text
            )
        
        return None
    
    def _generate_bullet_example(self, req: JobRequirement) -> str:
        """Generate an example bullet for a requirement."""
        # This would ideally use LLM for better examples
        if req.keywords:
            return f"• [Action verb] + [specific achievement] using {' and '.join(req.keywords[:2])}, resulting in [measurable outcome]"
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
    
    async def _generate_summary(
        self,
        resume: ResumeData,
        job: ParsedJobPosting
    ) -> Optional[str]:
        """Generate a tailored summary using LLM."""
        if not self.llm:
            return None
        
        # Would use LLM to rewrite summary targeting job requirements
        pass
```

### 4. API Endpoints

**File**: `backend/routers/analyzer.py`

```python
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Optional
from pydantic import BaseModel

from analyzer.job_parser import JobPostingParser, ParsedJobPosting
from analyzer.resume_matcher import ResumeMatcher, ResumeData, FitAnalysis
from analyzer.resume_tailor import ResumeTailor, TailoringPlan


router = APIRouter(prefix="/api/analyzer", tags=["Job Fit Analyzer"])


class AnalyzeRequest(BaseModel):
    job_url: str
    resume_id: Optional[str] = None  # Use stored resume
    

class AnalyzeResponse(BaseModel):
    job: dict
    analysis: dict
    

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_job_fit(request: AnalyzeRequest):
    """
    Analyze how well your resume fits a job posting.
    
    1. Paste job URL
    2. Get match score and breakdown
    """
    # Parse job posting
    parser = JobPostingParser()
    try:
        job = await parser.parse(request.job_url)
    except Exception as e:
        raise HTTPException(400, f"Could not parse job posting: {e}")
    
    # Get resume (from storage or request)
    resume = await get_resume(request.resume_id)
    if not resume:
        raise HTTPException(400, "Resume not found")
    
    # Run analysis
    matcher = ResumeMatcher()
    analysis = await matcher.analyze_fit(resume, job)
    
    return AnalyzeResponse(
        job=job.__dict__,
        analysis=analysis.__dict__
    )


@router.post("/tailor")
async def get_tailoring_plan(request: AnalyzeRequest):
    """
    Get specific suggestions for tailoring resume to job.
    """
    # Parse and analyze (same as above)
    parser = JobPostingParser()
    job = await parser.parse(request.job_url)
    resume = await get_resume(request.resume_id)
    
    matcher = ResumeMatcher()
    analysis = await matcher.analyze_fit(resume, job)
    
    # Generate tailoring plan
    tailor = ResumeTailor()
    plan = await tailor.generate_plan(resume, job, analysis)
    
    return plan.__dict__


@router.post("/quick-check")
async def quick_check(job_url: str):
    """
    Quick check - just parse the job and return requirements.
    No resume matching, just see what they're asking for.
    """
    parser = JobPostingParser()
    job = await parser.parse(job_url)
    
    return {
        "title": job.title,
        "company": job.company,
        "requirements_count": len(job.requirements),
        "requirements": [
            {
                "text": r.text,
                "category": r.category.value,
                "type": r.requirement_type.value,
                "keywords": r.keywords
            }
            for r in job.requirements
        ]
    }


@router.post("/save-to-tracker")
async def save_analysis_to_tracker(
    job_url: str,
    analysis_id: str
):
    """
    Save analyzed job to the job application tracker.
    """
    # Get cached analysis
    # Create job tracker entry with analysis attached
    pass


async def get_resume(resume_id: Optional[str]) -> Optional[ResumeData]:
    """Get resume from storage."""
    # Would integrate with resume storage system
    pass
```

### 5. Frontend Components

**File**: `frontend/src/components/JobFitAnalyzer.tsx`

```tsx
import React, { useState } from 'react';

interface FitAnalysis {
  match_score: number;
  match_label: string;
  should_apply: boolean;
  recommendation: string;
  strong_matches: number;
  matches_count: number;
  partial_matches: number;
  gaps: number;
  dealbreakers: string[];
  top_suggestions: string[];
  missing_keywords: string[];
  matches: RequirementMatch[];
}

interface RequirementMatch {
  requirement: {
    text: string;
    category: string;
    requirement_type: string;
  };
  strength: 'strong' | 'match' | 'partial' | 'weak' | 'gap';
  evidence: string[];
  explanation: string;
  suggestion?: string;
}

export const JobFitAnalyzer: React.FC = () => {
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeJob = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyzer/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_url: jobUrl })
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-100';
      case 'match': return 'text-green-500 bg-green-50';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'weak': return 'text-orange-500 bg-orange-100';
      case 'gap': return 'text-red-600 bg-red-100';
      default: return 'text-gray-500';
    }
  };

  const getStrengthIcon = (strength: string) => {
    switch (strength) {
      case 'strong': return '✓✓';
      case 'match': return '✓';
      case 'partial': return '○';
      case 'weak': return '△';
      case 'gap': return '✗';
      default: return '?';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Job Fit Analyzer</h1>
      
      {/* URL Input */}
      <div className="flex gap-4 mb-8">
        <input
          type="url"
          value={jobUrl}
          onChange={(e) => setJobUrl(e.target.value)}
          placeholder="Paste job posting URL..."
          className="flex-1 p-3 border rounded-lg"
        />
        <button
          onClick={analyzeJob}
          disabled={loading || !jobUrl}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg mb-6">
          {error}
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-4xl font-bold">
                  {Math.round(analysis.match_score * 100)}%
                </div>
                <div className="text-lg text-gray-600">
                  {analysis.match_label}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full ${
                analysis.should_apply 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {analysis.should_apply ? 'Apply' : 'Review Gaps'}
              </div>
            </div>
            
            <p className="text-gray-700">{analysis.recommendation}</p>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.strong_matches}
                </div>
                <div className="text-sm text-gray-600">Strong</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {analysis.matches_count}
                </div>
                <div className="text-sm text-gray-600">Match</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {analysis.partial_matches}
                </div>
                <div className="text-sm text-gray-600">Partial</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {analysis.gaps}
                </div>
                <div className="text-sm text-gray-600">Gaps</div>
              </div>
            </div>
          </div>

          {/* Dealbreakers */}
          {analysis.dealbreakers.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-bold text-red-800 mb-3">⚠️ Dealbreakers</h3>
              <ul className="list-disc list-inside text-red-700">
                {analysis.dealbreakers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {analysis.top_suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-800 mb-3">💡 Top Suggestions</h3>
              <ul className="space-y-2">
                {analysis.top_suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-500">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Keywords */}
          {analysis.missing_keywords.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold mb-3">Keywords to Add</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_keywords.map((kw, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-gray-200 rounded-full text-sm"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-bold mb-4">Requirement Breakdown</h3>
            <div className="space-y-3">
              {analysis.matches.map((match, i) => (
                <div 
                  key={i}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-sm font-mono ${getStrengthColor(match.strength)}`}>
                      {getStrengthIcon(match.strength)}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{match.requirement.text}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {match.explanation}
                      </div>
                      {match.suggestion && (
                        <div className="text-sm text-blue-600 mt-2">
                          💡 {match.suggestion}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 uppercase">
                      {match.requirement.requirement_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Get Tailoring Plan
            </button>
            <button className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Save to Tracker
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Integration with Job Tracker

### Database Schema Additions

```sql
-- Add analysis column to jobs table
ALTER TABLE jobs ADD COLUMN fit_analysis JSONB;
ALTER TABLE jobs ADD COLUMN fit_score FLOAT;
ALTER TABLE jobs ADD COLUMN analyzed_at TIMESTAMP;

-- Store parsed job requirements
CREATE TABLE job_requirements (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    requirement_text TEXT,
    category VARCHAR(50),
    requirement_type VARCHAR(20),
    keywords TEXT[],
    match_strength VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Auto-Analysis on Job Add

When a job is added via the Chrome extension or email parsing, automatically run analysis if resume is available.

---

## Pattern Detection (Bonus Feature)

Track gaps across all applications to find patterns:

```python
@router.get("/patterns")
async def get_gap_patterns(user_id: str):
    """
    Identify patterns in gaps across all analyzed jobs.
    
    "You've been flagged for missing Kubernetes in 8 of your last 15 applications"
    """
    analyses = await get_user_analyses(user_id, limit=50)
    
    # Count gap frequency
    gap_counts = {}
    for analysis in analyses:
        for match in analysis.matches:
            if match.strength == 'gap':
                for kw in match.requirement.keywords:
                    gap_counts[kw] = gap_counts.get(kw, 0) + 1
    
    # Sort by frequency
    common_gaps = sorted(gap_counts.items(), key=lambda x: -x[1])
    
    return {
        "total_analyzed": len(analyses),
        "common_gaps": [
            {"skill": skill, "count": count, "percentage": count/len(analyses)*100}
            for skill, count in common_gaps[:10]
        ],
        "recommendation": generate_skill_recommendation(common_gaps)
    }
```

---

## TODO Checklist

```
[ ] Create backend/analyzer/ directory
[ ] Implement job_parser.py with JobPostingParser
[ ] Add parsers for major job boards (Greenhouse, Lever, LinkedIn)
[ ] Implement resume_matcher.py with ResumeMatcher
[ ] Implement resume_tailor.py with TailoringPlan generation
[ ] Create API endpoints in routers/analyzer.py
[ ] Integrate with existing resume storage
[ ] Build frontend JobFitAnalyzer component
[ ] Add fit_analysis columns to jobs table
[ ] Implement pattern detection across applications
[ ] Add "Save to Tracker" integration
[ ] Write tests for job parsing
[ ] Write tests for matching logic
[ ] Test with real job postings from different boards
```

---

## Future Enhancements

1. **Browser Extension Integration** - Right-click on job posting, analyze instantly
2. **Bulk Analysis** - Paste 10 URLs, rank by fit score
3. **Company Research** - Pull Glassdoor/LinkedIn data to enhance analysis
4. **Salary Benchmarking** - Compare posted salary to market data
5. **Interview Prep** - Generate likely interview questions from requirements
6. **Cover Letter Generator** - Auto-draft based on gaps and matches

---

*Document generated November 2025. Leveling the playing field, one analysis at a time.*
