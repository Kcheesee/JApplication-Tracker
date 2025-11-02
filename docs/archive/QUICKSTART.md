# Quick Start Guide - Job Application Tracker v2.0

Get up and running in 5 minutes!

## Step 1: Prerequisites

Make sure you have:
- [ ] Docker Desktop installed (https://www.docker.com/products/docker-desktop/)
- [ ] An Anthropic API key (https://console.anthropic.com)

## Step 2: Setup Environment

```bash
# Navigate to project directory
cd "Job Application Tracker"

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Generate a secure secret key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Edit backend/.env and paste the generated key
# Change SECRET_KEY=your-secret-key-change-in-production to your generated key
```

## Step 3: Start the Application

```bash
# Start all services with Docker Compose
docker-compose up -d

# Wait about 30 seconds for services to initialize

# Check if services are running
docker-compose ps
```

You should see:
- job-tracker-db (PostgreSQL)
- job-tracker-redis (Redis)
- job-tracker-backend (FastAPI)
- job-tracker-frontend (React)

## Step 4: Create Your Account

1. Open browser: http://localhost:3000
2. Click **"Sign up"**
3. Enter your email, username, and password
4. Click **"Sign up"** button
5. You'll be automatically logged in

## Step 5: Configure API Keys

1. Click **"Settings"** in the navigation bar
2. Paste your **Anthropic API Key** (from https://console.anthropic.com)
3. Click **"Save Settings"**

## Step 6: Add Your First Application

### Option A: Manual Entry
1. Click **"Applications"** in the navigation
2. Click **"Add Application"** button
3. Fill in company name and position (required)
4. Add optional details (salary, location, etc.)
5. Click **"Save"**

### Option B: Browser Extension (Recommended!)
1. Open Chrome/Edge: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from project directory
5. Navigate to a job posting (LinkedIn, Indeed, etc.)
6. Click the extension icon
7. Click "Capture Job from Page"
8. Review and save!

### Option C: Gmail Sync
1. Go to **Dashboard**
2. Click **"Sync Gmail"** button
3. Wait for sync to complete
4. View newly added applications!

## Common Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

## Verify Installation

### Backend API
- Open: http://localhost:8000/api/docs
- Should see interactive API documentation

### Frontend Dashboard
- Open: http://localhost:3000
- Should see login page

### Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d jobtracker

# List tables
\dt

# Exit
\q
```

## Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker --version

# Check for port conflicts
lsof -i :8000
lsof -i :3000
lsof -i :5432

# View detailed logs
docker-compose logs
```

### Frontend can't connect to backend
1. Verify backend is running: http://localhost:8000/health
2. Check `frontend/.env` has `VITE_API_URL=http://localhost:8000`
3. Restart frontend: `docker-compose restart frontend`

### Database connection error
```bash
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Gmail sync not working
1. Verify Anthropic API key in Settings
2. Check backend logs: `docker-compose logs backend`
3. Ensure Gmail API credentials are configured

## Next Steps

1. **Customize Settings**: Adjust sync frequency, keywords, notifications
2. **Install Extension**: Load the browser extension for easy tracking
3. **Explore Dashboard**: View stats and recent applications
4. **Sync Gmail**: Import existing applications from your email
5. **Start Tracking**: Add applications as you apply!

## Getting Help

- **Documentation**: See README_V2.md for full documentation
- **API Docs**: http://localhost:8000/api/docs
- **Logs**: `docker-compose logs -f`

## Production Deployment

Ready to deploy? See README_V2.md section "Deployment" for:
- Cloud hosting options (AWS, DigitalOcean, Railway, Heroku)
- HTTPS/SSL setup
- Production environment configuration
- Backup strategies

---

**That's it! You're ready to track your job applications like a pro!** 🎉
