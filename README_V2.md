# Job Application Tracker v2.0 - Multi-User Platform

A modern, full-stack job application tracking platform with AI-powered email parsing, browser extension, and beautiful web dashboard.

## Features

### Core Features
- **Multi-User Support**: Secure authentication and individual user accounts
- **AI-Powered Parsing**: Uses Claude AI to extract job details from emails and web pages
- **Gmail Integration**: Automatically scans your Gmail for job application emails
- **Web Dashboard**: Modern, responsive React interface
- **Browser Extension**: One-click job tracking from any job posting website
- **Real-time Sync**: Keep your applications updated across all platforms

### Enhanced Tracking
- Comprehensive application data (20+ fields)
- Status tracking (Applied, Interview Scheduled, Rejected, Offer, etc.)
- Salary range tracking
- Interview scheduling
- Recruiter contact information
- Company details and benefits
- Notes and custom fields

## Tech Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **PostgreSQL**: Reliable relational database
- **SQLAlchemy**: Python ORM
- **Redis**: Background job processing
- **Anthropic Claude AI**: Email and job posting parsing
- **Google Gmail API**: Email integration

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client

### Browser Extension
- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: Lightweight and fast

### DevOps
- **Docker & Docker Compose**: Containerization
- **PostgreSQL**: Database
- **Redis**: Caching and queues

## Prerequisites

- **Docker** and **Docker Compose** (recommended) OR
- **Python 3.11+**, **Node.js 18+**, **PostgreSQL 15+**, **Redis**
- **Anthropic API Key** (for AI parsing)
- **Google Cloud Project** (for Gmail integration)

## Quick Start with Docker

### 1. Clone the Repository

```bash
cd "Job Application Tracker"
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Generate a secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Edit backend/.env and add your secret key
nano backend/.env
```

Required environment variables in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/jobtracker
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-generated-secret-key-here
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### 3. Start the Application

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- FastAPI backend (port 8000)
- React frontend (port 3000)

### 4. Access the Application

Open your browser and go to:
- **Frontend Dashboard**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/docs

### 5. Create Your Account

1. Click "Sign Up" on the login page
2. Fill in your email, username, and password
3. Log in with your credentials

## Manual Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL and Redis (install if needed)
# brew install postgresql redis  # On macOS
# sudo apt install postgresql redis-server  # On Ubuntu

# Run the backend
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env if needed

# Start development server
npm run dev
```

## API Configuration

### 1. Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### 2. Configure Google Gmail Integration

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Gmail API and Google Sheets API
4. Create OAuth 2.0 credentials (Desktop application)
5. Download credentials as `credentials.json`
6. Place in the root directory (for the original script) or upload via Settings page

### 3. Add API Keys in the App

1. Log in to the dashboard
2. Go to **Settings**
3. Add your **Anthropic API Key**
4. Upload or configure **Google Credentials** (coming soon - contact support)

## Browser Extension Setup

### Chrome/Edge Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension icon should appear in your toolbar

### Using the Extension

1. Make sure you're logged in to the web dashboard
2. Navigate to any job posting (LinkedIn, Indeed, etc.)
3. Click the extension icon
4. Click "Capture Job from Page"
5. Review and edit the auto-filled information
6. Click "Save" to add to your tracker

## Gmail Sync Setup

### First Time Setup

1. Go to **Settings** in the dashboard
2. Ensure your Anthropic API key is configured
3. Enable "Gmail Sync"
4. Set "Search Days Back" (default: 7 days)
5. Go back to **Dashboard**
6. Click "Sync Gmail" button

### Automatic Sync

To run Gmail sync automatically:

```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * cd /path/to/project && docker-compose exec backend python -m app.tasks.gmail_sync
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Applications
- `GET /api/applications` - List all applications
- `GET /api/applications/{id}` - Get single application
- `POST /api/applications` - Create new application
- `PUT /api/applications/{id}` - Update application
- `DELETE /api/applications/{id}` - Delete application
- `GET /api/applications/stats/summary` - Get statistics

### Sync
- `POST /api/sync/gmail` - Sync applications from Gmail
- `POST /api/sync/parse-job` - Parse job posting with AI

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

## Database Schema

### Users Table
- id, email, username, hashed_password
- full_name, is_active, is_verified
- created_at, updated_at

### Applications Table
- id, user_id, company, position
- status, application_date, application_source
- salary_min, salary_max, salary_currency
- interview_date, interview_type
- location, work_mode
- job_description, role_duties, next_steps
- recruiter_name, recruiter_email, recruiter_phone
- notes, benefits, company_size, industry
- application_deadline, email_id
- created_at, updated_at

### User Settings Table
- id, user_id
- anthropic_api_key, google_credentials, google_token
- spreadsheet_id, auto_sync_enabled, sync_interval_hours
- gmail_enabled, gmail_search_days, gmail_keywords
- email_notifications, daily_summary_enabled

## Deployment

### Deploy to Production

1. **Set up a server** (AWS, DigitalOcean, Heroku, Railway, etc.)

2. **Update environment variables** for production:
```env
ENVIRONMENT=production
SECRET_KEY=very-secure-random-key
DATABASE_URL=your-production-database-url
FRONTEND_URL=https://your-domain.com
```

3. **Build and deploy**:
```bash
# Build frontend for production
cd frontend
npm run build

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

4. **Set up HTTPS** with Let's Encrypt or your hosting provider

### Environment-Specific Configuration

Create `docker-compose.prod.yml` for production with:
- Production environment variables
- HTTPS/SSL configuration
- Resource limits
- Backup strategies
- Monitoring tools

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker ps | grep postgres`
- Check logs: `docker-compose logs backend`
- Verify DATABASE_URL in .env

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check VITE_API_URL in frontend/.env
- Check CORS settings in backend

### Gmail sync fails
- Verify Anthropic API key is set
- Check Google credentials are configured
- Ensure Gmail API is enabled in Google Cloud Console
- Review backend logs for specific errors

### Extension doesn't work
- Make sure you're logged in to the dashboard first
- Verify the extension is loaded in chrome://extensions/
- Check that API_URL in popup.js matches your backend URL
- Look for errors in browser console (F12)

## Migrating from v1

To migrate data from the original script:

1. Export data from your Google Sheet
2. Use the import script (coming soon) or manually add applications via the UI
3. Update your API keys in the new Settings page

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Security Notes

- Never commit API keys or credentials
- Use environment variables for all secrets
- Enable HTTPS in production
- Regularly update dependencies
- Use strong passwords and secure JWT secrets

## License

MIT License - feel free to use and modify

## Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation
- Review API docs at http://localhost:8000/api/docs

## Roadmap

### Coming Soon
- [ ] Mobile app (React Native)
- [ ] Calendar integration
- [ ] Resume matching
- [ ] Interview preparation tools
- [ ] Job search aggregation
- [ ] Analytics dashboard
- [ ] Team features
- [ ] Slack/Discord notifications
- [ ] API webhooks
- [ ] Data export (PDF, CSV)

---

Built with ❤️ using FastAPI, React, and Claude AI
