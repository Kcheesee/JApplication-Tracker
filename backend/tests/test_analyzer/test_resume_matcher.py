"""Tests for Resume Matcher."""
import pytest
from app.analyzer.job_parser import (
    JobRequirement,
    ParsedJobPosting,
    RequirementCategory,
    RequirementType,
)
from app.analyzer.resume_matcher import (
    ResumeMatcher,
    ResumeData,
    FitAnalysis,
    RequirementMatch,
    MatchStrength,
)


@pytest.fixture
def matcher():
    """Create a ResumeMatcher instance."""
    return ResumeMatcher()


@pytest.fixture
def senior_resume():
    """Senior engineer resume with strong qualifications."""
    return ResumeData(
        name="Jane Senior",
        email="jane@example.com",
        location="San Francisco, CA",
        summary="Experienced software engineer with 8 years building scalable systems",
        experiences=[
            {
                "title": "Senior Software Engineer",
                "company": "TechCorp",
                "start": "2020-01",
                "end": "2024-11",
                "bullets": [
                    "Built REST APIs using FastAPI and PostgreSQL",
                    "Led team of 4 engineers",
                    "Deployed services to AWS with Docker and Kubernetes",
                ]
            }
        ],
        technical_skills=["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes", "AWS", "React"],
        soft_skills=["Leadership", "Communication", "Mentoring"],
        education=[{"degree": "BS Computer Science", "school": "Stanford", "year": 2017}],
        projects=[],
        certifications=["AWS Certified"],
        total_years_experience=8,
        industries=["SaaS", "Cloud"]
    )


@pytest.fixture
def junior_resume():
    """Junior developer resume with limited experience."""
    return ResumeData(
        name="Alex Junior",
        email="alex@example.com",
        location="Remote",
        summary="Recent CS graduate with internship experience",
        experiences=[
            {
                "title": "Software Engineering Intern",
                "company": "Startup",
                "start": "2023-06",
                "end": "2023-08",
                "bullets": [
                    "Built REST API endpoints using Flask",
                    "Created React components",
                ]
            }
        ],
        technical_skills=["Python", "Flask", "React", "JavaScript"],
        soft_skills=["Communication", "Teamwork"],
        education=[{"degree": "BS Computer Science", "school": "State U", "year": 2024}],
        projects=[],
        certifications=[],
        total_years_experience=1,
        industries=["Technology"]
    )


class TestMatchStrength:
    """Test MatchStrength enum."""
    
    @pytest.mark.unit
    def test_match_strength_values(self):
        """Test that all match strength values exist."""
        assert MatchStrength.STRONG == "strong"
        assert MatchStrength.MATCH == "match"
        assert MatchStrength.PARTIAL == "partial"
        assert MatchStrength.WEAK == "weak"
        assert MatchStrength.GAP == "gap"


class TestRequirementMatch:
    """Test RequirementMatch dataclass."""
    
    @pytest.mark.unit
    def test_create_requirement_match(self):
        """Test creating a requirement match."""
        req = JobRequirement(
            text="5+ years Python",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["python"]
        )
        
        match = RequirementMatch(
            requirement=req,
            strength=MatchStrength.STRONG,
            evidence=["8 years Python experience"],
            explanation="Exceeds requirement",
            confidence=0.9
        )
        
        assert match.requirement == req
        assert match.strength == MatchStrength.STRONG
        assert len(match.evidence) == 1
        assert match.confidence == 0.9


