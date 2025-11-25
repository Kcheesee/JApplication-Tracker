"""Tests for Job Posting Parser."""
import pytest
from pathlib import Path
from bs4 import BeautifulSoup

from app.analyzer.job_parser import (
    JobPostingParser,
    JobRequirement,
    ParsedJobPosting,
    RequirementType,
    RequirementCategory,
)


@pytest.fixture
def parser():
    """Create a JobPostingParser instance."""
    return JobPostingParser()


@pytest.fixture
def fixtures_path():
    """Get path to test fixtures."""
    return Path(__file__).parent.parent / "fixtures"


@pytest.fixture
def greenhouse_html(fixtures_path):
    """Load Greenhouse job posting HTML."""
    with open(fixtures_path / "job_postings" / "greenhouse_senior_engineer.html") as f:
        return f.read()


class TestJobRequirement:
    """Test JobRequirement dataclass."""
    
    @pytest.mark.unit
    def test_create_requirement(self):
        """Test creating a job requirement."""
        req = JobRequirement(
            text="5+ years of Python experience",
            category=RequirementCategory.EXPERIENCE,
            requirement_type=RequirementType.REQUIRED,
            keywords=["python"],
            years_experience=5
        )
        
        assert req.text == "5+ years of Python experience"
        assert req.category == RequirementCategory.EXPERIENCE
        assert req.requirement_type == RequirementType.REQUIRED
        assert req.keywords == ["python"]
        assert req.years_experience == 5
        assert req.is_dealbreaker is False


class TestParsedJobPosting:
    """Test ParsedJobPosting dataclass."""
    
    @pytest.mark.unit
    def test_create_parsed_job(self):
        """Test creating a parsed job posting."""
        job = ParsedJobPosting(
            url="https://example.com/job",
            title="Software Engineer",
            company="TechCorp",
            location="San Francisco, CA"
        )
        
        assert job.url == "https://example.com/job"
        assert job.title == "Software Engineer"
        assert job.company == "TechCorp"
        assert job.location == "San Francisco, CA"
        assert job.requirements == []
        assert job.description == ""


