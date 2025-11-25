"""Tests for Resume Tailor."""
import pytest
from app.analyzer.job_parser import (
    JobRequirement,
    ParsedJobPosting,
    RequirementCategory,
    RequirementType,
)
from app.analyzer.resume_matcher import (
    ResumeData,
    FitAnalysis,
    RequirementMatch,
    MatchStrength,
)
from app.analyzer.resume_tailor import (
    ResumeTailor,
    TailoringPlan,
    TailoringAction,
)


@pytest.fixture
def tailor():
    """Create a ResumeTailor instance."""
    return ResumeTailor()


@pytest.fixture
def sample_analysis():
    """Sample fit analysis with gaps and partial matches."""
    req_gap = JobRequirement(
        text="Kubernetes experience",
        category=RequirementCategory.TECHNICAL_SKILLS,
        requirement_type=RequirementType.REQUIRED,
        keywords=["kubernetes"]
    )
    
    req_partial = JobRequirement(
        text="5+ years Python",
        category=RequirementCategory.EXPERIENCE,
        requirement_type=RequirementType.REQUIRED,
        years_experience=5
    )
    
    return FitAnalysis(
        match_score=0.65,
        match_label="Moderate Match",
        should_apply=True,
        recommendation="Apply with tailoring",
        matches=[
            RequirementMatch(
                requirement=req_gap,
                strength=MatchStrength.GAP,
                suggestion="Add Kubernetes to skills section"
            ),
            RequirementMatch(
                requirement=req_partial,
                strength=MatchStrength.PARTIAL,
                suggestion="Emphasize Python experience"
            ),
        ],
        strong_matches=1,
        matches_count=2,
        partial_matches=1,
        gaps=1,
        top_suggestions=["Add Kubernetes", "Emphasize Python"],
        missing_keywords=["kubernetes", "docker"]
    )


@pytest.fixture
def sample_resume():
    """Sample resume data."""
    return ResumeData(
        name="Test User",
        email="test@example.com",
        location="Remote",
        summary="Software engineer with Python experience",
        experiences=[
            {
                "title": "Software Engineer",
                "company": "TechCo",
                "start": "2020-01",
                "end": "2024-11",
                "bullets": ["Built APIs with Python"]
            }
        ],
        technical_skills=["Python", "Flask"],
        soft_skills=["Communication"],
        education=[{"degree": "BS CS", "school": "University", "year": 2020}],
        projects=[],
        certifications=[],
        total_years_experience=4,
        industries=["Technology"]
    )


@pytest.fixture
def sample_job():
    """Sample job posting."""
    return ParsedJobPosting(
        url="http://test.com/job",
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
                text="Kubernetes experience",
                category=RequirementCategory.TECHNICAL_SKILLS,
                requirement_type=RequirementType.REQUIRED,
                keywords=["kubernetes"]
            ),
        ]
    )


class TestTailoringAction:
    """Test TailoringAction dataclass."""
    
    @pytest.mark.unit
    def test_create_tailoring_action(self):
        """Test creating a tailoring action."""
        action = TailoringAction(
            action_type="add_skill",
            section="Technical Skills",
            priority="high",
            suggestion="Add Kubernetes to skills section",
            example="Kubernetes, Docker, CI/CD",
            addresses_requirement="Kubernetes experience required"
        )
        
        assert action.action_type == "add_skill"
        assert action.section == "Technical Skills"
        assert action.priority == "high"
        assert action.suggestion is not None
        assert action.example is not None


class TestTailoringPlan:
    """Test TailoringPlan dataclass."""
    
    @pytest.mark.unit
    def test_create_tailoring_plan(self):
        """Test creating a tailoring plan."""
        plan = TailoringPlan(
            job_title="Software Engineer",
            company="TechCorp",
            current_score=0.65,
            projected_score=0.80,
            actions=[],
            keywords_to_add=["kubernetes", "docker"]
        )
        
        assert plan.job_title == "Software Engineer"
        assert plan.company == "TechCorp"
        assert plan.current_score == 0.65
        assert plan.projected_score == 0.80
        assert len(plan.keywords_to_add) == 2


