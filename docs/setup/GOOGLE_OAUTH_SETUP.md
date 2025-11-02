# Google OAuth Setup Guide

## Getting Google OAuth Credentials

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "Job Application Tracker" (or any name you prefer)
4. Click "Create"

### Step 2: Enable Gmail API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on it and click "Enable"

### Step 3: Create OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have a Google Workspace)
3. Click "Create"
4. Fill in:
   - **App name**: Job Application Tracker
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
8. Click "Save and Continue"
9. Add your email as a test user
10. Click "Save and Continue"

### Step 4: Create OAuth Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Name it "Job Tracker Web Client"
5. Under "Authorized redirect URIs", add:
   ```
   http://localhost:8000/api/oauth/google/callback
   ```
6. Click "Create"
7. **Copy your Client ID and Client Secret** - you'll need these!

### Step 5: Configure Your Application

#### Option A: Using Environment Variables (Recommended for Local Development)

Create a `.env` file in the project root:

```bash
# In: /Users/jackalmac/Desktop/Code World/Job Application Tracker/.env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

Then restart the containers:
```bash
docker compose down
docker compose up -d
```

#### Option B: Using Docker Compose Directly

Edit `docker-compose.yml` and replace the empty values:

```yaml
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-your-actual-client-id-here}
GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-your-actual-secret-here}
```

Then restart:
```bash
docker compose restart backend
```

## Testing the Setup

1. Go to http://localhost:3000/settings
2. Scroll to "Google Account (Gmail Sync)"
3. Click "Connect Google Account"
4. You should be redirected to Google login
5. After authorizing, you'll be redirected back
6. You should see "✓ Connected" indicator

## Troubleshooting

### "OAuth not configured" error
- Make sure you set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Restart the backend container after setting them

### "Redirect URI mismatch" error
- Make sure you added `http://localhost:8000/api/oauth/google/callback` to your OAuth client
- The URL must match exactly (including http://)

### "Access denied" error
- Make sure you added yourself as a test user in the OAuth consent screen
- Make sure Gmail API is enabled

## Production Deployment

For production, you'll need to:

1. Verify your OAuth consent screen with Google
2. Use HTTPS for your redirect URIs
3. Store credentials in secure environment variables
4. Update redirect URI to your production domain

## Need Help?

Check the Google Cloud Console for detailed error messages in:
- APIs & Services → OAuth consent screen
- APIs & Services → Credentials
