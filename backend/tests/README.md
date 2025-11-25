# Job Fit Analyzer Tests

Test suite for the Job Fit Analyzer feature.

## Structure

```
tests/
├── conftest.py                    # Shared test fixtures
├── fixtures/                      # Test data
│   ├── job_postings/             # Sample job posting HTML
│   ├── resumes/                  # Sample resume JSON data
│   └── expected/                 # Expected analysis outputs
└── test_analyzer/                # Test modules
    ├── test_job_parser.py
    ├── test_resume_matcher.py
    ├── test_resume_tailor.py
    ├── test_analyzer_routes.py
    └── test_database.py
```

## Running Tests

### Run all tests
```bash
cd backend
pytest
```

### Run specific test file
```bash
pytest tests/test_analyzer/test_job_parser.py -v
```

### Run with coverage
```bash
pytest --cov=app/analyzer --cov-report=html
```

### Run only unit tests
```bash
pytest -m unit
```

### Run only integration tests
```bash
pytest -m integration
```

## Test Fixtures

### Resumes
- `senior_engineer.json` - 8 years experience, strong technical skills
- `junior_developer.json` - 1 year experience, recent graduate

### Job Postings
- `greenhouse_senior_engineer.html` - Senior Software Engineer role at TechCorp

## Coverage Goals

- Overall: ≥ 80%
- Job Parser: ≥ 90%
- Resume Matcher: ≥ 90%
- API Endpoints: ≥ 85%

## Writing Tests

### Unit Test Example
```python
import pytest

@pytest.mark.unit
def test_example(sample_resume_data):
    # Test implementation
    pass
```

### Integration Test Example
```python
import pytest

@pytest.mark.integration
async def test_api_endpoint(test_client):
    response = await test_client.post("/api/analyzer/analyze", json={...})
    assert response.status_code == 200
```

## Test Database

Tests use SQLite in-memory database. Database fixtures are defined in `conftest.py`.
