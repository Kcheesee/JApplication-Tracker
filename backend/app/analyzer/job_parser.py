"""Job Posting Parser - Extracts structured requirements from job postings."""
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum
import re
from bs4 import BeautifulSoup


class RequirementType(str, Enum):
    """Type of requirement."""
    REQUIRED = "required"
    PREFERRED = "preferred"
    NICE_TO_HAVE = "nice_to_have"


class RequirementCategory(str, Enum):
    """Category of requirement."""
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
        "you have", "you bring", "requirements", "you must"
    ]
    
    PREFERRED_SIGNALS = [
        "preferred", "nice to have", "bonus", "ideally",
        "advantage", "a plus", "beneficial", "nice-to-have"
    ]
    
    # Common technical keywords
    TECH_KEYWORDS = [
        "python", "javascript", "typescript", "java", "sql", "react",
        "fastapi", "flask", "django", "aws", "azure", "gcp", "docker",
        "kubernetes", "api", "rest", "graphql", "postgresql", "mongodb",
        "llm", "ai", "ml", "machine learning", "data", "analytics",
        "node", "vue", "angular", "redis", "celery", "ci/cd", "git",
        "microservices", "terraform", "jenkins"
    ]
    
    def __init__(self, llm_provider=None):
        """
        Initialize parser.
        
        Args:
            llm_provider: Optional LLM for enhanced parsing
        """
        self.llm = llm_provider
    
    def _extract_years_experience(self, text: str) -> Optional[int]:
        """Extract years of experience from text."""
        text_lower = text.lower()
        
        for pattern in self.EXPERIENCE_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    return int(match.group(1))
                except (IndexError, ValueError):
                    continue
        
        return None
    
    def _detect_requirement_type(self, text: str) -> RequirementType:
        """Detect if requirement is required or preferred."""
        text_lower = text.lower()
        
        # Check for preferred signals first (more specific)
        for signal in self.PREFERRED_SIGNALS:
            if signal in text_lower:
                return RequirementType.PREFERRED
        
        # Default to required if no preferred signals
        # (Most requirements not explicitly marked are required)
        return RequirementType.REQUIRED
    
    def _categorize_requirement(self, text: str) -> RequirementCategory:
        """Categorize a requirement."""
        text_lower = text.lower()
        
        # Check for logistics FIRST (most specific)
        logistics_indicators = ["location", "remote", "hybrid", "travel", "clearance",
                               "onsite", "relocate", "visa", "authorization", "must be located",
                               "willing to travel"]
        if any(w in text_lower for w in logistics_indicators):
            return RequirementCategory.LOGISTICS
        
        # Check for education (specific keywords)
        edu_indicators = ["degree", "bachelor", "master", "phd", "certification",
                         "certified", "university", "college", "bs ", "ms ",
                         "ba ", "ma ", "b.s.", "m.s.", "b.a.", "m.a."]
        if any(w in text_lower for w in edu_indicators):
            # Avoid false positives from "development" containing "lopment"
            # Make sure it's actually about education
            return RequirementCategory.EDUCATION
        
        # Check for technical skills (before general experience check)
        tech_indicators = ["python", "java", "sql", "api", "cloud", "aws", "docker",
                          "kubernetes", "react", "vue", "angular", "fastapi", "flask",
                          "django", "postgresql", "mongodb", "programming", "coding",
                          "framework", "library", "tool", "typescript", "javascript",
                          "git", "ci/cd", "microservices", "rest"]
        if any(w in text_lower for w in tech_indicators):
            # Make sure it's not just mentioning experience WITH a tech
            # If it says "experience with Python", that's still technical skills
            return RequirementCategory.TECHNICAL_SKILLS
        
        # Check for soft skills (specific patterns)
        soft_indicators = ["communication skills", "leadership", "team", "collaborate",
                          "interpersonal", "presentation", "organized", "ability to work"]
        # Only soft skills if no "years" or "experience" (which would make it experience category)
        if any(w in text_lower for w in soft_indicators):
            # Check it's not also an experience requirement
            if "year" not in text_lower and "experience" not in text_lower:
                return RequirementCategory.SOFT_SKILLS
        
        # Check for experience last (most general)
        if any(w in text_lower for w in ["year", "experience", "background"]):
            return RequirementCategory.EXPERIENCE
        
        # Default to domain knowledge
        return RequirementCategory.DOMAIN
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from requirement text."""
        text_lower = text.lower()
        found = []
        
        for kw in self.TECH_KEYWORDS:
            if kw in text_lower and kw not in found:
                found.append(kw)
        
        return found
    
    def _parse_requirement_line(self, line: str) -> Optional[JobRequirement]:
        """Parse a single requirement line."""
        original_line = line.strip()
        
        # Skip empty or very short lines
        if not original_line or len(original_line) < 10:
            return None
        
        # Remove bullet points and list numbering, but NOT years (like "5+")
        # Only match bullets at start: "- ", "* ", "• ", or "1. ", "2. " etc
        cleaned_line = re.sub(r'^[\-\*\•]\s*', '', original_line)  #  Remove bullet markers
        cleaned_line = re.sub(r'^\d+\.\s+', '', cleaned_line)  # Remove numbered list markers like "1. "
        
        if not cleaned_line or len(cleaned_line) < 10:
            return None
        
        # Determine if required or preferred
        req_type = self._detect_requirement_type(cleaned_line)
        
        # Determine category
        category = self._categorize_requirement(cleaned_line)
        
        # Extract years of experience if present
        years = self._extract_years_experience(cleaned_line)
        
        # Extract keywords
        keywords = self._extract_keywords(cleaned_line)
        
        # Check if it's a dealbreaker (clearance, location restrictions)
        is_dealbreaker = False
        if category == RequirementCategory.LOGISTICS:
            if "clearance" in cleaned_line.lower() or "must be located" in cleaned_line.lower():
                is_dealbreaker = True
        
        return JobRequirement(
            text=cleaned_line,  # Use cleaned line as final text
            category=category,
            requirement_type=req_type,
            keywords=keywords,
            years_experience=years,
            is_dealbreaker=is_dealbreaker
        )
    
    def _dedupe_requirements(
        self, 
        requirements: List[JobRequirement]
    ) -> List[JobRequirement]:
        """Remove duplicate requirements."""
        seen = set()
        unique = []
        
        for req in requirements:
            # Normalize the text for comparison
            key = req.text.lower().strip()
            key = re.sub(r'\s+', ' ', key)  # Normalize whitespace
            
            if key not in seen:
                seen.add(key)
                unique.append(req)
        
        return unique
    
    def _parse_generic(self, html: str) -> Dict[str, Any]:
        """Generic parser for unknown formats."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Try to extract title
        title = ""
        for selector in ['h1', '.job-title', '.title', 'title']:
            elem = soup.select_one(selector)
            if elem:
                title = elem.get_text(strip=True)
                break
        
        # Try to extract company
        company = ""
        for selector in ['.company', '.company-name', '[class*="company"]']:
            elem = soup.select_one(selector)
            if elem:
                company = elem.get_text(strip=True)
                break
        
        # Try to extract location
        location = ""
        for selector in ['.location', '[class*="location"]']:
            elem = soup.select_one(selector)
            if elem:
                location = elem.get_text(strip=True)
                break
        
        # Try to extract qualifications/requirements
        qualifications = []
        for selector in ['.requirements ul li', '.qualifications ul li', 'ul li']:
            items = soup.select(selector)
            if items and len(items) > 2:  # Likely a requirements list
                qualifications = [item.get_text(strip=True) for item in items]
                break
        
        # Get description
        description = ""
        desc_elem = soup.select_one('.description, [class*="description"]')
        if desc_elem:
            description = desc_elem.get_text(strip=True)
        
        return {
            "title": title or "Unknown",
            "company": company or "Unknown",
            "location": location or "Unknown",
            "qualifications": qualifications,
            "description": description,
            "confidence": 0.6
        }
    
    def _parse_greenhouse(self, html: str) -> Dict[str, Any]:
        """Parse Greenhouse job board format."""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Greenhouse typically uses .app-title for job title
        title = ""
        title_elem = soup.select_one('.app-title, h1')
        if title_elem:
            title = title_elem.get_text(strip=True)
        
        # Company name might be in meta tag or text
        company = ""
        # Try various selectors
        for selector in ['.company-name', '[class*="company"]']:
            elem = soup.select_one(selector)
            if elem:
                company = elem.get_text(strip=True)
                break
        
        # Location
        location = ""
        location_elem = soup.select_one('.location, [class*="location"]')
        if location_elem:
            location = location_elem.get_text(strip=True)
        
        # Extract all list items from sections
        qualifications = []
        sections = soup.select('.section')
        for section in sections:
            section_title = section.select_one('h2, h3')
            if section_title:
                title_text = section_title.get_text(strip=True).lower()
                # Look for requirements/qualifications sections
                if any(keyword in title_text for keyword in ['requirement', 'qualification', 'looking for', 'you', 'must have']):
                    items = section.select('li')
                    qualifications.extend([item.get_text(strip=True) for item in items])
        
        # Get full description
        description = soup.get_text(separator=' ', strip=True)
        
        return {
            "title": title or "Unknown",
            "company": company or "Unknown",  
            "location": location or "Unknown",
            "qualifications": qualifications,
            "description": description[:1000],  # Limit description length
            "confidence": 0.8 if qualifications else 0.5
        }
    
    def _extract_requirements(
        self, 
        raw_data: Dict[str, Any]
    ) -> List[JobRequirement]:
        """
        Extract structured requirements from raw text.
        
        Uses pattern matching + optional LLM for complex parsing.
        """
        requirements = []
        
        # Get qualifications
        qual_text = raw_data.get("qualifications", [])
        if isinstance(qual_text, str):
            qual_text = qual_text.split("\n")
        
        for line in qual_text:
            req = self._parse_requirement_line(line)
            if req:
                requirements.append(req)
        
        # TODO: Use LLM for enhanced extraction if available
        # if self.llm and raw_data.get("description"):
        #     llm_requirements = await self._llm_extract_requirements(
        #         raw_data["description"]
        #     )
        #     requirements.extend(llm_requirements)
        
        return self._dedupe_requirements(requirements)
