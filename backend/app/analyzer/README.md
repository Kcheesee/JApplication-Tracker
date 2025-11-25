# Job Fit Analyzer Module

AI-powered job posting analysis and resume matching engine.

## Overview

The Job Fit Analyzer helps users determine how well their resume matches a job posting, providing:
- **Match Score** (0-100%) with detailed breakdown
- **Requirement Analysis** - Which requirements you meet/miss
- **Tailoring Suggestions** - Specific actions to improve your resume
- **Keywords** - Important terms to include

## Components

### 1. Job Parser (`job_parser.py`)
Extracts structured requirements from job postings.

**Supported Platforms**:
- Greenhouse
- Generic job boards (fallback)

**Features**:
- Automatic categorization (experience, technical skills, education, etc.)
- Keyword extraction
- Years of experience detection
- Required vs preferred identification

### 2. Resume Matcher (`resume_matcher.py`)
Matches resumes against job requirements.

**Match Strengths**:
- **Strong**: Clearly meets or exceeds
- **Match**: Meets requirement
- **Partial**: Partially meets
- **Weak**: Tangentially related
- **Gap**: Does not meet

**Scoring**:
- Weighted algorithm (required > preferred)
- Evidence-based matching
- Dealbreaker detection

### 3. Resume Tailor (`resume_tailor.py`)
Generates resume improvement suggestions.

**Action Types**:
- Add skills
- Add/modify bullets
- Incorporate keywords
- Update summary

**Outputs**:
- Prioritized action list
- Score projection
- Cover letter talking points
- Keywords to add

## Quick Start

### Analyze a Job
```python
from app.analyzer.job_parser import JobPostingParser
from app.analyzer.resume_matcher import ResumeMatcher, ResumeData

# Parse job
parser = JobPostingParser()
raw_data = parser._parse_greenhouse(html_content)
requirements = parser._extract_requirements(raw_data)

# Create job object
from app.analyzer.job_parser import ParsedJobPosting
job = ParsedJobPosting(
    url="https://example.com/job",
    title="Software Engineer",
    company="TechCorp",
    location="Remote",
    requirements=requirements
)

# Match resume
resume = ResumeData(
    name="John Doe",
    email="john@example.com",
    technical_skills=["Python", "FastAPI"],
    total_years_experience=5,
    # ... other fields
)

matcher = ResumeMatcher()
analysis = matcher.analyze_fit(resume, job)

print(f"Match Score: {analysis.match_score * 100}%")
print(f"Should Apply: {analysis.should_apply}")
print(f"Recommendation: {analysis.recommendation}")
```

### Generate Tailoring Plan
```python
from app.analyzer.resume_tailor import ResumeTailor

tailor = ResumeTailor()
plan = tailor.generate_plan(resume, job, analysis)

print(f"Projected Score: {plan.projected_score * 100}%")
for action in plan.actions:
    print(f"[{action.priority}] {action.suggestion}")
```

## API Endpoints

See `/api/docs` for full API documentation.

**Main Endpoints**:
- `POST /api/analyzer/analyze` - Analyze job fit
- `POST /api/analyzer/tailor` - Generate tailoring plan
- `POST /api/analyzer/quick-check` - Quick keyword check

**Database Integration**:
- `POST /api/analyzer/applications/{id}/save-analysis`
- `GET /api/analyzer/applications/{id}/analysis`

## Testing

```bash
# Run all tests
pytest tests/test_analyzer/ -v

# With coverage
pytest tests/test_analyzer/ --cov=app/analyzer

# Specific component
pytest tests/test_analyzer/test_job_parser.py -v
```

## Test Results

- **44/49 tests passing** (90%)
- **86% code coverage**
- Job Parser: 95% coverage
- Resume Matcher: 77% coverage
- Resume Tailor: 88% coverage

## Architecture

```
analyzer/
├── job_parser.py        # Parse job postings
├── resume_matcher.py    # Match & score
└── resume_tailor.py     # Generate suggestions
```

**Design Principles**:
- **Modular**: Each component is independent
- **Testable**: High test coverage, TDD approach
- **Extensible**: Easy to add new job boards, categories
- **Type-Safe**: Full type hints with dataclasses

## Future Enhancements

- LLM integration for better parsing
- Support for more job boards (Lever, LinkedIn, Workday)
- PDF resume parsing
- Multi-language support
- Pattern detection across applications

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Maintain 80%+ coverage
3. Add type hints
4. Document with docstrings
5. Update this README

## Performance

**Targets**:
- Parse job: < 3s
- Match resume: < 2s
- Generate tailoring: < 2s
- **Total: < 7s**

## License

Part of Job Application Tracker - Internal use
