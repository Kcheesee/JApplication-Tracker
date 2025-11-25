"""Test configuration and fixtures for Job Fit Analyzer tests."""
import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

# Import your app components here as they're created
# from app.main import app
# from app.database import Base


@pytest.fixture(scope="session")
def db_engine():
    """Create a test database engine."""
    # Use SQLite for testing
    engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
    # Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="module")
def test_client():
    """Create a test client for API testing."""
    # from app.main import app
    # client = TestClient(app)
    # return client
    pass


@pytest.fixture
def sample_resume_data():
    """Sample resume data for testing."""
    return {
        "name": "John Developer",
        "email": "john@example.com",
        "location": "San Francisco, CA",
        "summary": "Software engineer with 5 years of experience in Python and React",
        "experiences": [
            {
                "title": "Senior Software Engineer",
                "company": "Tech Corp",
                "start": "2020-01",
                "end": "2024-11",
                "bullets": [
                    "Built REST APIs using FastAPI and PostgreSQL",
                    "Developed React frontend components",
                    "Implemented CI/CD pipelines with GitHub Actions",
                ]
            },
            {
                "title": "Software Engineer",
                "company": "StartupCo",
                "start": "2018-06",
                "end": "2019-12",
                "bullets": [
                    "Created Python microservices",
                    "Designed database schemas",
                ]
            }
        ],
        "technical_skills": [
            "Python", "FastAPI", "React", "PostgreSQL", "Docker", 
            "Git", "REST APIs", "JavaScript", "TypeScript"
        ],
        "soft_skills": ["Communication", "Leadership", "Problem Solving"],
        "education": [
            {
                "degree": "BS Computer Science",
                "school": "Tech University",
                "year": 2018,
                "gpa": 3.7
            }
        ],
        "projects": [
            {
                "name": "Job Tracker",
                "description": "Full-stack job application tracker",
                "technologies": ["FastAPI", "React", "PostgreSQL"],
                "url": "https://github.com/user/job-tracker"
            }
        ],
        "certifications": [],
        "total_years_experience": 5,
        "industries": ["Technology", "Software"]
    }


@pytest.fixture
def sample_job_requirements():
    """Sample job requirements for testing."""
    from app.analyzer.job_parser import JobRequirement, RequirementCategory, RequirementType
    
    return [
        JobRequirement(
            text="5+ years of Python development experience",
            category=RequirementCategory.EXPERIENCE,
            requirement_type=RequirementType.REQUIRED,
            keywords=["python"],
            years_experience=5
        ),
        JobRequirement(
            text="Experience with FastAPI or Flask",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["fastapi", "flask"]
        ),
        JobRequirement(
            text="React or Vue.js frontend experience",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.REQUIRED,
            keywords=["react", "vue"]
        ),
        JobRequirement(
            text="Kubernetes experience a plus",
            category=RequirementCategory.TECHNICAL_SKILLS,
            requirement_type=RequirementType.PREFERRED,
            keywords=["kubernetes"]
        ),
        JobRequirement(
            text="Bachelor's degree in Computer Science",
            category=RequirementCategory.EDUCATION,
            requirement_type=RequirementType.REQUIRED,
            keywords=["bachelor", "computer science"]
        ),
    ]


@pytest.fixture
def mock_job_posting_html():
    """Sample job posting HTML for testing parsers."""
    return """
    <html>
        <head><title>Senior Software Engineer - TechCorp</title></head>
        <body>
            <div class="job-posting">
                <h1>Senior Software Engineer</h1>
                <div class="company">TechCorp</div>
                <div class="location">San Francisco, CA</div>
                
                <div class="description">
                    <h2>About the Role</h2>
                    <p>We're looking for a talented engineer to join our team.</p>
                </div>
                
                <div class="requirements">
                    <h2>Requirements</h2>
                    <ul>
                        <li>5+ years of Python development experience</li>
                        <li>Experience with FastAPI or Flask</li>
                        <li>React or Vue.js frontend experience</li>
                        <li>Strong communication skills</li>
                        <li>Bachelor's degree in Computer Science or related field</li>
                    </ul>
                    
                    <h2>Nice to Have</h2>
                    <ul>
                        <li>Kubernetes experience</li>
                        <li>AWS or GCP cloud experience</li>
                    </ul>
                </div>
                
                <div class="benefits">
                    <h2>Benefits</h2>
                    <ul>
                        <li>Competitive salary</li>
                        <li>Health insurance</li>
                        <li>Remote work options</li>
                    </ul>
                </div>
            </div>
        </body>
    </html>
    """
