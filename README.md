# 🚀 Job Application Tracker v2.1

> A powerful, AI-powered job application tracker with Gmail sync, Google Sign In, Job Fit Analyzer, and beautiful analytics to help you land your dream job faster.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

Track every application, never miss a follow-up, and get hired faster with AI-powered automation, smart analytics, and seamless organization.

## ✨ Key Features

### 🤖 **AI-Powered Automation**
- **Gmail Sync**: Automatically import job applications from your inbox using Claude AI
- **Smart Parsing**: Extracts company, position, salary, location, and more from emails
- **Intelligent Filtering**: Pre-filters spam and non-job emails before processing
- **Batch Processing**: Handles large email volumes with progress tracking

### 🔐 **Modern Authentication**
- **Google Sign In**: One-click authentication with your Google account
- **Secure JWT Tokens**: Industry-standard authentication
- **Multi-User Support**: Each user has their own private data
- **OAuth 2.0**: Secure Gmail access without storing passwords

### 📊 **Powerful Dashboard Analytics**
- **Real-Time Stats**: Track applications, interviews, offers, and response rates
- **Visual Charts**: Status breakdown pie chart and 30-day timeline
- **Activity Feed**: See recent changes and updates at a glance
- **Goal Tracking**: Set weekly/monthly goals and track your streak

### 💼 **Comprehensive Application Tracking**
- **20+ Data Fields**: Company, position, salary, location, status, and more
- **Status History Timeline**: See the complete journey of each application
- **Bulk Actions**: Select and update multiple applications at once
- **Interview Prep**: Store questions, notes, and company research
- **Network Contacts**: Track referrals and recruiter relationships

### 🎯 **Job Fit Analyzer** (Enhanced in v2.1)
Deep AI-powered resume-to-job matching with comprehensive analysis:

**Resume Parsing:**
- **PDF Upload**: Drag-and-drop PDF resume with LLM-powered extraction
- **Structured Data**: Extracts skills, experience, education, projects, and certifications
- **Smart Caching**: Parse once, analyze multiple jobs without re-uploading

**Analysis Engine:**
- **Multi-Provider LLM**: Powered by Claude AI (with OpenAI/Gemini support)
- **Smart Requirement Parsing**: Filters out company descriptions, salary info, and responsibilities to focus on actual requirements
- **5-Level Match Scoring**: Exceeds → Match → Partial → Weak → Gap
- **Category Breakdown**: Technical skills, experience, education, soft skills, logistics

**Deep Insights:**
- **Gap Analysis**: Severity-ranked gaps with bridging strategies and time-to-close estimates
- **Strength Highlights**: Your competitive advantages for this specific role
- **Risk Assessment**: Potential rejection reasons with mitigation strategies
- **Competitive Position**: How you stack up against typical applicants

**Strategic Guidance:**
- **Application Strategy**: Personalized go/no-go recommendation
- **Cover Letter Focus**: Key themes to emphasize
- **Interview Prep**: Topics to study and talking points to prepare
- **Questions to Ask**: Thoughtful questions for your interviewer

**Input Flexibility:**
- **URL Input**: Paste job URLs from Greenhouse, Lever, Workday, etc.
- **Paste Mode**: Copy/paste job descriptions directly
- **Quick Check**: Fast compatibility scan before full analysis

### 📱 **Modern, Responsive UI**
- **Beautiful Design**: Built with shadcn/ui and Tailwind CSS
- **Mobile-Friendly**: Works perfectly on phones and tablets
- **Smooth Animations**: Powered by Framer Motion
- **Intuitive Navigation**: Easy to use, hard to get lost

