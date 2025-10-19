#!/usr/bin/env python3
"""
Test Google Sheets API Connection
"""

import os.path
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
]

SPREADSHEET_ID = '1-YF804B4H5al5_rHRJNmn5shZtUmmnLY1wPvh21NYak'

def get_credentials():
    """Get valid credentials"""
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


def test_sheets_connection():
    """Test reading from the Google Sheet"""
    print("🔐 Authenticating with Google Sheets...")
    creds = get_credentials()
    service = build('sheets', 'v4', credentials=creds)

    print("✅ Authentication successful!")
    print(f"\n📊 Reading your job tracking sheet...\n")

    # Read the sheet
    sheet = service.spreadsheets()
    result = sheet.values().get(
        spreadsheetId=SPREADSHEET_ID,
        range='A1:G10'  # Read first 10 rows, all 7 columns
    ).execute()

    values = result.get('values', [])

    if not values:
        print('No data found in sheet.')
    else:
        print(f"Found {len(values)} rows:\n")

        # Print the header row
        if len(values) > 0:
            headers = values[0]
            print("Headers:", " | ".join(headers))
            print("-" * 80)

        # Print the data rows
        for i, row in enumerate(values[1:], start=2):
            # Pad row with empty strings if needed
            while len(row) < 7:
                row.append('')

            print(f"Row {i}:")
            print(f"  Company: {row[0]}")
            print(f"  Position: {row[1]}")
            print(f"  Status: {row[5]}")
            print()

    print("🎉 Google Sheets API is working perfectly!")


if __name__ == '__main__':
    test_sheets_connection()