class TestResumeMatcher:
    """Test ResumeMatcher functionality."""
    
    @pytest.mark.unit
    def test_matcher_initialization(self, matcher):
        """Test matcher can be initialized."""
        assert matcher is not None
        assert matcher.llm is None
    
    @pytest.mark.unit
    def test_match_experience_strong(self, matcher, senior_resume):
        """Test matching when candidate exceeds experience requirement."""
        req = JobRequirement(
            text="5+ years of software development",
            category=RequirementCategory.EXPERIENCE,
            requirement_type=RequirementType.REQUIRED,
            years_experience=5
        )
        
        match = matcher._match_experience(senior_resume, req)
        
        assert match.strength in [MatchStrength.STRONG, MatchStrength.MATCH]
        assert match.confidence > 0.8
    
    @pytest.mark.unit
    def test_match_experience_gap(self, matcher, junior_resume):
        """Test matching when candidate lacks experience."""
        req = JobRequirement(
            text="5+ years of software development",
            category=RequirementCategory.EXPERIENCE,
            requirement_type=RequirementType.REQUIRED,
            years_experience=5
        )
        
        match = matcher._match_experience(junior_resume, req)
        
        assert match.strength == MatchStrength.GAP
        assert match.suggestion is not None
    
    @pytest.mark.unit
    def test_match_technical_skills_strong(self, matcher, senior_resume):
        """Test matching technical skills when all present."""
        req = JobRequirement(
            text="Python and FastAPI experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["python", "fastapi"]
        )
        
        match = matcher._match_technical(senior_resume, req)
        
        assert match.strength == MatchStrength.STRONG
        assert "python" in [e.lower() for e in match.evidence]
        assert "fastapi" in [e.lower() for e in match.evidence]
    
    @pytest.mark.unit
    def test_match_technical_skills_partial(self, matcher, senior_resume):
        """Test matching when only some technical skills present."""
        req = JobRequirement(
            text="Python and Rust experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["python", "rust"]
        )
        
        match = matcher._match_technical(senior_resume, req)
        
        assert match.strength == MatchStrength.PARTIAL
        assert match.suggestion is not None
    
    @pytest.mark.unit
    def test_match_technical_skills_gap(self, matcher, junior_resume):
        """Test matching when technical skills are missing."""
        req = JobRequirement(
            text="Kubernetes and Terraform experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["kubernetes", "terraform"]
        )
        
        match = matcher._match_technical(junior_resume, req)
        
        assert match.strength == MatchStrength.GAP
    
    @pytest.mark.unit
    def test_match_education(self, matcher, senior_resume):
        """Test matching education requirements."""
        req = JobRequirement(
            text="Bachelor's degree in Computer Science",
            category=RequirementCategory.EDUCATION,
            requirement_type=RequirementType.REQUIRED,
            keywords=["bachelor", "computer science"]
        )
        
        match = matcher._match_education(senior_resume, req)
        
        assert match.strength in [MatchStrength.STRONG, MatchStrength.MATCH]
    
    @pytest.mark.unit
    def test_calculate_score_all_strong(self, matcher):
        """Test score calculation with all strong matches."""
        req = JobRequirement(
            text="Python experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED
        )
        
        matches = [
            RequirementMatch(
                requirement=req,
                strength=MatchStrength.STRONG,
                confidence=1.0
            ),
            RequirementMatch(
                requirement=req,
                strength=MatchStrength.STRONG,
                confidence=1.0
            ),
        ]
        
        score = matcher._calculate_score(matches)
        
        assert score >= 0.9  # Should be very high
        assert score <= 1.0
    
    @pytest.mark.unit
    def test_calculate_score_mixed(self, matcher):
        """Test score calculation with mixed match strengths."""
        req = JobRequirement(
            text="Test",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED
        )
        
        matches = [
            RequirementMatch(requirement=req, strength=MatchStrength.STRONG, confidence=1.0),
            RequirementMatch(requirement=req, strength=MatchStrength.PARTIAL, confidence=0.8),
            RequirementMatch(requirement=req, strength=MatchStrength.GAP, confidence=0.9),
        ]
        
        score = matcher._calculate_score(matches)
        
        assert 0.0 < score < 1.0  # Should be somewhere in the middle
    
    @pytest.mark.unit
    def test_score_to_label(self, matcher):
        """Test converting scores to human-readable labels."""
        assert "Strong" in matcher._score_to_label(0.90)
        assert "Good" in matcher._score_to_label(0.75)
        assert "Moderate" in matcher._score_to_label(0.60)
        assert "Weak" in matcher._score_to_label(0.40)
        assert "Poor" in matcher._score_to_label(0.20)
    
    @pytest.mark.unit
    def test_check_dealbreakers(self, matcher, senior_resume):
        """Test dealbreaker detection."""
        req_dealbreaker = JobRequirement(
            text="Security clearance required",
            category=RequirementCategory.LOGISTICS,
            requirement_type=RequirementType.REQUIRED,
            is_dealbreaker=True
        )
        
        match_gap = RequirementMatch(
            requirement=req_dealbreaker,
            strength=MatchStrength.GAP
        )
        
        job = ParsedJobPosting(
            url="http://test.com",
            title="Test",
            company="Test",
            location="Test"
        )
        
        dealbreakers = matcher._check_dealbreakers(senior_resume, job, [match_gap])
        
        assert len(dealbreakers) > 0
    
    @pytest.mark.unit
    def test_generate_suggestions(self, matcher):
        """Test suggestion generation from gaps."""
        req = JobRequirement(
            text="Kubernetes experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED
        )
        
        matches = [
            RequirementMatch(
                requirement=req,
                strength=MatchStrength.GAP,
                suggestion="Add Kubernetes to skills section"
            ),
            RequirementMatch(
                requirement=req,
                strength=MatchStrength.STRONG
            ),
        ]
        
        suggestions = matcher._generate_suggestions(matches)
        
        assert len(suggestions) > 0
        assert any("Kubernetes" in s for s in suggestions)
    
    @pytest.mark.unit
    def test_find_missing_keywords(self, matcher, junior_resume):
        """Test finding keywords missing from resume."""
        job = ParsedJobPosting(
            url="http://test.com",
            title="Software Engineer",
            company="TechCorp",
            location="SF",
            requirements=[
                JobRequirement(
                    text="Docker and Kubernetes",
                    category=RequirementCategory.TECHNICAL_SKILLS,
                    requirement_type=RequirementType.REQUIRED,
                    keywords=["docker", "kubernetes"]
                )
            ]
        )
        
        missing = matcher._find_missing_keywords(junior_resume, job)
        
        assert "docker" in missing or "kubernetes"  in missing


