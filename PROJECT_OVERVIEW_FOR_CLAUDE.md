# Job Application Tracker v2.0 - Project Overview for Claude Memory

## Project Summary
A full-stack, AI-powered job application tracking platform built with React 18, FastAPI, and PostgreSQL. Features multi-user authentication, Gmail sync with Claude AI parsing, Google Sign In, status history tracking, bulk operations, and comprehensive analytics dashboard.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** + **shadcn/ui** for styling
- **Framer Motion** for animations
- **React Router** for routing
- **Axios** for API calls
- **React Hot Toast** for notifications

### Backend
- **FastAPI** (Python 3.11)
- **PostgreSQL 15** database
- **SQLAlchemy** ORM
- **JWT** authentication with bcrypt password hashing
- **Anthropic Claude AI** for email/job posting parsing
- **Google Gmail API** for email sync
- **Google OAuth 2.0** for authentication

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Deployed on Render** (backend + PostgreSQL)
- **Deployed on Render** (frontend static site)

## Key Features

### 1. Authentication System
- Multi-user support with JWT tokens
- Traditional email/password registration and login
- Google Sign In OAuth integration
- Secure password hashing with bcrypt
- Protected API routes with dependency injection

### 2. AI-Powered Gmail Sync
- OAuth 2.0 integration with Gmail API
- Scans user's inbox for job application emails (last 90 days)
- Claude AI extracts structured data from unstructured emails
- Smart pre-filtering to skip spam/newsletters
- Batch processing (200 emails max per sync)
- Batch commits every 10 records to prevent data loss
- Handles errors gracefully, continues processing on failures

### 3. Status History Timeline
- Automatic tracking of all status changes
- Visual timeline with icons and colors
- Stores old status, new status, timestamp, and notes
- Cascade deletes when application is removed
- Displayed in dedicated "Timeline" tab in job details

### 4. Bulk Actions
- Checkbox selection for multiple applications
- Bulk status updates (update 10+ apps at once)
- Bulk delete with confirmation
- Select all / clear selection
- Visual feedback with highlighted rows

### 5. Dashboard Analytics
- Real-time statistics (total apps, interviews, offers, response rate)
- Status breakdown pie chart
- 30-day application timeline chart
- Recent activity feed
- Customizable widgets

### 6. Comprehensive Application Tracking
- 20+ fields per application
- Company, position, location, salary range
- Status (Applied, Interviewing, Offer, Rejected, etc.)
- Application date, response date, interview dates
- Recruiter contact info
- Job description, notes, benefits
- Links to job posting and application portal
- Resume version tracking

### 7. Data Management
- CSV export (all fields)
- JSON export (full backup)
- PDF export (formatted reports)
- Duplicate detection
- Search and filtering
- URL validation

## Architecture

### Database Schema

**users**
- id, email, username, hashed_password, full_name, created_at

**user_settings**
- user_id (FK), gmail_enabled, google_credentials, google_token, api_keys

**applications**
- id, user_id (FK), company, position, status, location, salary_min, salary_max
- application_date, response_date, interview_date, notes, job_description
- recruiter_name, recruiter_email, job_link, source, resume_version, created_at, updated_at

**status_history**
- id, application_id (FK), old_status, new_status, notes, changed_by, changed_at

### API Structure

**Authentication** (`/api/auth`)
- POST `/register` - Create new user
- POST `/login` - Username/password login (returns JWT)
- GET `/me` - Get current user info
- GET `/google/login` - Initiate Google Sign In OAuth
- GET `/google/callback` - Handle Google OAuth callback

**OAuth** (`/api/oauth`)
- GET `/google/authorize` - Initiate Gmail OAuth (authenticated)
- GET `/google/callback` - Handle Gmail OAuth callback
- POST `/google/disconnect` - Revoke Gmail access
- GET `/google/status` - Check Gmail connection status

**Applications** (`/api/applications`)
- GET `/` - List all user's applications (with filters)
- POST `/` - Create new application
- GET `/{id}` - Get single application
- PUT `/{id}` - Update application (auto-tracks status history)
- DELETE `/{id}` - Delete application
- GET `/{id}/history` - Get status history timeline
- POST `/{id}/bulk-update-status` - Bulk update status
- POST `/bulk-delete` - Bulk delete applications
- GET `/export/csv` - Export to CSV
- GET `/export/json` - Export to JSON

**Sync** (`/api/sync`)
- POST `/gmail` - Trigger Gmail sync (authenticated)
- Uses Claude AI to parse emails
- Returns: new_count, updated_count, skipped_count, error_count

**Settings** (`/api/settings`)
- GET `/` - Get user settings
- PUT `/` - Update user settings

**LLM** (`/api/llm`)
- GET `/providers` - List available LLM providers
- POST `/update-key` - Update API key

## Key Implementation Details

