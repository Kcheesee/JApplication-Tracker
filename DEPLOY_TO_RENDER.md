# 🚀 Deploy to Render - Complete Guide

Deploy your Job Application Tracker to Render in **~15 minutes** for **FREE**!

## Why Render?

- ✅ **100% Free** - Free tier forever (with auto spin-down after inactivity)
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Easy Setup** - Simple dashboard, no CLI needed
- ✅ **Auto-Deploy** - Deploys on every git push
- ✅ **Great Documentation** - Excellent support
- ✅ **PostgreSQL Included** - Free database

---

## Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Render Account** - Free signup at [render.com](https://render.com)
3. **Google OAuth Credentials** - (Optional, for Gmail sync)

---

## Step-by-Step Deployment

### Step 1: Push Your Code to GitHub (5 minutes)

```bash
# Navigate to your project
cd "/Users/jackalmac/Desktop/Code World/Job Application Tracker"

# Initialize git if not already done
git init

# Create .gitignore to exclude sensitive files
cat > .gitignore << 'EOF'
.env
.env.local
credentials.json
token.pickle
node_modules/
__pycache__/
*.pyc
.DS_Store
pgdata/
postgres-data/
EOF

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Job Application Tracker v2.0

Complete job tracking system with:
- Dashboard analytics with 10+ features
- Gmail sync and browser extension
- Calendar integration and email templates
- Network management and salary comparison
- Interview prep tools and data export"

# Create repository on GitHub (do this in browser first)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/job-application-tracker.git
git branch -M main
git push -u origin main
```

**Create GitHub Repository:**
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `job-application-tracker`
3. Make it **Public** (required for Render free tier)
4. **Don't** initialize with README (we have one)
5. Click "Create repository"
6. Run the git commands above

---

### Step 2: Sign Up for Render (2 minutes)