class TestFitAnalysis:
    """Test complete fit analysis."""
    
    @pytest.mark.integration
    def test_analyze_fit_senior_candidate(self, matcher, senior_resume):
        """Test analyzing fit for senior candidate against senior role."""
        job = ParsedJobPosting(
            url="http://test.com",
            title="Senior Software Engineer",
            company="TechCorp",
            location="San Francisco",
            requirements=[
                JobRequirement(
                    text="5+ years Python",
                    category=RequirementCategory.EXPERIENCE,
                    requirement_type=RequirementType.REQUIRED,
                    keywords=["python"],
                    years_experience=5
                ),
                JobRequirement(
                    text="FastAPI experience",
                    category=RequirementCategory.TECHNICAL_SKILLS,
                    requirement_type=RequirementType.REQUIRED,
                    keywords=["fastapi"]
                ),
                JobRequirement(
                    text="AWS and Docker",
                    category=RequirementCategory.TECHNICAL_SKILLS,
                    requirement_type=RequirementType.REQUIRED,
                    keywords=["aws", "docker"]
                ),
            ]
        )
        
        analysis = matcher.analyze_fit(senior_resume, job)
        
        assert analysis.match_score >= 0.7  # Strong candidate should score high
        assert analysis.should_apply is True
        assert "Strong" in analysis.match_label or "Good" in analysis.match_label
        assert len(analysis.matches) == 3
        assert analysis.strong_matches + analysis.matches_count > 0
    
    @pytest.mark.integration
    def test_analyze_fit_junior_candidate(self, matcher, junior_resume):
        """Test analyzing fit for junior candidate against senior role."""
        job = ParsedJobPosting(
            url="http://test.com",
            title="Senior Software Engineer",
            company="TechCorp",
            location="San Francisco",
            requirements=[
                JobRequirement(
                    text="5+ years Python",
                    category=RequirementCategory.EXPERIENCE,
                    requirement_type=RequirementType.REQUIRED,
                    years_experience=5
                ),
                JobRequirement(
                    text="AWS and Kubernetes",
                    category=RequirementCategory.TECHNICAL_SKILLS,
                    requirement_type=RequirementType.REQUIRED,
                    keywords=["aws", "kubernetes"]
                ),
            ]
        )
        
        analysis = matcher.analyze_fit(junior_resume, job)
        
        assert analysis.match_score < 0.7  # Junior should score lower
        assert analysis.gaps > 0
        assert len(analysis.top_suggestions) > 0
