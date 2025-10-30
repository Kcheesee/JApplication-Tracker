# 🚀 Job Application Tracker

> A powerful, feature-rich job application tracker to organize your job search and land your dream job faster.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)

Track every application, never miss a follow-up, and get hired faster with analytics, automation, and smart organization.

## ✨ Features

### 📊 **Powerful Dashboard Analytics**
- **6 Customizable Stat Cards**: Track total applications, interviews, offers, response rate, pending, and rejections
- **Visual Charts**: Status breakdown, application timeline (30 days), recent activity feed
- **Customizable Widgets**: Hide widgets you don't want to see (e.g., hide rejections for positivity!)
- **Real-Time Insights**: See your job search progress at a glance

### 🎯 **Goal Tracking & Motivation**
- Set weekly and monthly application goals
- Track your application streak (consecutive days)
- Color-coded progress bars show how you're doing
- Stay motivated with visual progress tracking

### 💰 **Salary Intelligence**
- Compare salary offers across companies
- See average, highest, and lowest offers
- Visual bar charts sorted by compensation
- Make informed decisions about offers

### 📧 **Email Templates & Communication**
- 5 pre-written professional templates (follow-up, thank you, etc.)
- Smart variable replacement: {company}, {position}, {recruiter_name}
- Create unlimited custom templates
- One-click copy to clipboard

### 📅 **Calendar Integration**
- Add interviews to Google Calendar with one click
- Export to Outlook/Apple Calendar (.ics file)
- Auto-populated with company, role, recruiter details
- Never miss an interview again

### 🤝 **Network Management**
- Track referrals and LinkedIn connections
- Store contact details: name, role, email, phone, LinkedIn
- Link connections to specific job applications
- Build and leverage your network

### 🔍 **Auto-Extract Job Details**
Three ways to add jobs quickly:

1. **Gmail Sync**: Auto-import applications from your inbox
2. **Bookmarklet**: One-click extract from any job posting
3. **Browser Extension**: Chrome/Edge extension for instant capture

Supports: LinkedIn, Indeed, Glassdoor, ZipRecruiter, Lever, Greenhouse, and more!

### 📝 **Interview Preparation**
- Store interview questions and answers
- Take notes during/after interviews
- Research and save company information
- Dedicated "Interview Prep" tab for each application

### 💾 **Data Export**
- **CSV Export**: Open in Excel or Google Sheets (23+ fields)
- **JSON Export**: Complete backup for re-importing
- **PDF Reports**: Printable application summaries

### 🎨 **Modern UI/UX**
- Beautiful, responsive design (desktop & mobile)
- Built with shadcn/ui and Tailwind CSS
- Smooth animations with Framer Motion
- Dark mode support (coming soon)

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- 4GB of available RAM
- Ports 3000, 8000, and 5432 available

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/job-application-tracker.git
   cd job-application-tracker
   ```

2. **Start the application**
   ```bash
   docker compose up -d
   ```

3. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

That's it! The application is now running. 🎉

### First-Time Setup

1. Navigate to http://localhost:3000
2. Click "Add Application" to create your first entry
3. Or click "Sync Gmail" to import existing applications
4. Explore the Dashboard to see your analytics

## 📱 Browser Extension Setup

Install the Chrome/Edge extension for one-click job capturing:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. Pin the extension to your toolbar

Now when you're on LinkedIn, Indeed, or any job board, just click the extension icon to instantly capture the job details!

## 📖 Usage Guide

### Adding Applications

**Method 1: Manual Entry**
- Click "Add" button in Applications page
- Fill in company, position, and other details
- Optionally use the job scraper to paste a URL

**Method 2: Gmail Sync**
- Click "Sync Gmail" button
- Authenticate with Google
- Your applications are automatically imported

**Method 3: Browser Extension**
- Navigate to any job posting
- Click the extension icon
- Review and save

### Tracking Progress

**Dashboard**: View your job search metrics
- Total applications, interviews, offers
- Response rate and pending applications
- 30-day application timeline
- Recent activity feed

**Goal Tracking**: Set targets and track streaks
- Set weekly/monthly goals
- See your streak counter
- Progress bars show completion

**Salary Comparison**: Analyze offers
- Visual comparison of all offers
- See which companies pay best
- Make data-driven decisions

### Interview Preparation

For each application, you can:
- Store common interview questions
- Take notes during/after interviews
- Research the company (culture, products, news)
- Access everything in the "Interview Prep" tab

### Managing Contacts

**Network Tracker**: Keep track of:
- Referrals who helped you
- LinkedIn connections
- Recruiter contacts
- Notes about each connection

## 🛠️ Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui components
- Framer Motion animations
- Vite for blazing-fast builds

**Backend:**
- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- Pydantic validation
- Alembic migrations

**Infrastructure:**
- Docker & Docker Compose
- Nginx (production)
- Hot reload in development

## 📂 Project Structure

```
job-application-tracker/
├── frontend/              # React TypeScript app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard, Applications, Settings
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Helper functions
│   └── public/
├── backend/               # FastAPI Python app
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic
│   └── alembic/           # Database migrations
├── browser-extension/     # Chrome/Edge extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── content.js
└── docker-compose.yml     # Docker orchestration
```

## 🔧 Development

### Running Locally

```bash
# Start in development mode with hot reload
docker compose up

