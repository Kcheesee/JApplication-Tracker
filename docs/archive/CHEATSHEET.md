# Job Application Tracker - Quick Reference Cheatsheet

## 🚀 Quick Start Commands

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build

# Access database
docker-compose exec postgres psql -U postgres -d jobtracker
```

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Web dashboard |
| Backend API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/api/docs | Interactive API documentation |
| Health Check | http://localhost:8000/health | API health status |

## 📁 Project Structure

```
Job Application Tracker/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── extension/        # Browser extension
├── docker-compose.yml
└── README_V2.md     # Full documentation
```

## 🔑 API Endpoints Cheatsheet

### Authentication
```bash
# Register
POST /api/auth/register
Body: { "email", "username", "password" }

# Login
POST /api/auth/login
Body: { "username", "password" }
Returns: { "access_token", "user" }

# Get current user
GET /api/auth/me
Header: Authorization: Bearer <token>
```

### Applications
```bash
# List all
GET /api/applications?status_filter=Applied&skip=0&limit=100

# Get one
GET /api/applications/{id}

# Create
POST /api/applications
Body: { "company", "position", ... }

# Update
PUT /api/applications/{id}
Body: { "status": "Interview Scheduled", ... }

# Delete
DELETE /api/applications/{id}

# Get stats
GET /api/applications/stats/summary
```

### Sync
```bash
# Sync from Gmail
POST /api/sync/gmail

# Parse job posting
POST /api/sync/parse-job
Body: { "job_text", "job_url" }
```

### Settings
```bash
# Get settings
GET /api/settings

# Update settings
PUT /api/settings
Body: { "anthropic_api_key", "gmail_enabled", ... }
```

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/jobtracker
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<generate-secure-key>
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## 🗄️ Database Quick Reference

### Tables
- `users` - User accounts
- `applications` - Job applications
- `user_settings` - User preferences

### Common Queries
```sql
-- List all users
SELECT id, username, email FROM users;

-- Count applications by status
SELECT status, COUNT(*) FROM applications GROUP BY status;

-- Recent applications
SELECT company, position, created_at FROM applications
ORDER BY created_at DESC LIMIT 10;
```

## 📦 Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 🔧 Development Commands

### Backend
```bash
cd backend
uvicorn app.main:app --reload  # Dev server
pytest                          # Run tests
alembic upgrade head            # Run migrations
```

### Frontend
```bash
cd frontend
npm run dev      # Dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Frontend can't connect
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS settings in backend/app/main.py
# Check VITE_API_URL in frontend/.env
```

### Database issues
```bash
# Reset database completely
docker-compose down -v
docker-compose up -d postgres
docker-compose up -d backend
```

### Port conflicts
```bash
# Check what's using ports
lsof -i :3000  # Frontend
lsof -i :8000  # Backend
lsof -i :5432  # PostgreSQL

# Kill process
kill -9 <PID>
```

## 🎨 Common UI Patterns

### Status Colors
- **Applied** → Blue
- **Interview Scheduled** → Green
- **Rejected** → Red
- **Offer Received** → Purple
- **Follow-up Needed** → Yellow
- **Other** → Gray

### Status Options
```typescript
const statuses = [
  "Applied",
  "Interview Scheduled",
  "Rejected",
  "Offer Received",
  "Follow-up Needed",
  "Other"
]
```

### Work Modes
```typescript
const workModes = ["Remote", "Hybrid", "Onsite"]
```

### Application Sources
```typescript
const sources = [
  "LinkedIn",
  "Indeed",
  "Company Website",
  "Referral",
  "Recruiter",
  "Other"
]
```

## 🔌 Browser Extension

### Installation
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/` folder

### Usage
1. Navigate to job posting
2. Click extension icon
3. Click "Capture Job from Page"
4. Review and save

## 🔐 Security Best Practices

### Do's
✅ Use environment variables for secrets
✅ Use strong passwords (12+ characters)
✅ Enable HTTPS in production
✅ Regularly update dependencies
✅ Keep API keys private
✅ Use JWT tokens (included)
✅ Hash passwords (bcrypt included)

### Don'ts
❌ Commit `.env` files
❌ Commit `credentials.json`
❌ Share API keys publicly
❌ Use weak passwords
❌ Disable CORS in production
❌ Store passwords in plain text

## 📊 Monitoring

### Health Checks
```bash
# API health
curl http://localhost:8000/health

# Database connection
docker-compose exec postgres pg_isready

# Redis connection
docker-compose exec redis redis-cli ping
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🚀 Deployment Checklist

- [ ] Generate secure `SECRET_KEY`
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure production database URL
- [ ] Enable HTTPS/SSL
- [ ] Set up domain name
- [ ] Configure CORS for production domain
- [ ] Set up automated backups
- [ ] Configure monitoring/alerts
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Test all features in production
- [ ] Set up CI/CD (optional)

## 📝 Common Tasks

### Add a new field to applications
1. Update `backend/app/models/application.py`
2. Create migration: `alembic revision --autogenerate -m "add field"`
3. Run migration: `alembic upgrade head`
4. Update `backend/app/schemas/application.py`
5. Update `frontend/src/components/ApplicationModal.tsx`

### Change JWT expiration
Edit `backend/.env`:
```env
ACCESS_TOKEN_EXPIRE_MINUTES=30  # Change to desired minutes
```

### Add new Gmail keywords
1. Go to Settings page
2. Add keywords in the settings form
3. Save

Or via API:
```bash
curl -X PUT http://localhost:8000/api/settings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"gmail_keywords": ["application", "interview", ...]}'
```

## 🎯 Testing Endpoints with cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser&password=Test1234!"

# Create application (use token from login)
curl -X POST http://localhost:8000/api/applications \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"company":"TechCorp","position":"Software Engineer","status":"Applied"}'
```

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| Anthropic Console | https://console.anthropic.com |
| Google Cloud Console | https://console.cloud.google.com |
| PostgreSQL Docs | https://www.postgresql.org/docs/ |
| FastAPI Docs | https://fastapi.tiangolo.com |
| React Docs | https://react.dev |
| Tailwind CSS | https://tailwindcss.com |
| Docker Hub | https://hub.docker.com |

## 💡 Pro Tips

1. **Use the browser extension** for fastest job capture
2. **Sync Gmail daily** to catch new application emails
3. **Add notes immediately** after interviews
4. **Use filters** in Applications page for better organization
5. **Check dashboard stats** to track your progress
6. **Update status regularly** to keep data current
7. **Add salary ranges** for better tracking
8. **Use consistent naming** for companies (e.g., "Google" not "Google Inc.")

## 🆘 Get Help

- **Documentation**: See `README_V2.md`
- **API Reference**: http://localhost:8000/api/docs
- **Quick Start**: See `QUICKSTART.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Issues**: Check logs with `docker-compose logs -f`

---

**Quick Command Reference**
```bash
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f backend    # View backend logs
docker-compose restart backend    # Restart backend
docker-compose exec postgres psql # Database shell
```

**Emergency Reset**
```bash
docker-compose down -v  # Delete all data
docker-compose up -d    # Fresh start
```

---

💙 Built with FastAPI + React + Claude AI