### 🔄 **Data Management**
- **Export Options**: CSV, JSON, and PDF exports
- **Duplicate Detection**: Prevents adding the same job twice
- **Advanced Search**: Find applications quickly with filters
- **Bulk Operations**: Update or delete multiple applications at once

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Google Cloud Project (for Gmail sync - optional)
- Anthropic API key (for AI parsing - optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/job-application-tracker.git
   cd job-application-tracker
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Configure backend/.env**
   ```env
   # Database
   DATABASE_URL=postgresql://postgres:password@localhost:5432/jobtracker

   # Security
   SECRET_KEY=your-super-secret-key-here

   # API URLs
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:8000

   # Optional: AI & Gmail (for advanced features)
   ANTHROPIC_API_KEY=your-anthropic-api-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Configure frontend/.env**
   ```env
   VITE_API_URL=http://localhost:8000
   ```

5. **Start with Docker**
   ```bash
   docker-compose up -d
   ```

6. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

7. **Create an account**
   - Navigate to http://localhost:3000
   - Click "Register" to create your account
   - Or use "Sign in with Google"

That's it! 🎉

## 📖 Usage Guide

### Getting Started

1. **Sign Up/Sign In**
   - Use Google Sign In for quick access
   - Or create an account with email/password

2. **Add Your First Application**
   - Click "Add Application" button
   - Fill in company, position, and other details
   - Or use Gmail Sync to auto-import from your inbox

3. **Set Up Gmail Sync (Optional)**
   - Go to Settings
   - Click "Connect Google Account"
   - Authorize Gmail access
   - Click "Sync Gmail" to import applications
   - AI automatically extracts job details from emails

4. **Track Your Progress**
   - Dashboard shows real-time analytics
   - Update application statuses as you progress
   - View status history timeline for each application
   - Use bulk actions to update multiple applications

### Features Deep Dive

#### Gmail Sync
The Gmail sync feature uses Claude AI to intelligently parse your job application emails:
- Scans last 90 days of emails by default
- Identifies job application confirmations
- Extracts company, position, salary, location, etc.
- Skips spam and non-job emails
- Processes in batches to prevent data loss
- Shows progress and error counts

#### Status History Timeline
Every status change is tracked automatically:
- See when you applied
- Track when you moved to interview stage
- Record offer or rejection dates
- Visual timeline with icons and colors

#### Bulk Actions
Manage multiple applications efficiently:
- Select applications with checkboxes
- Update status for all selected at once
- Delete multiple applications
- Perfect for cleaning up old applications

#### Interview Preparation
For each application, store:
- Common interview questions and your answers
- Notes from interviews
- Company research (culture, products, news)
- Dedicated "Interview Prep" tab

## 🛠️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- React Router (routing)
- Axios (API client)

**Backend:**
- FastAPI (Python)
- PostgreSQL (database)
- SQLAlchemy (ORM)
- JWT Authentication
- Anthropic Claude AI
- Google Gmail API

**Infrastructure:**
- Docker & Docker Compose
- PostgreSQL 15
- Hot reload in development

## 📂 Project Structure

```
job-application-tracker/
├── frontend/                 # React TypeScript app
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── JobTable.tsx
│   │   │   ├── StatusTimeline.tsx
│   │   │   ├── BulkActionsToolbar.tsx
│   │   │   └── ...
│   │   ├── pages/            # Main pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Applications.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── Login.tsx
│   │   ├── context/          # React context
│   │   └── lib/              # Utilities
│   └── public/
├── backend/                  # FastAPI Python app
│   ├── app/
│   │   ├── routes/           # API endpoints
│   │   │   ├── auth.py       # Authentication
│   │   │   ├── oauth.py      # Google OAuth
│   │   │   ├── applications.py
│   │   │   └── sync.py       # Gmail sync
│   │   ├── models/           # Database models
│   │   ├── services/         # Business logic
│   │   └── migrations/       # SQL migrations
│   └── requirements.txt
├── docs/                     # Documentation
└── docker-compose.yml        # Docker orchestration
```

## 🔧 Development

### Running Locally Without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Database:**
```bash
# Install PostgreSQL locally
# Create database
createdb jobtracker

# Run migrations
cd backend
psql jobtracker < migrations/001_initial_schema.sql
psql jobtracker < migrations/002_add_status_history.sql
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
# Output in dist/ folder
```

**Backend:**
```bash
cd backend
# Use gunicorn for production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 🌐 Deployment

### Deploy to Render

See [docs/setup/DEPLOY_TO_RENDER.md](docs/setup/DEPLOY_TO_RENDER.md) for detailed instructions.

**Quick steps:**
1. Create Render account
2. Create PostgreSQL database
3. Create Web Service for backend
4. Create Static Site for frontend
5. Set environment variables
6. Deploy!

### Deploy to Railway

See [docs/setup/QUICKSTART_RAILWAY.md](docs/setup/QUICKSTART_RAILWAY.md) for Railway deployment.

### Deploy to Your Server

See [docs/setup/DEPLOYMENT.md](docs/setup/DEPLOYMENT.md) for self-hosting instructions.

## 🔐 Setting Up Google OAuth

### For Gmail Sync

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:8000/api/oauth/google/callback` (development)
   - `https://your-domain.com/api/oauth/google/callback` (production)
6. Copy Client ID and Client Secret to `backend/.env`

### For Google Sign In

1. Use the same Google Cloud project
2. Add additional redirect URIs:
   - `http://localhost:8000/api/auth/google/callback` (development)
   - `https://your-domain.com/api/auth/google/callback` (production)
3. Scopes needed: `openid`, `userinfo.email`, `userinfo.profile`

See [docs/setup/GOOGLE_OAUTH_SETUP.md](docs/setup/GOOGLE_OAUTH_SETUP.md) for detailed setup.

## 🐛 Troubleshooting

### Port already in use
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
```

### Database connection issues
```bash
# Reset Docker volumes
docker-compose down -v
docker-compose up -d

# Or manually reset
psql -U postgres -c "DROP DATABASE IF EXISTS jobtracker;"
psql -U postgres -c "CREATE DATABASE jobtracker;"
```

### Gmail sync not working
- Verify Google OAuth credentials are correct
- Check that redirect URIs match exactly
- Ensure Gmail API is enabled in Google Cloud Console
- Check backend logs for specific errors

### Build errors
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build

# Backend
cd backend
rm -rf __pycache__
pip install -r requirements.txt --force-reinstall
```

## 📝 What's New in v2.1

### Job Fit Analyzer Enhancements
✅ **PDF Resume Parsing**: Upload PDFs with LLM-powered extraction via Claude AI
✅ **Enhanced Analysis UI**: Grouped requirements by match strength with visual indicators
✅ **Smart Parser Filtering**: Removes company descriptions, salary info, mission statements
✅ **Multi-Currency Support**: Handles USD, GBP, EUR salary filtering
✅ **Category Breakdown**: Visual score bars for technical, experience, education, etc.
✅ **Risk Assessment Panel**: Rejection risks with mitigation strategies
✅ **Strength Highlights**: Your competitive advantages for each role
✅ **Strategic Guidance**: Cover letter focus, interview prep, questions to ask

### UI/UX Improvements
✅ **Reordered Navigation**: Analyzer tab now before Settings for easier access
✅ **Page Layout**: Full Analysis form at top, Quick Check below
✅ **Improved Requirements View**: Color-coded groups (Exceeds/Match/Partial/Weak/Gap)
✅ **Job Info Header**: Shows position, company, location with match score
✅ **Keywords Section**: Found keywords vs missing keywords at a glance

### v2.0 Features (Previous Release)
✅ Multi-user authentication with JWT
✅ Google Sign In integration
✅ Gmail sync with AI parsing
✅ Status history timeline
✅ Bulk actions (select, update, delete)
✅ Mobile-responsive navigation
✅ Enhanced dashboard analytics
✅ Duplicate detection
✅ Data export (CSV, JSON, PDF)

## 🗺️ Roadmap

### Coming Soon (v2.2)
- [ ] Dark mode
- [ ] Email templates with smart variables
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Salary comparison charts
- [ ] Application streak tracking
- [ ] Resume tailoring suggestions export

### Future (v3.0)
- [ ] Mobile app (React Native)
- [ ] AI-powered resume rewriter
- [ ] Interview scheduler with calendar sync
- [ ] Browser extension for one-click job saving
- [ ] Slack/Discord notifications
- [ ] Team collaboration features
- [ ] ATS keyword optimization
- [ ] Cover letter generator

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test` (frontend) or `pytest` (backend)
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Amazing Python framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Anthropic Claude](https://www.anthropic.com/) - AI parsing
- [Lucide Icons](https://lucide.dev/) - Icon set
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/job-application-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/job-application-tracker/discussions)
- **Documentation**: Check the `docs/` folder

## ⭐ Star History

If this project helped you land a job or made your job search easier, please consider giving it a star! ⭐

---

**Built with ❤️ by job seekers, for job seekers.**

Happy job hunting! 🎯
