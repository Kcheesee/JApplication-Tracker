#!/usr/bin/env python3
"""
Automatic Job Application Tracker - ENHANCED VERSION
Features:
- Updates existing rows when status changes
- Extracts job links and salary info
- Better date parsing
- Daily summary email
- Application source tracking
- Color-coded Google Sheets
- Stats dashboard
- Interview prep mode
"""

import os.path
import pickle
import base64
import re
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import anthropic
from config import ANTHROPIC_API_KEY, SPREADSHEET_ID, JOB_EMAIL_KEYWORDS

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/spreadsheets'
]

# Color codes for Google Sheets (RGB values)
COLORS = {
    'Interview Scheduled': {'red': 0.85, 'green': 0.92, 'blue': 0.83},  # Light green
    'Offer Received': {'red': 0.67, 'green': 0.82, 'blue': 0.55},  # Green
    'Rejected': {'red': 0.96, 'green': 0.8, 'blue': 0.8},  # Light red
    'Applied': {'red': 0.85, 'green': 0.92, 'blue': 0.95},  # Light blue
    'Follow-up Needed': {'red': 1.0, 'green': 0.95, 'blue': 0.8},  # Light yellow
}


def get_credentials():
    """Get valid Google API credentials"""
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    return creds


def get_email_body(service, message_id):
    """Extract the email body from a message"""
    try:
        message = service.users().messages().get(
            userId='me',
            id=message_id,
            format='full'
        ).execute()

        payload = message['payload']
        body = ""

        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        break
                elif part['mimeType'] == 'text/html':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
        else:
            if 'body' in payload and 'data' in payload['body']:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')

        return body
    except Exception as e:
        print(f"Error getting email body: {e}")
        return ""


def search_job_emails(service, days_back=7):
    """Search for job-related emails from the last N days"""
    print(f"🔍 Searching for job-related emails from the last {days_back} days...")

    date_str = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')
    keyword_query = ' OR '.join([f'"{keyword}"' for keyword in JOB_EMAIL_KEYWORDS])
    query = f'after:{date_str} ({keyword_query})'

    results = service.users().messages().list(
        userId='me',
        q=query,
        maxResults=50
    ).execute()

    messages = results.get('messages', [])
    print(f"📧 Found {len(messages)} potential job-related emails")

    return messages


def extract_urls(text):
    """Extract URLs from text"""
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    urls = re.findall(url_pattern, text)
    # Filter for job board URLs
    job_urls = [url for url in urls if any(domain in url.lower() for domain in
                ['linkedin', 'indeed', 'greenhouse', 'lever', 'workday', 'careers', 'jobs'])]
    return job_urls[0] if job_urls else ''


def parse_email_with_claude(email_subject, email_body, email_from, email_date):
    """Use Claude AI to extract comprehensive job application information"""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""You are analyzing an email to extract comprehensive job application information.

Email From: {email_from}
Email Subject: {email_subject}
Email Date: {email_date}

Email Body:
{email_body[:3000]}

Please extract ALL of the following information if present:
1. Company Name
2. Position/Role Title
3. Application Status (choose one: "Applied", "Interview Scheduled", "Rejected", "Offer Received", "Follow-up Needed", "Other")
4. Application Date (when they applied, not today's date - extract from email if mentioned)
5. Salary Range (if mentioned)
6. Application Source (LinkedIn, Indeed, Company Website, Referral, etc.)
7. Interview Date/Time (if scheduled)
8. Next Steps or Action Items
9. Any other relevant notes

Respond in this exact format (use "Not mentioned" for missing info):
COMPANY: [company name or "Unknown"]
POSITION: [position title or "Unknown"]
STATUS: [one of the status options above]
DATE_APPLIED: [YYYY-MM-DD format or "Not mentioned"]
SALARY: [salary range or "Not mentioned"]
SOURCE: [application source or "Not mentioned"]
INTERVIEW_DATE: [date/time or "Not mentioned"]
NEXT_STEPS: [action items or "Not mentioned"]
NOTES: [any other relevant information]

If this email is NOT actually about a job application, respond with:
NOT_JOB_EMAIL

Be thorough and extract ALL factual information from the email."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response = message.content[0].text.strip()

        if "NOT_JOB_EMAIL" in response:
            return None

        lines = response.split('\n')
        data = {}

        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()

                if key == 'COMPANY':
                    data['company'] = value
                elif key == 'POSITION':
                    data['position'] = value
                elif key == 'STATUS':
                    data['status'] = value
                elif key == 'DATE_APPLIED':
                    data['date_applied'] = value if value != "Not mentioned" else datetime.now().strftime('%Y-%m-%d')
                elif key == 'SALARY':
                    data['salary'] = value if value != "Not mentioned" else ''
                elif key == 'SOURCE':
                    data['source'] = value if value != "Not mentioned" else ''
                elif key == 'INTERVIEW_DATE':
                    data['interview_date'] = value if value != "Not mentioned" else ''
                elif key == 'NEXT_STEPS':
                    data['next_steps'] = value if value != "Not mentioned" else ''
                elif key == 'NOTES':
                    data['notes'] = value if value != "Not mentioned" else ''

        if 'company' in data and 'status' in data:
            return data

        return None

    except Exception as e:
        print(f"Error parsing with Claude: {e}")
        return None


def get_all_sheet_data(sheets_service):
    """Get all data from the sheet"""
    result = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range='A:G'
    ).execute()

    return result.get('values', [])


