from anthropic import Anthropic
from typing import Dict, Optional, Any
import json
import re
from datetime import datetime


class ClaudeService:
    """Service for interacting with Claude AI for email parsing"""

    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        """
        Parse a job application email using Claude AI
        Returns structured job data or None if not a job-related email
        """
        prompt = f"""Analyze this email and extract job application information. If this is NOT a job-related email, respond with "NOT_JOB_EMAIL".

Email Subject: {email_subject}
Email Date: {email_date}
Email Body:
{email_body}

Extract the following information if available:
1. Company Name
2. Position/Role Title
3. Application Status (choose ONE: Applied, Interview Scheduled, Rejected, Offer Received, Follow-up Needed, Other)
4. Application Date (format: YYYY-MM-DD, use email date if not specified)
5. Salary Range (extract min and max if mentioned, e.g., "$120,000-$150,000" or "120k-150k")
6. Application Source (choose ONE: LinkedIn, Indeed, Company Website, Referral, Recruiter, Job Board, Other)
7. Interview Date/Time (format: YYYY-MM-DD HH:MM if scheduled)
8. Interview Type (e.g., Phone Screen, Technical Interview, Onsite, Final Round)
9. Location (city, state/country or "Remote")
10. Work Mode (choose ONE: Remote, Hybrid, Onsite)
11. Next Steps/Action Items
12. Recruiter Name
13. Recruiter Email
14. Recruiter Phone
15. Benefits mentioned
16. Company Size (if mentioned, e.g., "Startup", "50-200", "Enterprise")
17. Industry (e.g., "Technology", "Healthcare", "Finance")
18. Application Deadline (format: YYYY-MM-DD if mentioned)
19. Role Duties/Description (brief summary)
20. Additional Notes

Respond in JSON format ONLY. Use null for missing fields. Example:
{{
    "is_job_email": true,
    "company": "TechCorp",
    "position": "Senior Software Engineer",
    "status": "Interview Scheduled",
    "application_date": "2024-01-15",
    "salary_min": 120000,
    "salary_max": 150000,
    "application_source": "LinkedIn",
    "interview_date": "2024-01-20 14:00",
    "interview_type": "Phone Screen",
    "location": "San Francisco, CA",
    "work_mode": "Hybrid",
    "next_steps": "Prepare for technical interview",
    "recruiter_name": "Jane Smith",
    "recruiter_email": "jane@techcorp.com",
    "recruiter_phone": "+1-555-0123",
    "benefits": "Health insurance, 401k, unlimited PTO",
    "company_size": "200-500",
    "industry": "Technology",
    "application_deadline": null,
    "role_duties": "Build scalable backend systems",
    "notes": "Company uses Python and Go"
}}

If NOT a job email, respond with: {{"is_job_email": false}}"""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text.strip()

            # Extract JSON from response (handle cases where Claude adds explanation)
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)

            data = json.loads(response_text)

            # Check if it's a job email
            if not data.get("is_job_email", False):
                return None

            # Convert date strings to datetime objects
            if data.get("application_date"):
                try:
                    data["application_date"] = datetime.fromisoformat(data["application_date"])
                except:
                    data["application_date"] = None

            if data.get("interview_date"):
                try:
                    data["interview_date"] = datetime.fromisoformat(data["interview_date"].replace(" ", "T"))
                except:
                    data["interview_date"] = None

            if data.get("application_deadline"):
                try:
                    data["application_deadline"] = datetime.fromisoformat(data["application_deadline"])
                except:
                    data["application_deadline"] = None

            return data

        except Exception as e:
            print(f"Error parsing email with Claude: {str(e)}")
            return None

    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        """
        Parse a job posting from a webpage or text
        Used by the browser extension
        """
        prompt = f"""Extract job information from this job posting.

Job URL: {job_url}
Job Posting:
{job_text}

Extract all available information and respond in JSON format:
{{
    "company": "Company Name",
    "position": "Job Title",
    "location": "City, State/Country or Remote",
    "work_mode": "Remote/Hybrid/Onsite",
    "salary_min": 120000,
    "salary_max": 150000,
    "job_description": "Brief description",
    "role_duties": "Key responsibilities",
    "benefits": "Benefits mentioned",
    "company_size": "Company size if mentioned",
    "industry": "Industry",
    "application_deadline": "YYYY-MM-DD if mentioned"
}}

Use null for missing fields."""

        try:
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text.strip()
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)

            data = json.loads(response_text)

            # Convert date if present
            if data.get("application_deadline"):
                try:
                    data["application_deadline"] = datetime.fromisoformat(data["application_deadline"])
                except:
                    data["application_deadline"] = None

            return data

        except Exception as e:
            print(f"Error parsing job posting with Claude: {str(e)}")
            return None
