# 🚂 Quick Deploy to Railway (5 Minutes)

The **fastest** way to get your Job Application Tracker live and accessible to anyone!

## Why Railway?

- ✅ **Free $5/month credits** (enough to run for free)
- ✅ **Automatic HTTPS** (secure by default)
- ✅ **GitHub Integration** (auto-deploy on push)
- ✅ **Zero Configuration** (Railway handles everything)
- ✅ **5-minute setup** (seriously!)

---

## Step-by-Step Guide

### 1. Sign Up for Railway (1 minute)

1. Go to **[Railway.app](https://railway.app)**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (click "Login with GitHub")
4. Authorize Railway to access your repositories

> **Note**: Railway requires a credit card for verification (no charges on free tier)

---

### 2. Push Your Code to GitHub (2 minutes)

```bash
# Navigate to your project
cd "/Users/jackalmac/Desktop/Code World/Job Application Tracker"

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: Job Application Tracker v2.0"

# Create GitHub repo and push
# (Replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/job-application-tracker.git
git branch -M main
git push -u origin main
```

---

### 3. Deploy to Railway (2 minutes)

#### A. Create New Project

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `job-application-tracker` repository
4. Railway will start analyzing your project

#### B. Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Select **"Database"**
3. Click **"Add PostgreSQL"**
4. Railway automatically provisions the database

#### C. Add Redis

1. Click **"+ New"** again
2. Select **"Database"**
3. Click **"Add Redis"**
4. Railway auto-provisions Redis

#### D. Configure Backend Service

1. Click on the **backend** service (auto-detected)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add each of these:

```bash
# Database (auto-filled by Railway reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (auto-filled by Railway reference)
REDIS_URL=${{Redis.REDIS_URL}}

# Frontend URL (we'll update this after frontend is deployed)
FRONTEND_URL=https://your-app-will-be-here.railway.app

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Secret key (generate with: openssl rand -hex 32)
SECRET_KEY=your-secret-key-generate-random-32-chars

# Python version
PYTHON_VERSION=3.11
```

4. Go to **"Settings"** tab
5. Under **"Build"**:
   - Root Directory: `backend`
   - Build Command: (leave default)
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

6. Click **"Generate Domain"** under Settings
7. Copy the backend URL (e.g., `https://backend-production-xxxx.up.railway.app`)

#### E. Configure Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** → select your repo again
2. In **"Variables"** tab, add:

```bash
VITE_API_URL=https://your-backend-url-from-step-6.up.railway.app
```

3. Go to **"Settings"** tab
4. Under **"Build"**:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`

5. Click **"Generate Domain"**
6. Copy the frontend URL

#### F. Update Backend FRONTEND_URL

1. Go back to **backend** service
2. Edit the **FRONTEND_URL** variable
3. Paste your frontend URL from step E.5
4. Railway will automatically redeploy

---

### 4. Set Up Google OAuth (if using Gmail sync)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (or use existing)
3. Enable **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - Add: `https://your-frontend-url.railway.app/auth/callback`
7. Copy **Client ID** and **Client Secret**
8. Update Railway variables in backend service

---

### 5. Deploy! 🚀

Railway automatically deploys when you:
- Add/update environment variables
- Push to GitHub

**Your app is now live!** 🎉

Visit your frontend URL to see it in action!

---

## Testing Your Deployment

1. **Visit your frontend URL**
   ```
   https://your-app.railway.app
   ```

2. **Check if backend is running**
   ```
   https://your-backend.railway.app/docs
   ```
   You should see the FastAPI Swagger docs

3. **Test the features**
   - Click "Add Application"
   - Try Gmail Sync (if you set up OAuth)
   - Explore the Dashboard
   - Export data

---

## Costs

Railway provides **$5 in free credits per month**, which is typically enough for:
- Small personal use (< 100 users)
- Development/testing
- Portfolio projects

**What happens after free credits?**
- **Option 1**: Upgrade to paid plan ($5-20/month depending on usage)
- **Option 2**: Deploy to a free platform like Render
- **Option 3**: Self-host on a VPS ($6-12/month)

---

## Automatic Deployments

Every time you push to GitHub, Railway automatically:
1. Pulls latest code
2. Builds your app
3. Runs database migrations
4. Deploys new version
5. Zero downtime!

```bash
# Make a change
git add .
git commit -m "Add new feature"
git push

# Railway automatically deploys! 🚀
```

---

## Monitoring

Railway provides:
- **Logs**: View real-time logs for debugging
- **Metrics**: CPU, memory, network usage
- **Deployments**: See deployment history
- **Alerts**: Get notified of issues

Access in Railway dashboard → Select service → View logs/metrics

---

## Custom Domain (Optional)

Want to use your own domain (e.g., `myapp.com`)?

1. **Buy a domain** (Namecheap, Google Domains, etc.)
2. **In Railway**:
   - Go to frontend service → Settings
   - Custom Domains → Add Custom Domain
   - Enter your domain: `myapp.com`
3. **In your domain registrar**:
   - Add CNAME record: `www` → Railway provided domain
   - Add A record: `@` → Railway provided IP
4. **Wait 5-30 minutes** for DNS propagation
5. **Done!** Railway auto-configures HTTPS

---

## Troubleshooting

### "Build failed"
- Check build logs in Railway dashboard
- Verify your code works locally: `docker compose up`
- Check that all dependencies are in `requirements.txt` and `package.json`

### "Service won't start"
- Check runtime logs
- Verify environment variables are set correctly
- Make sure `DATABASE_URL` and `REDIS_URL` use Railway references

### "Can't connect to backend"
- Verify `VITE_API_URL` in frontend points to correct backend URL
- Check CORS settings in backend allow your frontend URL
- View backend logs for errors

### "Gmail sync not working"
- Verify Google OAuth credentials are correct
- Check redirect URI matches exactly (including https://)
- Ensure Gmail API is enabled in Google Cloud Console

---

## Next Steps

Once deployed:

1. **Share with friends** - Send them your URL!
2. **Add to portfolio** - Show employers your work
3. **Get feedback** - Post on Reddit, Twitter, LinkedIn
4. **Keep improving** - Add features, fix bugs
5. **Monitor usage** - Watch Railway metrics

---

## Alternative: One-Click Deploy Button

Want to make it even easier for others to deploy? Add this to your README:

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/job-application-tracker)
```

---

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: Get help from community
- **Project Issues**: Create GitHub issue if you find bugs

---

**Congrats! Your Job Application Tracker is now live and helping people find jobs! 🎉**

Total time: **~5-10 minutes**
Total cost: **$0** (with free credits)
