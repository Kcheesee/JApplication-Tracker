# Daily Auto-Sync Setup Instructions

The Job Application Tracker now supports automatic daily Gmail syncing for users who opt-in. This requires setting up a cron job to call the sync endpoint once per day.

## How It Works

1. Users enable "Daily Auto-Sync" in their Settings page
2. An external cron service calls the `/api/cron/daily-gmail-sync` endpoint once per day
3. The endpoint syncs Gmail for all users who have auto-sync enabled
4. Users get their job applications updated automatically

## Setup Options

### Option 1: Render Cron Jobs (Recommended for Render deployment)

1. Go to your Render Dashboard
2. Click "New" → "Cron Job"
3. Configure:
   - **Name**: `job-tracker-daily-sync`
   - **Command**: `curl -X POST -H "X-Cron-Secret: YOUR_SECRET_HERE" https://japplication-tracker-backend.onrender.com/api/cron/daily-gmail-sync`
   - **Schedule**: `0 2 * * *` (runs at 2 AM UTC daily)
   - **Region**: Same as your backend service
4. Click "Create Cron Job"

### Option 2: External Cron Service (Free options)

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Sign up for the service
2. Create a new cron job:
   - **URL**: `https://japplication-tracker-backend.onrender.com/api/cron/daily-gmail-sync`
   - **Method**: POST
   - **Headers**: `X-Cron-Secret: YOUR_SECRET_HERE`
   - **Schedule**: Once per day (e.g., 2 AM)

### Option 3: Your Own Server

If you have a server with crontab:

```bash
# Add to crontab (crontab -e)
0 2 * * * curl -X POST -H "X-Cron-Secret: YOUR_SECRET_HERE" https://japplication-tracker-backend.onrender.com/api/cron/daily-gmail-sync
```

## Environment Variables

Add this environment variable to your Render **backend** service:

```
CRON_SECRET=<generate-a-random-secret-string>
```

**Generate a secret:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Testing

Test the cron endpoint manually:

```bash
curl -X POST \
  -H "X-Cron-Secret: YOUR_SECRET_HERE" \
  https://japplication-tracker-backend.onrender.com/api/cron/daily-gmail-sync
```

Expected response:
```json
{
  "success": true,
  "synced_users": 5,
  "failed_users": 0,
  "results": [...]
}
```

## User Instructions

Users can enable auto-sync by:

1. Go to **Settings** page
2. Scroll to **Gmail Sync** section
3. Check **"Daily Auto-Sync"** checkbox
4. Click **"Save Settings"**

That's it! Their Gmail will be synced automatically once per day.

## Troubleshooting

- **401 Error**: Check that `X-Cron-Secret` header matches `CRON_SECRET` env var
- **No users synced**: Ensure users have enabled "Daily Auto-Sync" in settings
- **Sync failures**: Check Render logs for specific error messages

## Monitoring

View sync results in Render backend logs:
```
Starting daily Gmail sync for all users...
Found 5 users with auto-sync enabled
```