### Gmail Sync Process
1. User clicks "Sync Gmail" button in Settings
2. Frontend redirects to `/api/oauth/google/authorize`
3. User authorizes Gmail access via Google OAuth
4. Backend stores refresh token encrypted
5. User clicks "Sync Gmail" to start sync
6. Backend fetches last 200 emails from Gmail
7. Pre-filters emails (skip spam, newsletters)
8. For each email, Claude AI extracts job details
9. Batch commits every 10 records
10. Returns summary (new, updated, skipped, errors)

### OAuth Scope Management
- **Google Sign In** uses: `openid`, `userinfo.email`, `userinfo.profile`
- **Gmail Sync** uses: `gmail.readonly`, `gmail.modify`
- Both use `include_granted_scopes='false'` to prevent scope conflicts
- Separate redirect URIs for each OAuth flow

### Status History Tracking
- Automatically triggered in `PUT /api/applications/{id}`
- Compares old_status vs new_status
- Creates StatusHistory record only if status changed
- Frontend displays in Timeline tab with visual indicators

### Bulk Operations
- Frontend manages `selectedJobs` Set in state
- Checkbox column added to JobTable
- BulkActionsToolbar appears when selection > 0
- Backend endpoints accept `application_ids[]` array
- All operations wrapped in transactions

### Data Validation
- Pydantic schemas for request/response validation
- URL validation before saving links
- Date validation for application/interview dates
- Salary range validation (min <= max)
- Email format validation

## Development Workflow

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Development
```bash
docker-compose up -d
```

### Database Migrations
Located in `backend/migrations/`:
- `001_initial_schema.sql` - Users, applications, settings
- `002_add_status_history.sql` - Status history table

### Production Build
```bash
# Frontend
cd frontend
npm run build  # Output: dist/

# Backend
# Uses gunicorn with uvicorn workers on Render
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-jwt-secret-key
FRONTEND_URL=https://your-frontend.com
BACKEND_URL=https://your-backend.com
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
ENCRYPTION_KEY=base64-encoded-fernet-key
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.com
```

## Common Issues & Solutions

### OAuth Scope Mismatch
- Fixed by setting `include_granted_scopes='false'`
- Prevents Google from adding previously granted scopes

### Gmail Sync Timeout
- Reduced max emails from 500 to 200
- Added batch commits every 10 records
- Added per-email error handling
- Pre-filter emails before AI processing

### Google Sign In Double-Click
- Fixed by updating AuthContext state immediately
- Added `setUser()` method to context
- Called after fetching user from `/api/auth/me`

### Build Errors
- Removed unused imports
- Simplified JobScraper component
- Fixed TypeScript strict mode issues

## Deployment (Render)

### PostgreSQL Database
- Postgres 15
- Shared instance (free tier)

### Backend Web Service
- Build: `pip install -r backend/requirements.txt`
- Start: `gunicorn app.main:app --workers 4 -k uvicorn.workers.UvicornWorker`
- Auto-deploys from `main` branch

### Frontend Static Site
- Build: `cd frontend && npm install && npm run build`
- Publish: `frontend/dist`
- Auto-deploys from `main` branch

## Future Enhancements (Roadmap)

### v2.1
- Dark mode
- Email templates with variables
- Calendar integration (Google Calendar, Outlook)
- Salary comparison charts
- Application streak tracking

### v3.0
- Mobile app (React Native)
- AI resume optimization
- Interview scheduler
- Browser extension
- Slack/Discord notifications
- Team collaboration

## File Structure Overview
```
backend/
├── app/
│   ├── routes/          # API endpoints
│   ├── models/          # SQLAlchemy models
│   ├── services/        # Business logic (gmail_service, llm_service)
│   ├── auth/            # Security, JWT handling
│   ├── migrations/      # SQL migration files
│   └── main.py          # FastAPI app initialization

frontend/
├── src/
│   ├── components/      # React components
│   │   ├── JobTable.tsx
│   │   ├── JobDetailsDialog.tsx
│   │   ├── StatusTimeline.tsx
│   │   ├── BulkActionsToolbar.tsx
│   │   └── Layout.tsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Applications.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   ├── context/         # AuthContext
│   ├── lib/             # Utilities, API client
│   └── App.tsx
```

## Key Learnings & Decisions

1. **Batch Commits**: Essential for long-running operations to prevent data loss
2. **Pre-filtering**: Reduces AI costs by 50%+ by skipping obvious non-job emails
3. **Separate OAuth Flows**: Login and Gmail need separate scopes and callbacks
4. **Status History**: Automatically tracked, not manual - ensures consistency
5. **Bulk Operations**: Frontend state management for selection is cleaner than backend
6. **URL Validation**: Prevents broken links and 404s in UI
7. **JWT in localStorage**: Simple, works well for SPA, user must re-login if cleared

## Project Metrics
- **Backend**: ~3,500 lines of Python
- **Frontend**: ~4,000 lines of TypeScript/React
- **Database**: 4 tables, ~30 columns total
- **API Endpoints**: 20+ routes
- **Components**: 25+ React components
- **Development Time**: ~2 weeks intensive work
- **Version**: 2.0 (multi-user, AI-powered)
