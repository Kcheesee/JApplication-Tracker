# Contributing to Job Application Tracker

First off, thank you for considering contributing to Job Application Tracker! 🎉

It's people like you that make this tool better for job seekers everywhere.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Style Guides](#style-guides)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
  - [Python Style Guide](#python-style-guide)
- [Development Setup](#development-setup)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be respectful**: Treat everyone with respect
- **Be collaborative**: Help others and ask for help when needed
- **Be inclusive**: Welcome newcomers and diverse perspectives
- **Be professional**: Keep discussions constructive

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When you create a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Description:**
A clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior:**
What you expected to happen

**Actual Behavior:**
What actually happened

**Screenshots:**
If applicable, add screenshots

**Environment:**
- OS: [e.g., macOS 14.0]
- Browser: [e.g., Chrome 120]
- Docker Version: [e.g., 24.0.6]

**Additional Context:**
Any other relevant information
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed functionality
- **Use cases** showing why this would be useful
- **Possible implementation** if you have ideas

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Improvements to docs

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our style guides
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Create a pull request** with a clear title and description

**Pull Request Checklist:**

- [ ] Code follows the style guides
- [ ] Tests pass locally
- [ ] New code has tests (if applicable)
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No merge conflicts

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests after the first line

**Examples:**

```bash
✅ Good:
Add salary comparison chart to dashboard
Fix Gmail sync authentication flow
Update README with browser extension setup

❌ Bad:
added stuff
fixed bugs
updates
```

**Commit Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

**Example:**
```bash
feat: Add dark mode toggle to dashboard

- Add theme context provider
- Implement dark mode styles
- Add toggle button in header
- Persist preference in localStorage

Closes #123
```

### TypeScript Style Guide

**General Principles:**
- Use TypeScript strict mode
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names
- Add type annotations for function parameters and return types

**Examples:**

```typescript
// ✅ Good
interface JobFilters {
  status: JobStatus;
  search: string;
  dateRange: DateRange;
}

const filterJobs = (jobs: Job[], filters: JobFilters): Job[] => {
  return jobs.filter(job =>
    job.status === filters.status &&
    job.company.toLowerCase().includes(filters.search.toLowerCase())
  );
};

// ❌ Bad
const filterJobs = (jobs, filters) => {
  return jobs.filter(job => job.status === filters.status);
};
```

**React Component Style:**

```typescript
// ✅ Good
interface DashboardStatsProps {
  jobs: Job[];
  preferences: DashboardPreferences;
}

export function DashboardStats({ jobs, preferences }: DashboardStatsProps) {
  const [loading, setLoading] = useState(false);

  // Component logic
}

// ❌ Bad
export function DashboardStats(props) {
  // Component logic
}
```

### Python Style Guide

Follow [PEP 8](https://pep8.org/) guidelines.

**Key Points:**
- Use 4 spaces for indentation
- Max line length: 88 characters (Black formatter)
- Use type hints
- Write docstrings for functions and classes

**Examples:**

```python
# ✅ Good
from typing import List, Optional
from pydantic import BaseModel

class ApplicationCreate(BaseModel):
    """Schema for creating a new job application."""

    company: str
    position: Optional[str] = None
    status: str = "Applied"

    class Config:
        from_attributes = True

def get_applications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[Application]:
    """
    Retrieve job applications for a user.

    Args:
        db: Database session
        user_id: ID of the user
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of Application objects
    """
    return db.query(Application)\\
        .filter(Application.user_id == user_id)\\
        .offset(skip)\\
        .limit(limit)\\
        .all()

# ❌ Bad
def get_applications(db, user_id, skip=0, limit=100):
    return db.query(Application).filter(Application.user_id == user_id).offset(skip).limit(limit).all()
```

## Development Setup

### Prerequisites

- Docker Desktop installed
- Git installed
- Code editor (VS Code recommended)

### Setup Steps

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/job-application-tracker.git
   cd job-application-tracker
   ```

2. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Start the development environment**
   ```bash
   docker compose up -d
   ```

4. **Make your changes**
   - Frontend code: `frontend/src/`
   - Backend code: `backend/app/`
   - Browser extension: `browser-extension/`

5. **Test your changes**
   ```bash
   # Frontend
   docker exec job-tracker-frontend npm test

   # Backend
   docker exec job-tracker-backend pytest
   ```

6. **View your changes**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

7. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to GitHub and create a PR from your branch
   - Fill in the PR template
   - Wait for review

### Hot Reload

The development environment supports hot reload:
- **Frontend**: Changes to React files reload automatically
- **Backend**: Changes to Python files restart the server automatically

### Running Specific Tests

```bash
# Frontend - specific file
docker exec job-tracker-frontend npm test -- DashboardStats.test.tsx

# Backend - specific file
docker exec job-tracker-backend pytest tests/test_applications.py

# Backend - with coverage
docker exec job-tracker-backend pytest --cov=app tests/
```

### Database Migrations

```bash
# Create a new migration
docker exec job-tracker-backend alembic revision --autogenerate -m "Add new column"

# Apply migrations
docker exec job-tracker-backend alembic upgrade head

# Rollback
docker exec job-tracker-backend alembic downgrade -1
```

### Code Formatting

```bash
# Frontend (Prettier)
docker exec job-tracker-frontend npm run format

# Backend (Black)
docker exec job-tracker-backend black app/

# Backend (isort for imports)
docker exec job-tracker-backend isort app/
```

## Project Structure

```
job-application-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── api/            # API client
│   └── tests/              # Frontend tests
├── backend/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   └── tests/              # Backend tests
├── browser-extension/      # Chrome extension
└── docs/                   # Documentation
```

## Need Help?

- **Questions?** Open a [GitHub Discussion](https://github.com/yourusername/job-application-tracker/discussions)
- **Bug?** Open a [GitHub Issue](https://github.com/yourusername/job-application-tracker/issues)
- **Want to chat?** Join our Discord (link coming soon)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for making Job Application Tracker better! 🙏

---

**Remember**: Every contribution counts, no matter how small!