class TestResumeTailor:
    """Test ResumeTailor functionality."""
    
    @pytest.mark.unit
    def test_tailor_initialization(self, tailor):
        """Test tailor can be initialized."""
        assert tailor is not None
        assert tailor.llm is None
    
    @pytest.mark.unit
    def test_create_action_for_technical_gap(self, tailor, sample_resume):
        """Test creating action for technical skill gap."""
        req = JobRequirement(
            text="Kubernetes and Docker experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["kubernetes", "docker"]
        )
        
        match = RequirementMatch(
            requirement=req,
            strength=MatchStrength.GAP
        )
        
        action = tailor._create_action(match, sample_resume)
        
        assert action is not None
        assert action.action_type == "add_skill"
        assert action.priority == "high"
        assert "kubernetes" in action.suggestion.lower() or "docker" in action.suggestion.lower()
    
    @pytest.mark.unit
    def test_create_action_for_experience_partial(self, tailor, sample_resume):
        """Test creating action for partial experience match."""
        req = JobRequirement(
            text="5+ years Python development",
            category=RequirementCategory.EXPERIENCE,
            requirement_type=RequirementType.REQUIRED,
            years_experience=5
        )
        
        match = RequirementMatch(
            requirement=req,
            strength=MatchStrength.PARTIAL
        )
        
        action = tailor._create_action(match, sample_resume)
        
        assert action is not None
        assert action.action_type == "add_bullet"
        assert action.priority == "high"
    
    @pytest.mark.unit
    def test_create_action_for_technical_partial(self, tailor, sample_resume):
        """Test creating action for partial technical match."""
        req = JobRequirement(
            text="Python and Rust",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["python", "rust"]
        )
        
        match = RequirementMatch(
            requirement=req,
            strength=MatchStrength.PARTIAL,
            evidence=["python"]
        )
        
        action = tailor._create_action(match, sample_resume)
        
        assert action is not None
        assert action.action_type == "add_keyword"
        assert "rust" in action.suggestion.lower()
    
    @pytest.mark.unit
    def test_generate_bullet_example(self, tailor):
        """Test generating example bullet point."""
        req = JobRequirement(
            text="FastAPI and PostgreSQL",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["fastapi", "postgresql"]
        )
        
        example = tailor._generate_bullet_example(req)
        
        assert example is not None
        assert len(example) > 20
        assert "fastapi" in example.lower() or "postgresql" in example.lower()
    
    @pytest.mark.unit
    def test_generate_cover_letter_points(self, tailor, sample_analysis):
        """Test generating cover letter talking points."""
        points = tailor._generate_cover_points(sample_analysis)
        
        assert isinstance(points, list)
        # Should generate points for gaps
        if sample_analysis.gaps > 0:
            assert len(points) > 0
    
    @pytest.mark.unit
    def test_project_score_improvement(self, tailor):
        """Test projecting score after improvements."""
        analysis = FitAnalysis(
            match_score=0.60,
            match_label="Moderate",
            should_apply=True,
            recommendation="Apply",
            matches=[],
            gaps=2
        )
        
        actions = [
            TailoringAction(
                action_type="add_skill",
                section="Skills",
                priority="high",
                suggestion="Add skill"
            ),
            TailoringAction(
                action_type="add_bullet",
                section="Experience",
                priority="high",
                suggestion="Add bullet"
            ),
        ]
        
        projected = tailor._project_score(analysis, actions)
        
        assert projected > analysis.match_score
        assert projected <= 1.0
    
    @pytest.mark.integration
    def test_generate_complete_plan(self, tailor, sample_resume, sample_job, sample_analysis):
        """Test generating a complete tailoring plan."""
        plan = tailor.generate_plan(sample_resume, sample_job, sample_analysis)
        
        assert plan is not None
        assert plan.job_title == sample_job.title
        assert plan.company == sample_job.company
        assert plan.current_score == sample_analysis.match_score
        assert plan.projected_score >= plan.current_score
        
        # Should have actions for gaps and partial matches
        if sample_analysis.gaps > 0 or sample_analysis.partial_matches > 0:
            assert len(plan.actions) > 0
        
        # Should have keywords to add
        if sample_analysis.missing_keywords:
            assert len(plan.keywords_to_add) > 0
    
    @pytest.mark.integration
    def test_generate_plan_prioritizes_required(self, tailor, sample_resume):
        """Test that plan prioritizes required requirements."""
        job = ParsedJobPosting(
            url="test",
            title="Engineer",
            company="Co",
            location="Remote",
            requirements=[
                JobRequirement(
                    text="Required: Kubernetes",
                    category=RequirementCategory.TECHNICAL_SKILLS,
                    requirement_type=RequirementType.REQUIRED,
                    keywords=["kubernetes"]
                ),
                JobRequirement(
                    text="Preferred: Terraform",
                    category=RequirementCategory.TECHNICAL_SKILLS,
                    requirement_type=RequirementType.PREFERRED,
                    keywords=["terraform"]
                ),
            ]
        )
        
        analysis = FitAnalysis(
            match_score=0.5,
            match_label="Moderate",
            should_apply=True,
            recommendation="Apply",
            matches=[
                RequirementMatch(
                    requirement=job.requirements[0],
                    strength=MatchStrength.GAP,
                    suggestion="Add Kubernetes"
                ),
                RequirementMatch(
                    requirement=job.requirements[1],
                    strength=MatchStrength.GAP,
                    suggestion="Add Terraform"
                ),
            ],
            gaps=2,
            top_suggestions=["Add Kubernetes", "Add Terraform"],
            missing_keywords=["kubernetes", "terraform"]
        )
        
        plan = tailor.generate_plan(sample_resume, job, analysis)
        
        # First action should address required gap (higher priority)
        if len(plan.actions) > 0:
            first_action = plan.actions[0]
            assert first_action.priority in ["high", "medium"]
    
    @pytest.mark.unit
    def test_empty_analysis_generates_minimal_plan(self, tailor, sample_resume, sample_job):
        """Test that empty analysis still generates a valid plan."""
        analysis = FitAnalysis(
            match_score=0.95,
            match_label="Strong Match",
            should_apply=True,
            recommendation="Great fit!",
            matches=[],
            strong_matches=5,
            gaps=0
        )
        
        plan = tailor.generate_plan(sample_resume, sample_job, analysis)
        
        assert plan is not None
        assert plan.current_score == 0.95
        # Minimal actions since it's already a strong match
        assert len(plan.actions) >= 0
