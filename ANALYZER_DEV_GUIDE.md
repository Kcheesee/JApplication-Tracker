# Job Fit Analyzer - Development Guide

Quick reference for developing and testing the Job Fit Analyzer feature.

## Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Test Database
```bash
# Tests use SQLite by default, no setup needed
# For PostgreSQL testing, create test database:
createdb job_tracker_test
```

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/job-fit-analyzer
```

### 2. Implement Component with Tests (TDD Approach)
```bash
# Write test first
vim tests/test_analyzer/test_job_parser.py

# Run test (should fail)
pytest tests/test_analyzer/test_job_parser.py -v

# Implement feature
vim app/analyzer/job_parser.py

# Run test again (should pass)
pytest tests/test_analyzer/test_job_parser.py -v
```

### 3. Check Coverage
```bash
pytest --cov=app/analyzer --cov-report=term-missing
```

### 4. Run All Tests Before Committing
```bash
pytest
```

### 5. Commit Changes
```bash
git add .
git commit -m "Implement job parser with tests"
```

## Testing Commands

### Quick Test Run
```bash
pytest -v
```

### Detailed Output with Logging
```bash
pytest -v -s
```

### Stop on First Failure
```bash
pytest -x
```

### Run Specific Test
```bash
pytest tests/test_analyzer/test_job_parser.py::TestJobPostingParser::test_parse_greenhouse_job -v
```

### Run Tests Matching Pattern
```bash
pytest -k "test_parse" -v
```

### Run with Coverage Report
```bash
pytest --cov=app/analyzer --cov-report=html
open htmlcov/index.html
```

### Run Only Fast Tests (Skip Slow Ones)
```bash
pytest -m "not slow"
```

## Component Implementation Order

Based on dependencies:

1. **Job Parser** (`app/analyzer/job_parser.py`)
   - Test: `tests/test_analyzer/test_job_parser.py`
   - No dependencies on other analyzer components

2. **Resume Matcher** (`app/analyzer/resume_matcher.py`)
   - Test: `tests/test_analyzer/test_resume_matcher.py`
   - Depends on: Job Parser

3. **Resume Tailor** (`app/analyzer/resume_tailor.py`)
   - Test: `tests/test_analyzer/test_resume_tailor.py`
   - Depends on: Job Parser, Resume Matcher

4. **API Routes** (`app/routes/analyzer.py`)
   - Test: `tests/test_analyzer/test_analyzer_routes.py`
   - Depends on: All analyzer components

5. **Database Integration**
   - Test: `tests/test_analyzer/test_database.py`
   - Depends on: API routes

6. **Frontend Component** (`frontend/src/components/JobFitAnalyzer.tsx`)
   - Test: `frontend/src/components/__tests__/JobFitAnalyzer.test.tsx`
   - Depends on: Backend API

## Debugging Failed Tests

### Get More Information
```bash
pytest -vv --tb=long
```

### Drop into Debugger on Failure
```bash
pytest --pdb
```

### Print Output
```bash
pytest -s
```

## Pre-Push Checklist

- [ ] All tests pass: `pytest`
- [ ] Coverage ≥ 80%: `pytest --cov=app/analyzer --cov-report=term`
- [ ] No linting errors (if linter configured)
- [ ] Manually tested with real job URL
- [ ] Committed with descriptive message

## Manual Testing Endpoints

### Analyze Job Fit
```bash
curl -X POST http://localhost:8000/api/analyzer/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"job_url": "https://boards.greenhouse.io/..."}'
```

### Quick Check (No Resume)
```bash
curl -X POST http://localhost:8000/api/analyzer/quick-check \
  -H "Content-Type: application/json" \
  -d '{"job_url": "https://boards.greenhouse.io/..."}'
```

## Environment Variables

Create `.env` file in backend directory:
```env
DATABASE_URL=postgresql://user:pass@localhost/job_tracker
TEST_DATABASE_URL=sqlite:///./test.db
ANTHROPIC_API_KEY=your_key_here  # For LLM features
```

## Common Issues

### Import Errors
```bash
# Make sure you're in the right directory
cd backend

# Make sure dependencies are installed
pip install -r requirements.txt
```

### Database Errors
```bash
# Reset test database
rm test.db
```

### Coverage Not Working
```bash
# Make sure pytest-cov is installed
pip install pytest-cov
```

## Next Steps

1. Implement Job Parser
2. Write and run unit tests
3. Implement Resume Matcher
4. Implement Resume Tailor
5. Create API endpoints
6. Add database integration
7. Build frontend component
8. Manual E2E testing
9. Deploy to staging
10. Production deployment

## Resources

- Test Plan: See `/.gemini/antigravity/brain/.../implementation_plan.md`
- Spec: `JOB_FIT_ANALYZER_SPEC.md`
- Fixtures: `tests/fixtures/`
