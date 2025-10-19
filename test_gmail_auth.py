#!/usr/bin/env python3
"""
Test Gmail API Authentication
This script will open a browser window for you to authorize access to your Gmail
"""

import os.path
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# If modifying these scopes, delete the file token.pickle.
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
]

def authenticate_gmail():
    """Authenticate and return Gmail service"""
    creds = None

    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    # Build the Gmail service
    service = build('gmail', 'v1', credentials=creds)
    return service


def test_gmail_connection():
    """Test that we can read emails"""
    print("🔐 Authenticating with Gmail...")
    service = authenticate_gmail()

    print("✅ Authentication successful!")
    print("\n📧 Fetching your latest 5 emails as a test...\n")

    # Get the latest 5 messages
    results = service.users().messages().list(
        userId='me',
        maxResults=5
    ).execute()

    messages = results.get('messages', [])

    if not messages:
        print('No messages found.')
    else:
        print(f"Found {len(messages)} messages:\n")
        for i, message in enumerate(messages, 1):
            # Get the message details
            msg = service.users().messages().get(
                userId='me',
                id=message['id'],
                format='metadata',
                metadataHeaders=['From', 'Subject', 'Date']
            ).execute()

            headers = msg['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), 'Unknown')

            print(f"{i}. From: {sender}")
            print(f"   Subject: {subject}")
            print(f"   Date: {date}")
            print()

    print("🎉 Gmail API is working perfectly!")


if __name__ == '__main__':
    test_gmail_connection()
