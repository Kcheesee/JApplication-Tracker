# Automatic Job Application Tracker 🤖📊

An AI-powered automation tool that monitors your Gmail for job-related emails and automatically updates your Google Sheet with application status, interviews, rejections, and offers.

## Features

- 🔍 **Smart Email Detection** - Searches Gmail for job-related emails using intelligent keywords
- 🤖 **AI-Powered Parsing** - Uses Claude AI to extract company name, position, status, and notes from emails
- 📊 **Automatic Sheet Updates** - Adds new applications to Google Sheets automatically
- 🚫 **Duplicate Prevention** - Checks existing entries to avoid duplicates
- ⏰ **Daily Automation** - Can be scheduled to run daily to keep your job tracker up-to-date

## How It Works

```
Gmail API → Fetch job-related emails →
Claude AI → Extract structured data →
Google Sheets API → Update tracking sheet →
✨ Done!
```

## Installation

### Prerequisites
- Python 3.7+
- Google Cloud account (free)
- Anthropic API key (for Claude AI)
- Gmail account
- Google Sheet for job tracking

### Setup

1. **Clone this repository:**
```bash
git clone https://github.com/Kcheesee/job-application-tracker.git
cd job-application-tracker
```

2. **Install dependencies:**
```bash
pip3 install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client anthropic
```

3. **Set up Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable **Gmail API** and **Google Sheets API**
   - Create OAuth 2.0 credentials (Desktop app)
   - Download credentials JSON and save as `credentials.json` in project folder

4. **Configure API keys:**
```bash
cp config.example.py config.py
```

Edit `config.py` and add:
- Your Anthropic API key
- Your Google Sheet ID (from the sheet URL)

5. **Create your Google Sheet** with these columns:
   - Column A: Company
   - Column B: Position Title
   - Column C: Job Link
   - Column D: Date Applied
   - Column E: Role Duties
   - Column F: Application Status
   - Column G: Notes

## Usage

### First Run (3-Month Catch-Up)
To import the last 90 days of job emails:

```bash
# Edit job_tracker.py and temporarily change:
# days_back=90 and maxResults=100
python3 job_tracker.py
```

### Daily Use
Run manually or set up automation (see below):

```bash
python3 job_tracker.py
```

### Set Up Daily Automation (macOS)

Create a cron job to run daily at 9 AM:

```bash
crontab -e
```

Add this line:
```
0 9 * * * cd /Users/YOUR_USERNAME/path/to/Job\ Application\ Tracker && /usr/local/bin/python3 job_tracker.py >> tracker.log 2>&1
```

## Example Output

```
============================================================
🤖 JOB APPLICATION TRACKER - AUTOMATIC UPDATE
============================================================

🔍 Searching for job-related emails from the last 7 days...
📧 Found 12 potential job-related emails

📊 Processing emails with AI...

Processing: Thank you for your application to Software Engineer...
✅ Added to sheet: TechCorp - Software Engineer (Applied)

Processing: Interview invitation for Product Manager role...
✅ Added to sheet: StartupXYZ - Product Manager (Interview Scheduled)

Processing: Update on your application...
  ⏭️  Already in sheet, skipping...

============================================================
✨ DONE! Added 8 new entries. Skipped 4 duplicates.
============================================================
```

## Email Detection

The script searches for emails containing these keywords:
- "application"
- "interview"
- "position"
- "unfortunately"
- "offer"
- "candidate"
- "application status"
- "thank you for applying"
- "next steps"
- "recruiter"

You can customize these in `config.py`.

## AI Extraction

Claude AI analyzes each email and extracts:
- **Company Name** - Identified from email sender and content
- **Position Title** - Job role title
- **Status** - Applied, Interview Scheduled, Rejected, Offer Received, Follow-up Needed, Other
- **Notes** - Important details, interview dates, next steps

## Project Structure

```
job-application-tracker/
├── job_tracker.py              # Main automation script
├── test_gmail_auth.py          # Test Gmail API connection
├── test_sheets_connection.py   # Test Google Sheets connection
├── config.py                   # API keys & settings (not in git)
├── config.example.py           # Template for config
├── credentials.json            # Google OAuth credentials (not in git)
├── token.pickle                # Stored auth tokens (not in git)
├── .gitignore                  # Protects sensitive files
└── README.md                   # This file
```

## Security Notes

⚠️ **IMPORTANT:** Never commit these files to GitHub:
- `credentials.json` - Your Google OAuth credentials
- `token.pickle` - Your authentication tokens
- `config.py` - Your API keys

The `.gitignore` file is configured to prevent this, but always double-check!

## Troubleshooting

**"ModuleNotFoundError"**
- Make sure you installed all dependencies with pip3

**"FileNotFoundError: credentials.json"**
- Run the script from the project directory: `cd Job\ Application\ Tracker`
- Make sure `credentials.json` is in the same folder

**"API has not been used in project"**
- Enable Gmail API and Google Sheets API in Google Cloud Console
- Wait a few minutes for APIs to activate

**Emails not being detected**
- Check that your emails contain the keywords in `config.py`
- Adjust the search keywords if needed

## Future Enhancements

- [ ] Email notifications when new applications are added
- [ ] Slack integration for status updates
- [ ] Dashboard to visualize application pipeline
- [ ] Automatic follow-up reminders
- [ ] Resume/cover letter attachment tracking

## Contributing

Feel free to open issues or submit pull requests!

## License

MIT License - feel free to use and modify!

## Author

Built to automate the job search grind! 💪

---

*Powered by Gmail API, Google Sheets API, and Claude AI*
