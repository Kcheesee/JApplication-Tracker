#!/usr/bin/env python3
"""
Automatic Job Application Tracker
Reads Gmail for job-related emails and updates Google Sheet automatically
"""

import os.path
import pickle
import base64
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import anthropic
from config import ANTHROPIC_API_KEY, SPREADSHEET_ID, JOB_EMAIL_KEYWORDS

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
]


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

        # Try to get body from different parts
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                        break
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

    # Calculate date for search
    date_str = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')

    # Build search query
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


def parse_email_with_claude(email_subject, email_body, email_from):
    """Use Claude AI to extract job application information from email"""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""You are analyzing an email to extract job application information.

Email From: {email_from}
Email Subject: {email_subject}

Email Body:
{email_body[:2000]}

Please extract the following information if present:
1. Company Name
2. Position/Role Title
3. Application Status (choose one: "Applied", "Interview Scheduled", "Rejected", "Offer Received", "Follow-up Needed", "Other")
4. Any relevant notes or next steps

Respond in this exact format:
COMPANY: [company name or "Unknown"]
POSITION: [position title or "Unknown"]
STATUS: [one of the status options above]
NOTES: [any relevant information, action items, or interview dates]

If this email is NOT actually about a job application, respond with:
NOT_JOB_EMAIL

Be concise and extract only factual information from the email."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response = message.content[0].text.strip()

        # Check if it's not a job email
        if "NOT_JOB_EMAIL" in response:
            return None

        # Parse the response
        lines = response.split('\n')
        data = {}

        for line in lines:
            if line.startswith('COMPANY:'):
                data['company'] = line.replace('COMPANY:', '').strip()
            elif line.startswith('POSITION:'):
                data['position'] = line.replace('POSITION:', '').strip()
            elif line.startswith('STATUS:'):
                data['status'] = line.replace('STATUS:', '').strip()
            elif line.startswith('NOTES:'):
                data['notes'] = line.replace('NOTES:', '').strip()

        # Only return if we have at least company and status
        if 'company' in data and 'status' in data:
            return data

        return None

    except Exception as e:
        print(f"Error parsing with Claude: {e}")
        return None


def check_if_exists_in_sheet(sheets_service, company, position):
    """Check if this company+position combo already exists in the sheet"""
    result = sheets_service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range='A:B'  # Company and Position columns
    ).execute()

    values = result.get('values', [])

    # Skip header row
    for row in values[1:]:
        if len(row) >= 2:
            if row[0].lower() == company.lower() and row[1].lower() == position.lower():
                return True

    return False


def update_google_sheet(sheets_service, job_data):
    """Add a new row to the Google Sheet"""
    # Column order: Company, Position Title, Job Link, Date Applied, Role Duties, Application Status, Notes

    new_row = [
        job_data.get('company', 'Unknown'),
        job_data.get('position', 'Unknown'),
        '',  # Job Link (empty for now)
        datetime.now().strftime('%Y-%m-%d'),  # Date Applied
        '',  # Role Duties (empty for now)
        job_data.get('status', 'Other'),
        job_data.get('notes', '')
    ]

    body = {
        'values': [new_row]
    }

    sheets_service.spreadsheets().values().append(
        spreadsheetId=SPREADSHEET_ID,
        range='A:G',
        valueInputOption='RAW',
        body=body
    ).execute()

    print(f"✅ Added to sheet: {job_data['company']} - {job_data['position']} ({job_data['status']})")


def main():
    """Main automation function"""
    print("\n" + "="*60)
    print("🤖 JOB APPLICATION TRACKER - AUTOMATIC UPDATE")
    print("="*60 + "\n")

    # Get credentials
    creds = get_credentials()

    # Build services
    gmail_service = build('gmail', 'v1', credentials=creds)
    sheets_service = build('sheets', 'v4', credentials=creds)

    # Search for job emails
    messages = search_job_emails(gmail_service, days_back=7)

    if not messages:
        print("No job-related emails found.")
        return

    print(f"\n📊 Processing emails with AI...\n")

    new_entries = 0
    skipped = 0

    for message in messages:
        # Get message details
        msg = gmail_service.users().messages().get(
            userId='me',
            id=message['id'],
            format='metadata',
            metadataHeaders=['From', 'Subject']
        ).execute()

        headers = msg['payload']['headers']
        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
        sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')

        print(f"Processing: {subject[:50]}...")

        # Get email body
        body = get_email_body(gmail_service, message['id'])

        # Parse with Claude
        job_data = parse_email_with_claude(subject, body, sender)

        if job_data:
            # Check if already exists
            if check_if_exists_in_sheet(sheets_service, job_data['company'], job_data['position']):
                print(f"  ⏭️  Already in sheet, skipping...")
                skipped += 1
            else:
                # Add to sheet
                update_google_sheet(sheets_service, job_data)
                new_entries += 1
        else:
            print(f"  ⏭️  Not a job application email, skipping...")

    print("\n" + "="*60)
    print(f"✨ DONE! Added {new_entries} new entries. Skipped {skipped} duplicates.")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