# View logs
docker compose logs -f frontend
docker compose logs -f backend

# Rebuild containers
docker compose up --build

# Stop all services
docker compose down
```

### Database Migrations

```bash
# Create a new migration
docker exec job-tracker-backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker exec job-tracker-backend alembic upgrade head

# Rollback migration
docker exec job-tracker-backend alembic downgrade -1
```

### Running Tests

```bash
# Frontend tests
docker exec job-tracker-frontend npm test

# Backend tests
docker exec job-tracker-backend pytest

# Run with coverage
docker exec job-tracker-backend pytest --cov
```

## 🌟 Key Features Deep Dive

### Gmail Sync

The Gmail sync feature uses OAuth 2.0 to securely access your inbox and scan for job application emails. It looks for:
- Application confirmations
- "Thank you for applying" emails
- Recruiter responses
- Interview invitations

All emails are processed locally and never stored on external servers.

### Job Scraper & Bookmarklet

The scraper supports 15+ job boards and uses smart pattern matching to extract:
- Company name
- Job title/position
- Location
- Salary range (if listed)
- Job description
- Application source

The bookmarklet works on any website and opens a new tab with pre-filled data.

### Browser Extension

The Chrome/Edge extension includes:
- Content scripts that detect job posting pages
- Auto-extraction of job details
- Clean popup UI for review
- Direct save to your tracker
- Works on 10+ major job boards

## 🔐 Privacy & Security

- **Local-First**: All data stored in your PostgreSQL database
- **No Cloud Storage**: We don't store your data on external servers
- **OAuth 2.0**: Secure Google authentication for Gmail sync
- **Environment Variables**: Sensitive credentials in .env files
- **No Tracking**: We don't track your usage or collect analytics

## 🐛 Troubleshooting

### Container won't start
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Remove old containers and restart
docker compose down -v
docker compose up -d
```

### Database connection issues
```bash
# Reset database
docker compose down -v
docker compose up -d
```

### Gmail sync not working
- Ensure you've set up Google OAuth credentials
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Verify redirect URI matches: `http://localhost:3000/auth/callback`

### Browser extension not loading
- Make sure Developer mode is enabled
- Check for console errors (F12)
- Verify the tracker is running on localhost:8000
- Try reloading the extension

## 📝 Roadmap

### V3.0 (Planned)
- [ ] AI-powered resume optimization
- [ ] Mobile app (React Native)
- [ ] Advanced analytics & insights
- [ ] Interview scheduler with Zoom/Meet
- [ ] ATS keyword scanner
- [ ] Team collaboration features
- [ ] Dark mode
- [ ] Multi-language support

### Community Requested
- [ ] Notion integration
- [ ] Slack/Discord notifications
- [ ] API key for third-party integrations
- [ ] Chrome Web Store publication
- [ ] Self-hosted deployment guides

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lucide](https://lucide.dev/) for the icon set
- [FastAPI](https://fastapi.tiangolo.com/) for the amazing Python framework
- [Docker](https://www.docker.com/) for making deployment easy

## 💬 Support

- **Documentation**: Check our [Wiki](https://github.com/yourusername/job-application-tracker/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/job-application-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/job-application-tracker/discussions)

## ⭐ Star History

If this project helped you land a job, please consider giving it a star! ⭐

---

**Built with ❤️ by job seekers, for job seekers.**

Happy job hunting! 🎯