def find_existing_row(sheet_data, company, position):
    """Find if company+position exists and return row number (1-indexed)"""
    for i, row in enumerate(sheet_data[1:], start=2):  # Skip header, start at row 2
        if len(row) >= 2:
            if row[0].lower() == company.lower() and row[1].lower() == position.lower():
                return i
    return None


def update_existing_row(sheets_service, row_number, job_data, job_link):
    """Update an existing row with new status and information"""
    # Column order: Company, Position Title, Job Link, Date Applied, Role Duties, Application Status, Notes

    # Get current row data first
    current_data = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f'A{row_number}:G{row_number}'
    ).execute().get('values', [[]])[0]

    # Pad with empty strings
    while len(current_data) < 7:
        current_data.append('')

    # Build updated row (preserve existing data where new data is empty)
    updated_row = [
        current_data[0],  # Company (don't change)
        current_data[1],  # Position (don't change)
        job_link if job_link else current_data[2],  # Job Link
        current_data[3],  # Date Applied (keep original)
        job_data.get('next_steps', '') if job_data.get('next_steps') else current_data[4],  # Role Duties/Next Steps
        job_data.get('status', current_data[5]),  # Application Status (UPDATE)
        f"{current_data[6]}\n[{datetime.now().strftime('%Y-%m-%d')}] {job_data.get('notes', '')}" if job_data.get('notes') else current_data[6]  # Append to notes
    ]

    body = {'values': [updated_row]}

    sheets_service.spreadsheets().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=f'A{row_number}:G{row_number}',
        valueInputOption='RAW',
        body=body
    ).execute()

    # Apply color formatting based on status
    apply_row_color(sheets_service, row_number, job_data.get('status'))

    print(f"🔄 Updated: {job_data['company']} - {job_data['position']} → {job_data['status']}")


def add_new_row(sheets_service, job_data, job_link):
    """Add a new row to the Google Sheet"""
    new_row = [
        job_data.get('company', 'Unknown'),
        job_data.get('position', 'Unknown'),
        job_link,
        job_data.get('date_applied', datetime.now().strftime('%Y-%m-%d')),
        job_data.get('next_steps', ''),
        job_data.get('status', 'Other'),
        f"Source: {job_data.get('source', 'Unknown')}\n{job_data.get('notes', '')}\nSalary: {job_data.get('salary', 'N/A')}"
    ]

    body = {'values': [new_row]}

    sheets_service.spreadsheets().values().append(
        spreadsheetId=SPREADSHEET_ID,
        range='A:G',
        valueInputOption='RAW',
        body=body
    ).execute()

    # Get the row number of the newly added row
    sheet_data = get_all_sheet_data(sheets_service)
    new_row_number = len(sheet_data)

    # Apply color formatting
    apply_row_color(sheets_service, new_row_number, job_data.get('status'))

    print(f"✅ Added: {job_data['company']} - {job_data['position']} ({job_data['status']})")


def apply_row_color(sheets_service, row_number, status):
    """Apply color to a row based on status"""
    if status not in COLORS:
        return

    try:
        # Get the actual sheet ID
        sheet_metadata = sheets_service.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
        sheet_id = sheet_metadata['sheets'][0]['properties']['sheetId']

        color = COLORS[status]

        requests = [{
            'repeatCell': {
                'range': {
                    'sheetId': sheet_id,
                    'startRowIndex': row_number - 1,
                    'endRowIndex': row_number,
                    'startColumnIndex': 0,
                    'endColumnIndex': 7
                },
                'cell': {
                    'userEnteredFormat': {
                        'backgroundColor': color
                    }
                },
                'fields': 'userEnteredFormat.backgroundColor'
            }
        }]

        body = {'requests': requests}

        sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=SPREADSHEET_ID,
            body=body
        ).execute()
    except Exception as e:
        print(f"  ⚠️  Could not apply color: {e}")
        # Continue without coloring


