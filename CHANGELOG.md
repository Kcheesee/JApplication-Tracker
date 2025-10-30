# Changelog

All notable changes to the Job Application Tracker project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-30

### 🎉 Major Release - Feature-Rich Dashboard & Automation

This release represents a complete overhaul of the Job Application Tracker with 10 major new features, transforming it from a simple tracker into a comprehensive job search management platform.

###Added
- **Dashboard Analytics**
  - 6 customizable stat cards (total apps, interviews, offers, response rate, pending, rejections)
  - Status breakdown chart with progress bars
  - 30-day application timeline chart
  - Recent activity feed
  - Customizable widget visibility (hide/show any widget)
  - Dashboard preferences persist in localStorage

- **Export Functionality**
  - CSV export with 23 fields
  - JSON export for complete data backup
  - PDF report generation via print dialog
  - Export menu in dashboard header

- **Email Templates**
  - 5 pre-written professional templates
  - Smart variable replacement ({company}, {position}, etc.)
  - Create custom templates
  - One-click copy to clipboard
  - Template management UI
  - Templates stored in localStorage

- **Interview Preparation**
  - Interview questions field in database
  - Interview notes field
  - Company research field
  - Dedicated "Interview Prep" tab in job details
  - Full CRUD support in add/edit forms

- **Goal Tracking**
  - Set weekly and monthly application goals
  - Application streak counter
  - Color-coded progress bars (red/yellow/blue/green)
  - Editable goals with click-to-edit UI
  - Goals persist in localStorage

- **Network Connections Tracker**
  - Track referrals and LinkedIn connections
  - Store contact details (name, role, email, phone, LinkedIn URL)
  - Link connections to job applications
  - Add notes about each connection
  - Full CRUD operations
  - Connections stored in localStorage

- **Salary Comparison**
  - Visual bar chart comparing salaries across companies
  - Summary stats (average, highest, lowest)
  - Crown indicator for highest paying role
  - Sorted by average salary
  - Only displays when salary data exists

- **Calendar Integration**
  - One-click add to Google Calendar
  - Export to Outlook/Apple Calendar (.ics file)
  - Auto-populated with company, role, recruiter details
  - Integrated into interview cards in job details

- **Job Posting Scraper & Bookmarklet**
  - URL-based job detail extraction
  - Drag-and-drop bookmarklet for browser bookmark bar
  - Supports 10+ job boards (LinkedIn, Indeed, Glassdoor, ZipRecruiter, Lever, Greenhouse)
  - Auto-detection of job source
  - Integrated into "Add Application" dialog

- **Browser Extension**
  - Full Chrome/Edge extension
  - Auto-extraction of job details from current page
  - Clean popup UI with form
  - Direct save to tracker backend
  - Content scripts for supported job boards
  - Installation guide included

### Changed
- **Database Schema**
  - Made `position` column nullable (not all emails have position info)
  - Added `resume_version`, `resume_url`, `resume_file_name` columns
  - Added `interview_questions`, `interview_notes`, `company_research` columns

- **UI/UX Improvements**
  - Complete dashboard redesign with analytics focus
  - Enhanced job details dialog with 3 tabs (Details, Interview Prep, Resume)
  - Improved add/edit forms with interview prep section
  - Better mobile responsiveness
  - Smooth animations with Framer Motion

- **Backend**
  - Updated Pydantic schemas for new fields
  - Enhanced data validation
  - Added support for optional position field

### Fixed
- Import errors with apiClient (changed to default export)
- Removed unused imports across components
- Fixed TypeScript type errors
- Database migration issues with position column

### Documentation
- Added comprehensive [FEATURES.md](FEATURES.md:1) listing all capabilities
- Created detailed [CONTRIBUTING.md](CONTRIBUTING.md:1) for contributors
- Added [LICENSE](LICENSE:1) (MIT)
- Enhanced README with feature showcase
- Added browser extension [README](browser-extension/README.md:1)

## [1.0.0] - 2025-10-29

### Initial Release

### Added
- Core job application tracking
- Gmail sync with OAuth 2.0
- PostgreSQL database
- FastAPI backend
- React TypeScript frontend
- Docker Compose setup
- shadcn/ui component library
- Basic CRUD operations for job applications
- Job status tracking
- Application source tracking
- Date tracking (applied, last activity)
- Email link storage
- Basic widget UI

### Technical Stack
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL 15
- Infrastructure: Docker, Docker Compose
- Authentication: Google OAuth 2.0

## [Unreleased]

### Planned for V3.0
- [ ] AI-powered resume optimization
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Interview scheduler with Zoom/Meet integration
- [ ] ATS keyword scanner
- [ ] Team collaboration features
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Notion integration
- [ ] Slack/Discord notifications
- [ ] API for third-party integrations
- [ ] Chrome Web Store publication

---

## Release Notes Format

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### Version Numbers
Following [Semantic Versioning](https://semver.org/):
- **MAJOR** version (X.0.0): Incompatible API changes
- **MINOR** version (0.X.0): New functionality, backwards compatible
- **PATCH** version (0.0.X): Backwards compatible bug fixes

