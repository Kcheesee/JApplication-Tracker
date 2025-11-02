# 🔧 Render Deployment - Quick Fix Guide

You got the "No Dockerfile found" error. Here's how to fix it!

## The Issue

Render was looking for a Dockerfile in the root directory, but ours are in `backend/` and `frontend/` subdirectories.

## Solution: Manual Service Setup (Easier!)

Instead of using automatic detection, let's set up each service manually.

---

## Step-by-Step Fix

### 1. Delete the Failed Service (if you created one)

1. Go to your Render dashboard
2. Find the failed service
3. Click on it → Settings → Delete Service

### 2. Create PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `job-tracker-db`
   - **Database**: `jobtracker`
   - **Region**: Oregon (or closest to you)
   - **Plan**: **Free**
3. Click **"Create Database"**
4. **SAVE THIS**: Copy the **Internal Database URL** (you'll need it later)
   - It looks like: `postgres://user:pass@host/database`

---

### 3. Create Redis Instance

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `job-tracker-redis`
   - **Region**: Same as database
   - **Plan**: **Free**
3. Click **"Create Redis"**
4. **SAVE THIS**: Copy the **Internal Redis URL**
   - It looks like: `redis://red-xxxxx:6379`

---

### 4. Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"** → **"Next"**
3. Select your repository: `job-application-tracker`
4. **IMPORTANT**: Configure these settings:

   **Basic Settings:**
   - **Name**: `job-tracker-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend` ⚠️ **IMPORTANT!**
   - **Runtime**: `Python 3`
   - **Build Command**: Leave default or use:
     ```
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```
     alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: **Free**

5. **Scroll down** to "Advanced" and click it

6. **Add Environment Variables** (Click "+ Add Environment Variable"):

   ```bash
   # Database URL (paste from Step 2)
   DATABASE_URL=postgres://user:pass@dpg-xxxxx.oregon-postgres.render.com/jobtracker

   # Redis URL (paste from Step 3)
   REDIS_URL=redis://red-xxxxx:6379

   # Frontend URL (temporary - we'll update after frontend deploys)
   FRONTEND_URL=https://job-tracker-frontend.onrender.com

   # Generate secret key locally: openssl rand -hex 32
   SECRET_KEY=paste-your-generated-secret-key-here

   # Python version
   PYTHON_VERSION=3.11

   # Google OAuth (optional - for Gmail sync)
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

7. Click **"Create Web Service"**

8. Wait for deployment (5-10 minutes)

9. **SAVE THIS**: Once deployed, copy your backend URL
   - Example: `https://job-tracker-backend.onrender.com`

---

### 5. Deploy Frontend

1. Click **"New +"** → **"Web Service"**
2. **"Build and deploy from a Git repository"** → Select same repository
3. **IMPORTANT**: Configure these settings:

   **Basic Settings:**
   - **Name**: `job-tracker-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `frontend` ⚠️ **IMPORTANT!**
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     npm install && npm run build
     ```
   - **Start Command**:
     ```
     npm run preview -- --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: **Free**

4. **Add Environment Variable**:

   ```bash
   # Use backend URL from Step 4.9
   VITE_API_URL=https://job-tracker-backend.onrender.com
   ```

5. Click **"Create Web Service"**

6. Wait for deployment (5-10 minutes)

7. **SAVE THIS**: Copy your frontend URL
   - Example: `https://job-tracker-frontend.onrender.com`

---

### 6. Update Backend FRONTEND_URL

Now that you have the frontend URL:

1. Go back to your **backend service**
2. Click **"Environment"** in the left sidebar
3. Find the **FRONTEND_URL** variable
4. Click **Edit** and update it to your actual frontend URL:
   ```
   https://job-tracker-frontend.onrender.com
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy (takes ~2 minutes)

---

### 7. Test Your Deployment! 🎉

1. **Visit your frontend:**
   ```
   https://job-tracker-frontend.onrender.com
   ```

2. **Check backend API docs:**
   ```
   https://job-tracker-backend.onrender.com/docs
   ```

3. **Test the app:**
   - Click "Add Application"
   - Create a test job application
   - View the dashboard
   - Try exporting data

---

## ⚠️ Important Notes

### Root Directory is KEY!
The most common mistake is forgetting to set the **Root Directory**:
- Backend: `backend`
- Frontend: `frontend`

Without this, Render looks in the wrong folder and fails!

### First Request is Slow
On the free tier, services spin down after 15 minutes of inactivity.
- **First request** after sleeping takes 30-60 seconds
- This is normal for free tier
- Subsequent requests are fast

### Database Expires After 90 Days
The free PostgreSQL database expires after 90 days.
- You'll get email warnings before expiry
- Upgrade to $7/month to keep your data
- Or export data before expiry

---

## 🐛 Troubleshooting

### "Deploy failed" - Check Build Logs

1. Click on your service
2. Go to "Logs" tab
3. Look for the actual error

**Common issues:**
- ❌ Root Directory not set → Set to `backend` or `frontend`
- ❌ Wrong Python/Node version → Check your local versions
- ❌ Missing dependencies → Verify `requirements.txt` and `package.json`

### "Service not responding"

**If first request after sleep:**
- Wait 60 seconds and try again
- This is normal on free tier

**If still not working:**
1. Check service status (should be "Live" not "Failed")
2. Check logs for errors
3. Verify environment variables

### "CORS errors"

1. Make sure `FRONTEND_URL` in backend is correct
2. Should include `https://` and no trailing slash
3. Redeploy backend after changing

### "Database connection failed"

1. Use **Internal Database URL** (not External)
2. Format: `postgres://user:pass@host.oregon-postgres.render.com/dbname`
3. Check database is "Available" (not "Expired")

---

## 📝 Quick Reference

### Your Services Should Look Like:

| Service | Root Directory | Runtime | Start Command |
|---------|---------------|---------|---------------|
| **Backend** | `backend` | Python 3 | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Frontend** | `frontend` | Node | `npm run preview -- --host 0.0.0.0 --port $PORT` |
| **Database** | N/A | PostgreSQL | Auto-managed |
| **Redis** | N/A | Redis | Auto-managed |

### Environment Variables Checklist:

**Backend:**
- [x] DATABASE_URL
- [x] REDIS_URL
- [x] FRONTEND_URL
- [x] SECRET_KEY
- [x] PYTHON_VERSION
- [x] GOOGLE_CLIENT_ID (optional)
- [x] GOOGLE_CLIENT_SECRET (optional)

**Frontend:**
- [x] VITE_API_URL

---

## 🎯 Next Steps After Successful Deploy

1. **Update Google OAuth** (if using Gmail sync):
   - Go to Google Cloud Console → Credentials
   - Add redirect URI: `https://your-frontend.onrender.com/auth/callback`

2. **Update Browser Extension**:
   - Edit `browser-extension/popup.js`
   - Change `API_BASE` to your backend URL

3. **Share Your App**:
   - Send URL to friends
   - Add to your portfolio
   - Post on social media

4. **Monitor Usage**:
   - Check Render dashboard for metrics
   - Watch for the 90-day database expiry warning

---

## 💰 Cost Reminder

- **Free now**: $0
- **After 90 days**: $7/month to keep database
- **Always-on** (optional): +$7/month per service

Start free, upgrade when you have users!

---

## 🆘 Still Having Issues?

1. **Check the detailed guide**: [DEPLOY_TO_RENDER.md](DEPLOY_TO_RENDER.md:1)
2. **Render Docs**: [render.com/docs](https://render.com/docs)
3. **Create GitHub Issue**: If you think it's a bug in the app code

---

**The key things to remember:**
1. ✅ Set **Root Directory** for backend and frontend
2. ✅ Use **Internal URLs** for database and Redis
3. ✅ Wait 60 seconds for first request after sleep
4. ✅ Generate secure **SECRET_KEY**

**You've got this! Let's get your app deployed! 🚀**