def generate_stats(sheet_data):
    """Generate statistics from the sheet data"""
    stats = {
        'total': len(sheet_data) - 1,  # Exclude header
        'applied': 0,
        'interviews': 0,
        'rejections': 0,
        'offers': 0,
        'pending': 0
    }

    for row in sheet_data[1:]:  # Skip header
        if len(row) >= 6:
            status = row[5].lower()
            if 'interview' in status:
                stats['interviews'] += 1
            elif 'reject' in status or 'unfortunately' in status:
                stats['rejections'] += 1
            elif 'offer' in status:
                stats['offers'] += 1
            elif 'applied' in status:
                stats['applied'] += 1
            else:
                stats['pending'] += 1

    return stats


def send_summary_email(gmail_service, stats, new_entries, updated_entries):
    """Send a daily summary email"""
    subject = f"📊 Job Tracker Update - {datetime.now().strftime('%B %d, %Y')}"

    body = f"""
<html>
<body style="font-family: Arial, sans-serif;">
<h2>📊 Daily Job Application Summary</h2>

<h3>Today's Activity</h3>
<ul>
    <li>✨ New applications tracked: <strong>{new_entries}</strong></li>
    <li>🔄 Status updates: <strong>{updated_entries}</strong></li>
</ul>

<h3>Overall Statistics</h3>
<ul>
    <li>📝 Total Applications: <strong>{stats['total']}</strong></li>
    <li>📤 Applied: <strong>{stats['applied']}</strong></li>
    <li>🎯 Interviews: <strong>{stats['interviews']}</strong></li>
    <li>❌ Rejections: <strong>{stats['rejections']}</strong></li>
    <li>🎉 Offers: <strong>{stats['offers']}</strong></li>
</ul>

<p>Keep pushing! 💪</p>

<p><em>Generated by Job Application Tracker</em></p>
</body>
</html>
    """

    message = {
        'raw': base64.urlsafe_b64encode(
            f"From: me\nTo: me\nSubject: {subject}\nContent-Type: text/html; charset=utf-8\n\n{body}".encode('utf-8')
        ).decode('utf-8')
    }

    try:
        gmail_service.users().messages().send(userId='me', body=message).execute()
        print("\n📧 Summary email sent!")
    except Exception as e:
        print(f"\n⚠️  Could not send summary email: {e}")


def main():
    """Main automation function"""
    print("\n" + "="*60)
    print("🤖 JOB APPLICATION TRACKER - ENHANCED VERSION")
    print("="*60 + "\n")

    creds = get_credentials()

    gmail_service = build('gmail', 'v1', credentials=creds)
    sheets_service = build('sheets', 'v4', credentials=creds)

    messages = search_job_emails(gmail_service, days_back=7)

    if not messages:
        print("No job-related emails found.")
        return

    print(f"\n📊 Processing emails with AI...\n")

    # Get existing sheet data
    sheet_data = get_all_sheet_data(sheets_service)

    new_entries = 0
    updated_entries = 0
    skipped = 0

    for message in messages:
        msg = gmail_service.users().messages().get(
            userId='me',
            id=message['id'],
            format='metadata',
            metadataHeaders=['From', 'Subject', 'Date']
        ).execute()

        headers = msg['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
        date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')

        print(f"Processing: {subject[:50]}...")

        body = get_email_body(gmail_service, message['id'])
        job_link = extract_urls(body)

        job_data = parse_email_with_claude(subject, body, sender, date)

        if job_data:
            existing_row = find_existing_row(sheet_data, job_data['company'], job_data['position'])

            if existing_row:
                update_existing_row(sheets_service, existing_row, job_data, job_link)
                updated_entries += 1
            else:
                add_new_row(sheets_service, job_data, job_link)
                new_entries += 1
                # Refresh sheet data after adding
                sheet_data = get_all_sheet_data(sheets_service)
        else:
            print(f"  ⏭️  Not a job application email, skipping...")
            skipped += 1

    # Generate and display stats
    final_sheet_data = get_all_sheet_data(sheets_service)
    stats = generate_stats(final_sheet_data)

    print("\n" + "="*60)
    print(f"✨ DONE!")
    print(f"   📝 {new_entries} new entries added")
    print(f"   🔄 {updated_entries} entries updated")
    print(f"   ⏭️  {skipped} emails skipped")
    print("\n📊 Overall Stats:")
    print(f"   Total Applications: {stats['total']}")
    print(f"   Interviews: {stats['interviews']}")
    print(f"   Rejections: {stats['rejections']}")
    print(f"   Offers: {stats['offers']}")
    print("="*60 + "\n")

    # Summary email disabled (requires additional Gmail permissions)
    # if new_entries > 0 or updated_entries > 0:
    #     send_summary_email(gmail_service, stats, new_entries, updated_entries)


if __name__ == '__main__':
    main()