1. Go to **[render.com](https://render.com)**
2. Click **"Get Started"**
3. Sign up with **GitHub** (recommended) or email
4. Authorize Render to access your GitHub repositories
5. You'll land on the Render Dashboard

---

### Step 3: Create PostgreSQL Database (3 minutes)

1. In Render Dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Configure database:
   - **Name**: `job-tracker-db`
   - **Database**: `jobtracker`
   - **User**: `jobtracker_user` (or leave default)
   - **Region**: Choose closest to you (e.g., Oregon for US West)
   - **PostgreSQL Version**: 15
   - **Plan**: **Free** (select this!)
4. Click **"Create Database"**
5. Wait 2-3 minutes for database to provision

**Save these values** (you'll need them later):
- **Internal Database URL** - Copy this! (starts with `postgres://`)
- **External Database URL** - Also copy (for local testing)

The Internal URL looks like:
```
postgres://jobtracker_user:***@dpg-xxxx-a.oregon-postgres.render.com/jobtracker_db
```

---

### Step 4: Create Redis Instance (2 minutes)

1. Click **"New +"** again
2. Select **"Redis"**
3. Configure:
   - **Name**: `job-tracker-redis`
   - **Region**: Same as database
   - **Plan**: **Free**
4. Click **"Create Redis"**
5. Wait for provisioning

**Save**:
- **Internal Redis URL** - Copy this! (starts with `redis://`)

---

### Step 5: Deploy Backend (5 minutes)

1. Click **"New +"**
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Click **"Connect account"** if not connected, or select your repository:
   - Repository: `job-application-tracker`
   - Click **"Connect"**

5. **Configure the service:**
   - **Name**: `job-tracker-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**

6. Click **"Advanced"** to add environment variables

7. **Add Environment Variables** (click "+ Add Environment Variable" for each):

```bash
# Database - Use Internal Database URL from Step 3
DATABASE_URL=postgres://jobtracker_user:***@dpg-xxxx-a.oregon-postgres.render.com/jobtracker_db

# Redis - Use Internal Redis URL from Step 4
REDIS_URL=redis://red-xxxx:6379

# Frontend URL - We'll update this after deploying frontend
FRONTEND_URL=https://job-tracker-frontend.onrender.com

# Secret Key - Generate with: openssl rand -hex 32
SECRET_KEY=paste-your-generated-secret-here

# Python Version
PYTHON_VERSION=3.11

# Google OAuth (if using Gmail sync - get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Generate SECRET_KEY:**
```bash
# Run this locally to generate a secure key
openssl rand -hex 32
```

8. Click **"Create Web Service"**

Render will now:
- Clone your repository
- Install dependencies
- Run database migrations
- Start your backend
- This takes ~5-10 minutes

**Your backend will be available at:**
```
https://job-tracker-backend.onrender.com
```

**Verify it's working:**
- Visit: `https://job-tracker-backend.onrender.com/docs`
- You should see the FastAPI Swagger documentation

---

### Step 6: Deploy Frontend (5 minutes)

1. Click **"New +"**
2. Select **"Web Service"**
3. Connect the **same repository** (`job-application-tracker`)

4. **Configure:**
   - **Name**: `job-tracker-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run preview -- --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: **Free**

5. **Add Environment Variable:**

```bash
# Use your backend URL from Step 5
VITE_API_URL=https://job-tracker-backend.onrender.com
```

6. Click **"Create Web Service"**

Build takes ~5-10 minutes.

**Your frontend will be available at:**
```
https://job-tracker-frontend.onrender.com
```

---

### Step 7: Update Backend FRONTEND_URL (1 minute)

Now that we have the frontend URL, update the backend:

1. Go to your **backend service** in Render dashboard
2. Click **"Environment"** tab
3. Find **FRONTEND_URL** variable
4. Update it to: `https://job-tracker-frontend.onrender.com`
5. Click **"Save Changes"**
6. Render will automatically redeploy (takes ~2 minutes)

---

### Step 8: Set Up Google OAuth (Optional - 5 minutes)

If you want Gmail sync to work:

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**

2. **Create a project** (or use existing):
   - Click "Select a project" → "New Project"
   - Name: "Job Tracker"
   - Click "Create"

3. **Enable Gmail API**:
   - In search bar, type "Gmail API"
   - Click "Gmail API"
   - Click "Enable"

4. **Create OAuth Credentials**:
   - Go to "Credentials" (left sidebar)
   - Click "+ Create Credentials"
   - Select "OAuth client ID"
   - Configure consent screen (if prompted):
     - User Type: External
     - App name: "Job Application Tracker"
     - User support email: your email
     - Developer contact: your email
     - Click "Save and Continue"
     - Scopes: Click "Save and Continue"
     - Test users: Add your email, "Save and Continue"

5. **Create OAuth Client**:
   - Application type: "Web application"
   - Name: "Job Tracker"
   - Authorized redirect URIs → Click "+ Add URI":
     ```
     https://job-tracker-frontend.onrender.com/auth/callback
     ```
   - Click "Create"

6. **Copy Credentials**:
   - Copy the **Client ID**
   - Copy the **Client Secret**

7. **Update Render Backend Environment Variables**:
   - Go to backend service → Environment
   - Update `GOOGLE_CLIENT_ID` with your Client ID
   - Update `GOOGLE_CLIENT_SECRET` with your Client Secret
   - Save changes (auto-redeploys)

---

### Step 9: Test Your Deployment! 🎉

1. **Visit your frontend:**
   ```
   https://job-tracker-frontend.onrender.com
   ```

2. **Test features:**
   - ✅ Dashboard loads
   - ✅ Click "Add Application" - form appears
   - ✅ Create a test application
   - ✅ View dashboard analytics
   - ✅ Export to CSV
   - ✅ Try Gmail sync (if configured)

3. **Check API Documentation:**
   ```
   https://job-tracker-backend.onrender.com/docs
   ```

---

## 🎯 Your URLs

Save these for reference:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://job-tracker-frontend.onrender.com | Main app |
| **Backend** | https://job-tracker-backend.onrender.com | API |
| **API Docs** | https://job-tracker-backend.onrender.com/docs | Swagger UI |
| **Database** | (internal only) | PostgreSQL |
| **Redis** | (internal only) | Cache |

---

## 📱 Update Browser Extension

To make the browser extension work with your production deployment:

1. Edit `browser-extension/popup.js`
2. Change line 1:
   ```javascript
   const API_BASE = 'https://job-tracker-backend.onrender.com';
   ```
3. Reload extension in Chrome:
   - Go to `chrome://extensions/`
   - Click reload icon on your extension

---

## 🔄 Automatic Deployments

Every time you push to GitHub, Render automatically:
1. Detects the change
2. Pulls latest code
3. Rebuilds the service
4. Deploys with zero downtime

```bash
# Make a change
git add .
git commit -m "Add new feature"
git push

# Render automatically deploys in ~5 minutes! 🚀
```

---

## 💡 Understanding the Free Tier

### What's Included FREE:
- ✅ PostgreSQL database (90 days, then expires unless upgraded)
- ✅ Redis instance (90 days, then expires unless upgraded)
- ✅ Web services (spin down after 15 min of inactivity)
- ✅ 750 hours/month (unlimited services that fit in hours)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Auto-deploy

### Limitations:
- ⏱️ **Spin down**: Free services sleep after 15 minutes of no traffic
- ⏱️ **Spin up**: Takes 30-60 seconds to wake up on first request
- 💾 **Database**: Free for 90 days, then $7/month to keep data
- 🔄 **Build time**: Slower builds on free tier

### Upgrade Options:
If you need always-on service:
- **Starter Plan**: $7/month per service
- **Database**: $7/month to keep past 90 days
- **Always On**: No spin-down, faster responses

---

## 🐛 Troubleshooting

### "Deploy failed"

**Check build logs:**
1. Click on your service
2. Go to "Logs" tab
3. Look for error messages

**Common issues:**
- Missing dependencies in `requirements.txt` or `package.json`
- Syntax errors in code
- Port configuration (use `$PORT` not hardcoded 8000/3000)

**Fix:**
```bash
# Test locally first
docker compose up

# If works locally, check Render logs for specific error
```

### "Service not responding"

**First request after sleep takes 30-60 seconds** - this is normal on free tier!

If still not working:
1. Check service status (should be "Live")
2. Check logs for errors
3. Verify environment variables are set correctly

### "Database connection failed"

1. Verify `DATABASE_URL` in backend environment variables
2. Make sure it's the **Internal Database URL** (not External)
3. Check database is running (should show "Available")

### "CORS errors in browser console"

1. Make sure `FRONTEND_URL` in backend env vars is correct
2. Should include `https://` and no trailing slash
3. Redeploy backend after updating

### "Gmail sync not working"

1. Check Google OAuth credentials are correct
2. Verify redirect URI in Google Console matches exactly:
   ```
   https://job-tracker-frontend.onrender.com/auth/callback
   ```
3. Ensure Gmail API is enabled in Google Cloud
4. Check backend logs for OAuth errors

---

## 📊 Monitoring

### View Logs:
1. Go to service in Render dashboard
2. Click "Logs" tab
3. See real-time logs

### View Metrics:
1. Click "Metrics" tab
2. See CPU, Memory, Bandwidth usage

### Set Up Alerts:
1. Go to service settings
2. Notifications → Add notification
3. Get emailed on deploy failures

---

## 🔒 Security Checklist

After deployment, verify:

- [x] All environment variables set correctly
- [x] `SECRET_KEY` is random and secure (32+ characters)
- [x] Database password is secure (auto-generated by Render)
- [x] HTTPS is working (automatic on Render)
- [x] `.env` files are NOT in git (`git log --all -- .env`)
- [x] OAuth redirect URIs match exactly

---

## 🚀 Next Steps

### Share Your App:
- Add URL to your resume/portfolio
- Share on LinkedIn, Twitter
- Submit to Product Hunt
- Post on Reddit (r/webdev, r/SideProject)

### Custom Domain (Optional):
1. Buy domain (Namecheap, Google Domains)
2. In Render service → Settings → Custom Domain
3. Add your domain
4. Update DNS records (Render provides instructions)
5. SSL automatically configured!

### Upgrade to Paid (When Ready):
When you're ready for always-on service:
1. Go to service → Settings
2. Change plan to "Starter" ($7/month)
3. No spin-down, faster performance

---

## 💰 Cost Summary

**Free Tier:**
- Web Services: FREE (with spin-down)
- PostgreSQL: FREE for 90 days
- Redis: FREE for 90 days
- Total: **$0/month** ✨

**After 90 Days:**
- Keep database: +$7/month
- Always-on backend: +$7/month
- Always-on frontend: +$7/month
- Total: **$21/month** for production-ready

**Recommendation:**
- Start FREE, validate with users
- Upgrade database first ($7/month)
- Upgrade services if spin-down is annoying

---

## 📞 Support

**Render Documentation:**
- Docs: [render.com/docs](https://render.com/docs)
- Status: [status.render.com](https://status.render.com)

**Community:**
- Render Discord: Get help from community
- GitHub Issues: Report bugs in your repo

**Email Support:**
- help@render.com (usually responds in 24 hours)

---

## 🎉 Congratulations!

Your Job Application Tracker is now **LIVE** and accessible to anyone in the world!

**Your app is at:**
```
https://job-tracker-frontend.onrender.com
```

**What you've accomplished:**
- ✅ Full-stack app deployed to production
- ✅ Automatic HTTPS encryption
- ✅ PostgreSQL database in the cloud
- ✅ Auto-deploy on git push
- ✅ Professional DevOps setup
- ✅ Real-world portfolio piece

**Now go help people find jobs! 🎯**

---

## 📝 Quick Reference

```bash
# Update your app
git add .
git commit -m "Update feature"
git push  # Auto-deploys to Render!

# View logs
# Go to Render dashboard → Service → Logs

# Check status
# Visit: https://job-tracker-backend.onrender.com/health
# Visit: https://job-tracker-frontend.onrender.com

# Force redeploy
# Render dashboard → Service → Manual Deploy → Deploy latest commit
```

---

**Need help? Check [DEPLOYMENT.md](DEPLOYMENT.md:1) for other deployment options or create a GitHub issue!**
