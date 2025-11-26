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
        # Languages
        "python", "javascript", "typescript", "java", "sql", "go", "rust", "c++", "ruby",
        # Web frameworks
        "react", "fastapi", "flask", "django", "node", "vue", "angular", "nextjs",
        # Cloud & infrastructure
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "jenkins",
        # Databases
        "postgresql", "mongodb", "mysql", "redis", "elasticsearch",
        # APIs & protocols
        "api", "rest", "graphql", "sdk", "webhook", "oauth",
        # AI/ML
        "llm", "ai", "ml", "machine learning", "deep learning", "nlp", "neural network",
        "gpt", "claude", "openai", "anthropic", "langchain", "embeddings",
        # Data
        "data", "analytics", "etl", "pipeline", "snowflake", "databricks",
        # DevOps
        "ci/cd", "git", "github", "gitlab", "microservices", "celery",
        # General tech
        "saas", "b2b", "software", "technical", "engineering", "developer",
        "integration", "implementation", "architecture"
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
        
        # Check for education (specific keywords) - be careful with false positives!
        # "master" can mean "Master's degree" OR "master complex products" (verb)
        # Only match education when context is clear
        edu_exact_phrases = [
            "degree", "bachelor", "phd", "ph.d", "doctorate",
            "certification", "certified",
            "university", "college",
            "bs ", "ms ", "ba ", "ma ",
            "b.s.", "m.s.", "b.a.", "m.a.",
            "master's", "masters degree", "master degree",
            "graduate degree", "undergraduate",
            "educational background", "academic"
        ]
        if any(phrase in text_lower for phrase in edu_exact_phrases):
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

        line_lower = cleaned_line.lower()

        # Skip section headers (short lines that are just titles)
        section_headers = [
            "about the role", "about the company", "about us", "about anthropic",
            "responsibilities", "requirements", "qualifications", "what you'll do",
            "who you are", "what we're looking for", "nice to have", "benefits",
            "perks", "compensation", "salary", "location", "the role", "the team",
            "your impact", "job description", "overview", "summary", "apply now",
            "how to apply", "equal opportunity", "diversity", "inclusion"
        ]
        if any(line_lower == header or line_lower.startswith(header + ":") for header in section_headers):
            return None

        # Skip "intro" headers that introduce requirements but aren't requirements themselves
        intro_headers = [
            "you may be a good fit if",
            "you might be a good fit if",
            "the ideal candidate",
            "what we need",
            "what you need",
            "you should have",
            "required skills",
            "minimum qualifications",
            "basic qualifications",
            "preferred qualifications",
            "you will",
            "you'll",
            "in this role",
            "as a",
            "strong candidates may have",
            "strong candidates will have",
            "ideal candidates",
            "we're looking for",
            "we are looking for",
        ]
        if any(line_lower.startswith(header) for header in intro_headers):
            return None

        # Skip salary, deadline, and other metadata (not requirements)
        metadata_patterns = [
            r"^annual salary",
            r"^\$[\d,]+",  # Lines starting with dollar amounts
            r"^salary",
            r"^compensation",
            r"^deadline to apply",
            r"^application deadline",
            r"^applications will be reviewed",
            r"^apply by",
            r"^posted",
            r"^job id",
            r"^requisition",
            r"^employment type",
            r"^job type",
            r"^work location",
            r"^reports to",
            r"^department",
            r"^team size",
        ]
        for pattern in metadata_patterns:
            if re.search(pattern, line_lower):
                return None

        # Skip job titles (short capitalized lines with role keywords)
        job_title_keywords = [
            "manager", "engineer", "developer", "analyst", "designer", "director",
            "lead", "architect", "specialist", "coordinator", "associate", "consultant",
            "administrator", "executive", "officer", "representative", "scientist",
            "researcher", "strategist", "planner", "supervisor"
        ]
        # Job titles are typically short (under 60 chars) and contain a role keyword
        if len(cleaned_line) < 60 and any(kw in line_lower for kw in job_title_keywords):
            # Make sure it's not a requirement about experience
            if not any(sig in line_lower for sig in ["experience", "years", "degree", "knowledge"]):
                return None

        # Skip responsibilities (lines starting with action verbs - describe what you DO, not what you NEED)
        responsibility_verbs = [
            "manage", "provide", "define", "enable", "lead", "build", "create",
            "drive", "own", "develop", "collaborate", "coordinate", "ensure",
            "monitor", "support", "deliver", "implement", "design", "execute",
            "establish", "maintain", "oversee", "guide", "facilitate", "conduct",
            "analyze", "assess", "evaluate", "prepare", "present", "report",
            "communicate", "partner", "work with", "engage", "serve as",
            "act as", "be responsible", "take ownership", "help", "contribute",
            "identify", "track", "measure", "optimize", "improve", "streamline"
        ]
        # Check if line starts with an action verb (responsibility pattern)
        for verb in responsibility_verbs:
            if line_lower.startswith(verb + " ") or line_lower.startswith(verb + "ing "):
                # This looks like a responsibility, not a requirement
                # Exception: if it explicitly mentions "experience" or skills needed
                if not any(sig in line_lower for sig in ["experience with", "knowledge of", "proficiency", "familiar with", "skilled in"]):
                    return None

        # Skip lines that are just locations (city, state patterns)
        location_pattern = r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}(?:;\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})*$'
        if re.match(location_pattern, cleaned_line):
            return None

        # Skip very long lines (likely descriptive paragraphs, not requirements)
        # Real requirements are usually concise (under 300 chars)
        if len(cleaned_line) > 400:
            return None

        # Skip lines that don't look like requirements
        # Requirements typically have: years, skills, experience, degree, ability, knowledge, etc.
        requirement_signals = [
            "experience", "years", "year", "proficient", "proficiency", "knowledge",
            "ability", "skilled", "familiarity", "understanding", "degree", "bachelor",
            "master", "phd", "certification", "certified", "expertise", "expert",
            "strong", "excellent", "demonstrated", "proven", "track record",
            "background", "history", "comfortable", "capable", "competent",
            "must have", "required", "preferred", "nice to have", "bonus",
            "minimum", "at least", "ideally", "+", "or more", "working with",
            "hands-on", "deep understanding", "solid", "thorough"
        ]

        # Also check for technical keywords as signals
        has_requirement_signal = any(signal in line_lower for signal in requirement_signals)
        has_tech_keyword = any(kw in line_lower for kw in self.TECH_KEYWORDS)

        # Skip if it's a long line with no requirement signals (likely descriptive prose)
        if len(cleaned_line) > 150 and not has_requirement_signal and not has_tech_keyword:
            return None

        # Skip company mission statements and general descriptions
        non_requirement_patterns = [
            r"^our (mission|team|company|vision|goal)",
            r"^we (are|want|believe|build|create|strive)",
            r"^(this is|you will be|you'll be) (a|an|the)",
            r"^as (a|an|the) .+, you will",
            r"committed to|passionate about|excited about",
            r"equal opportunity|diversity|inclusive",
            # Company name + mission patterns (Anthropic's mission, Google's mission, etc.)
            r"^[a-z]+[''']s mission",
            r"mission is to",
            r"^at [a-z]+,? we",  # "At Anthropic, we..."
            r"^join (us|our team|the team)",
            r"growing group of|growing team of",
            r"working together to",
        ]
        for pattern in non_requirement_patterns:
            if re.search(pattern, line_lower):
                # Allow if it still has requirement signals
                if not has_requirement_signal:
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
