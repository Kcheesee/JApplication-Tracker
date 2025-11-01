import pickle
import base64
import re
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build


SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']


class GmailService:
    """Service for interacting with Gmail API"""

    def __init__(self, credentials_dict: Dict[str, Any], token_dict: Optional[Dict[str, Any]] = None):
        """
        Initialize Gmail service with credentials
        credentials_dict: Google OAuth credentials JSON
        token_dict: Stored token (optional, will be refreshed if expired)
        """
        self.credentials_dict = credentials_dict
        self.token_dict = token_dict
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Gmail API"""
        creds = None

        # Try to load existing token
        if self.token_dict:
            try:
                creds = Credentials.from_authorized_user_info(self.token_dict, SCOPES)
            except Exception as e:
                print(f"Error loading token: {e}")

        # If no valid credentials, prompt for authentication
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"Error refreshing token: {e}")
                    creds = None

            if not creds:
                # This will need to be handled differently in production
                # For now, raise an error - user needs to authenticate via OAuth flow
                raise Exception("No valid credentials. User needs to authenticate.")

        self.service = build('gmail', 'v1', credentials=creds)
        # Store updated token for persistence
        self.token_dict = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes
        }

    def get_updated_token(self) -> Dict[str, Any]:
        """Return the updated token dict for persistence"""
        return self.token_dict

    def search_job_emails(self, keywords: List[str], days_back: int = 7, max_results: int = 500) -> List[Dict[str, Any]]:
        """
        Search for job-related emails in Gmail with pagination support
        Returns list of email data dictionaries
        """
        # Calculate date for filtering
        date_filter = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')

        # Build search query
        keyword_query = ' OR '.join([f'"{keyword}"' for keyword in keywords])
        query = f'({keyword_query}) after:{date_filter}'

        try:
            all_messages = []
            page_token = None

            # Paginate through all results
            while len(all_messages) < max_results:
                # Search for messages with pagination
                results = self.service.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=min(100, max_results - len(all_messages)),  # Gmail API max is 500 per request, we use 100 for efficiency
                    pageToken=page_token
                ).execute()

                messages = results.get('messages', [])
                if not messages:
                    break

                all_messages.extend(messages)

                # Check if there are more pages
                page_token = results.get('nextPageToken')
                if not page_token:
                    break

            email_data_list = []

            # Get full email data for each message
            print(f"Found {len(all_messages)} emails to process")
            for message in all_messages:
                msg_id = message['id']
                email_data = self.get_email_data(msg_id)
                if email_data:
                    email_data_list.append(email_data)

            return email_data_list

        except Exception as e:
            print(f"Error searching Gmail: {str(e)}")
            return []

    def get_email_data(self, message_id: str) -> Optional[Dict[str, Any]]:
        """
        Get full email data for a specific message ID
        Returns dict with subject, from, date, body, etc.
        """
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()

            # Extract headers
            headers = message['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'].lower() == 'subject'), '')
            sender = next((h['value'] for h in headers if h['name'].lower() == 'from'), '')
            date_str = next((h['value'] for h in headers if h['name'].lower() == 'date'), '')

            # Extract body
            body = self._get_email_body(message['payload'])

            # Extract URLs
            urls = self._extract_urls(body)

            return {
                'id': message_id,
                'subject': subject,
                'from': sender,
                'date': date_str,
                'body': body,
                'urls': urls
            }

        except Exception as e:
            print(f"Error getting email data: {str(e)}")
            return None

    def _get_email_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body from payload"""
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

    def _extract_urls(self, text: str) -> List[str]:
        """Extract URLs from text"""
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, text)

        # Filter for job board URLs
        job_domains = ['linkedin.com', 'indeed.com', 'glassdoor.com', 'greenhouse.io',
                       'lever.co', 'workday.com', 'jobs.', 'careers.', 'apply.']

        job_urls = [url for url in urls if any(domain in url.lower() for domain in job_domains)]

        return job_urls[:5]  # Return up to 5 job URLs

    def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send an email"""
        try:
            message = {
                'raw': base64.urlsafe_b64encode(
                    f"To: {to}\nSubject: {subject}\n\n{body}".encode('utf-8')
                ).decode('utf-8')
            }

            self.service.users().messages().send(userId='me', body=message).execute()
            return True

        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
