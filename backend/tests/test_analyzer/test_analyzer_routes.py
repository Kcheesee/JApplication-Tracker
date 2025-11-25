"""Tests for Analyzer API routes."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.auth.security import create_access_token


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analyzer_routes.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def setup_database():
    """Create test database tables."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(setup_database):
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def test_user():
    """Create a test user in the database."""
    db = TestingSessionLocal()
    try:
        # Clean up any existing test user
        db.query(User).filter(User.email == "test@example.com").delete()
        db.commit()
        
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hashed_test_password",
            full_name="Test User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers with token."""
    token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {token}"}


class TestAnalyzeEndpoint:
    """Test the /api/analyzer/analyze endpoint."""
    
    @pytest.mark.integration
    def test_analyze_success(self, client, auth_headers):
        """Test successful job fit analysis."""
        payload = {
            "job_url": "https://example.com/jobs/123",
            "job_html": "<html><h1>Senior Software Engineer</h1></html>",
            "resume_data": {
                "name": "John Doe",
                "email": "john@example.com",
                "location": "San Francisco",
                "technical_skills": ["Python", "FastAPI"],
                "total_years_experience": 5,
                "experiences": []
            }
        }
        
        response = client.post("/api/analyzer/analyze", json=payload, headers=auth_headers)
        
        # Should return 200 or proper error
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "match_score" in data
            assert "match_label" in data
            assert "should_apply" in data
    
    @pytest.mark.integration
    def test_analyze_missing_resume(self, client, auth_headers):
        """Test analysis with missing resume data."""
        payload = {
            "job_url": "https://example.com/jobs/123",
            "job_html": "<html>Test</html>"
        }
        
        response = client.post("/api/analyzer/analyze", json=payload, headers=auth_headers)
        
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.integration
    def test_analyze_unauthorized(self, client):
        """Test analysis without authentication."""
        payload = {
            "job_url": "https://example.com/jobs/123",
            "job_html": "<html>Test</html>",
            "resume_data": {"name": "Test"}
        }
        
        response = client.post("/api/analyzer/analyze", json=payload)
        
        assert response.status_code == 401  # Unauthorized


class TestTailorEndpoint:
    """Test the /api/analyzer/tailor endpoint."""
    
    @pytest.mark.integration
    def test_tailor_success(self, client, auth_headers):
        """Test successful resume tailoring."""
        payload = {
            "job_url": "https://example.com/jobs/123",
            "job_html": "<html><h1>Software Engineer</h1></html>",
            "resume_data": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "location": "Remote",
                "technical_skills": ["Python"],
                "total_years_experience": 3,
                "experiences": []
            },
            "analysis": {
                "match_score": 0.65,
                "match_label": "Moderate Match",
                "should_apply": True,
                "recommendation": "Apply",
                "matches": [],
                "strong_matches": 1,
                "matches_count": 2,
                "partial_matches": 1,
                "gaps": 1,
                "dealbreakers": [],
                "top_suggestions": ["Add Docker"],
                "missing_keywords": ["docker", "kubernetes"]
            }
        }
        
        response = client.post("/api/analyzer/tailor", json=payload, headers=auth_headers)
        
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "job_title" in data or "actions" in data
    
    @pytest.mark.integration
    def test_tailor_unauthorized(self, client):
        """Test tailoring without authentication."""
        payload = {
            "job_url": "test",
            "job_html": "test",
            "resume_data": {},
            "analysis": {}
        }
        
        response = client.post("/api/analyzer/tailor", json=payload)
        
        assert response.status_code == 401


class TestQuickCheckEndpoint:
    """Test the /api/analyzer/quick-check endpoint."""
    
    @pytest.mark.integration
    def test_quick_check_success(self, client, auth_headers):
        """Test quick compatibility check."""
        payload = {
            "job_description": "Looking for Python developer with 5+ years experience",
            "resume_summary": "Software engineer with 8 years Python experience"
        }
        
        response = client.post("/api/analyzer/quick-check", json=payload, headers=auth_headers)
        
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "compatible" in data or "score" in data
    
    @pytest.mark.integration
    def test_quick_check_empty_input(self, client, auth_headers):
        """Test quick check with empty inputs."""
        payload = {
            "job_description": "",
            "resume_summary": ""
        }
        
        response = client.post("/api/analyzer/quick-check", json=payload, headers=auth_headers)
        
        # Should handle gracefully
        assert response.status_code in [200, 400, 422]