class TestJobPostingParser:
    """Test JobPostingParser functionality."""
    
    @pytest.mark.unit
    def test_parser_initialization(self, parser):
        """Test parser can be initialized."""
        assert parser is not None
        assert parser.llm is None
    
    @pytest.mark.unit
    def test_extract_years_from_text(self, parser):
        """Test extracting years of experience from text."""
        test_cases = [
            ("5+ years of experience", 5),
            ("3-5 years", 3),
            ("At least 7 years of Python", 7),
            ("Minimum 10 years required", 10),
            ("2+ years", 2),
            ("No years mentioned", None),
        ]
        
        for text, expected_years in test_cases:
            years = parser._extract_years_experience(text)
            assert years == expected_years, f"Failed for: {text}"
    
    @pytest.mark.unit
    def test_categorize_requirement_experience(self, parser):
        """Test categorizing experience requirements."""
        texts = [
            "5+ years of software development",
            "Minimum 3 years background in engineering",
            "At least 2 years experience with Python"
        ]
        
        for text in texts:
            category = parser._categorize_requirement(text)
            assert category == RequirementCategory.EXPERIENCE
    
    @pytest.mark.unit
    def test_categorize_requirement_technical(self, parser):
        """Test categorizing technical skill requirements."""
        texts = [
            "Experience with Python and FastAPI",
            "Proficiency in Java and SQL",
            "Knowledge of AWS and Docker",
            "React or Vue.js experience"
        ]
        
        for text in texts:
            category = parser._categorize_requirement(text)
            assert category == RequirementCategory.TECHNICAL_SKILLS
    
    @pytest.mark.unit
    def test_categorize_requirement_education(self, parser):
        """Test categorizing education requirements."""
        texts = [
            "Bachelor's degree in Computer Science",
            "Master's degree preferred",
            "PhD in related field",
            "AWS certification required"
        ]
        
        for text in texts:
            category = parser._categorize_requirement(text)
            assert category == RequirementCategory.EDUCATION
    
    @pytest.mark.unit
    def test_categorize_requirement_soft_skills(self, parser):
        """Test categorizing soft skill requirements."""
        texts = [
            "Excellent communication skills",
            "Strong leadership abilities",
            "Team collaboration experience",
            "Ability to work independently"
        ]
        
        for text in texts:
            category = parser._categorize_requirement(text)
            assert category == RequirementCategory.SOFT_SKILLS
    
    @pytest.mark.unit
    def test_categorize_requirement_logistics(self, parser):
        """Test categorizing logistics requirements."""
        texts = [
            "Must be located in San Francisco",
            "Hybrid work environment",
            "Willing to travel 25%",
            "Security clearance required"
        ]
        
        for text in texts:
            category = parser._categorize_requirement(text)
            assert category == RequirementCategory.LOGISTICS
    
    @pytest.mark.unit
    def test_extract_keywords(self, parser):
        """Test keyword extraction from requirement text."""
        text = "5+ years experience with Python, FastAPI, PostgreSQL, and Docker"
        keywords = parser._extract_keywords(text)
        
        assert "python" in keywords
        assert "fastapi" in keywords
        assert "postgresql" in keywords
        assert "docker" in keywords
    
    @pytest.mark.unit
    def test_detect_required_vs_preferred(self, parser):
        """Test distinguishing required vs preferred requirements."""
        required_signals = [
            "Must have 5 years experience",
            "Required: Python proficiency",
            "You must be able to",
            "Need to have strong SQL skills"
        ]
        
        for text in required_signals:
            req_type = parser._detect_requirement_type(text)
            assert req_type == RequirementType.REQUIRED, f"Failed for: {text}"
        
        preferred_signals = [
            "Preferred: AWS experience",
            "Nice to have: Docker knowledge",
            "Bonus if you have React skills",
            "Ideally familiar with Kubernetes"
        ]
        
        for text in preferred_signals:
            req_type = parser._detect_requirement_type(text)
            assert req_type == RequirementType.PREFERRED, f"Failed for: {text}"
    
    @pytest.mark.unit
    def test_parse_requirement_line(self, parser):
        """Test parsing a single requirement line."""
        line = "5+ years of Python development experience"
        req = parser._parse_requirement_line(line)
        
        assert req is not None
        assert req.text == line
        assert req.category == RequirementCategory.EXPERIENCE
        assert req.years_experience == 5
        assert "python" in req.keywords
    
    @pytest.mark.unit
    def test_dedupe_requirements(self, parser):
        """Test removing duplicate requirements."""
        requirements = [
            JobRequirement(
                text="Python experience",
                category=RequirementCategory.TECHNICAL_SKILLS,
                requirement_type=RequirementType.REQUIRED,
                keywords=["python"]
            ),
            JobRequirement(
                text="Python experience",  # Duplicate
                category=RequirementCategory.TECHNICAL_SKILLS,
                requirement_type=RequirementType.REQUIRED,
                keywords=["python"]
            ),
            JobRequirement(
                text="FastAPI knowledge",
                category=RequirementCategory.TECHNICAL_SKILLS,
                requirement_type=RequirementType.REQUIRED,
                keywords=["fastapi"]
            ),
        ]
        
        unique = parser._dedupe_requirements(requirements)
        assert len(unique) == 2
        assert unique[0].text == "Python experience"
        assert unique[1].text == "FastAPI knowledge"
    
    @pytest.mark.integration
    def test_parse_generic_html(self, parser, mock_job_posting_html):
        """Test parsing generic job posting HTML."""
        raw_data = parser._parse_generic(mock_job_posting_html)
        
        assert raw_data["title"] == "Senior Software Engineer"
        assert raw_data["company"] == "TechCorp"
        assert raw_data["location"] == "San Francisco, CA"
        assert len(raw_data["qualifications"]) > 0
    
    @pytest.mark.integration
    def test_parse_greenhouse_html(self, parser, greenhouse_html):
        """Test parsing Greenhouse job board format."""
        raw_data = parser._parse_greenhouse(greenhouse_html)
        
        assert "senior" in raw_data["title"].lower()
        assert "techcorp" in raw_data["company"].lower() or raw_data["company"]
        assert len(raw_data["qualifications"]) > 0
    
    @pytest.mark.integration
    def test_extract_requirements_from_qualifications(self, parser):
        """Test extracting requirements from qualification list."""
        raw_data = {
            "qualifications": [
                "5+ years of Python development experience",
                "Experience with FastAPI or Flask",
                "Bachelor's degree in Computer Science",
                "Kubernetes experience a plus"
            ]
        }
        
        requirements = parser._extract_requirements(raw_data)
        
        assert len(requirements) >= 3
        
        # Check for experience requirement
        exp_reqs = [r for r in requirements if r.category == RequirementCategory.EXPERIENCE]
        assert len(exp_reqs) > 0
        assert any(r.years_experience == 5 for r in exp_reqs)
        
        # Check for technical requirements
        tech_reqs = [r for r in requirements if r.category == RequirementCategory.TECHNICAL_SKILLS]
        assert len(tech_reqs) > 0
        
        # Check for preferred vs required
        preferred = [r for r in requirements if r.requirement_type == RequirementType.PREFERRED]
        assert len(preferred) > 0  # "a plus" should be detected as preferred
    
    @pytest.mark.integration
    def test_empty_qualifications(self, parser):
        """Test handling empty qualifications list."""
        raw_data = {"qualifications": []}
        requirements = parser._extract_requirements(raw_data)
        
        # Should not crash, may return empty list
        assert isinstance(requirements, (list, type(None)))


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    @pytest.mark.unit
    def test_parse_empty_line(self, parser):
        """Test parsing empty or very short lines."""
        assert parser._parse_requirement_line("") is None
        assert parser._parse_requirement_line("   ") is None
        assert parser._parse_requirement_line("a") is None
    
    @pytest.mark.unit
    def test_special_characters_in_text(self, parser):
        """Test handling special characters."""
        text = "5+ years of C++ & Python (required) – must have!"
        req = parser._parse_requirement_line(text)
        
        assert req is not None
        assert req.text == text
    
    @pytest.mark.unit
    def test_extract_keywords_no_matches(self, parser):
        """Test keyword extraction when no keywords match."""
        text = "General business analysis experience"
        keywords = parser._extract_keywords(text)
        
        # Should return empty list or handle gracefully
        assert isinstance(keywords, list)
