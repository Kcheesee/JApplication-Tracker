from abc import ABC, abstractmethod
from typing import Dict, Optional, Any
import json
import re
from datetime import datetime


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""

    @abstractmethod
    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        """Parse a job application email and extract structured data"""
        pass

    @abstractmethod
    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        """Parse a job posting from a webpage or text"""
        pass

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from response text"""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                return None
        return None

    def _convert_dates(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert date strings to datetime objects"""
        date_fields = ["application_date", "interview_date", "application_deadline"]
        for field in date_fields:
            if data.get(field):
                try:
                    if field == "interview_date" and " " in str(data[field]):
                        data[field] = datetime.fromisoformat(data[field].replace(" ", "T"))
                    else:
                        data[field] = datetime.fromisoformat(data[field])
                except:
                    data[field] = None
        return data


class AnthropicProvider(LLMProvider):
    """Claude AI provider"""

    def __init__(self, api_key: str):
        from anthropic import Anthropic
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_email_parsing_prompt(email_subject, email_date, email_body)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text.strip()
            data = self._extract_json(response_text)

            if not data or not data.get("is_job_email", False):
                return None

            return self._convert_dates(data)
        except Exception as e:
            print(f"Error parsing email with Claude: {str(e)}")
            return None

    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_job_posting_prompt(job_url, job_text)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            response_text = response.content[0].text.strip()
            data = self._extract_json(response_text)

            if data:
                return self._convert_dates(data)
            return None
        except Exception as e:
            print(f"Error parsing job posting with Claude: {str(e)}")
            return None

    def _get_email_parsing_prompt(self, email_subject: str, email_date: str, email_body: str) -> str:
        return f"""Analyze this email and extract job application information. If this is NOT a job-related email, respond with "NOT_JOB_EMAIL".

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

    def _get_job_posting_prompt(self, job_url: str, job_text: str) -> str:
        return f"""Extract job information from this job posting.

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


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider"""

    def __init__(self, api_key: str):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"  # Latest GPT-4 Optimized model

    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_email_parsing_prompt(email_subject, email_date, email_body)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024,
                temperature=0.1
            )

            response_text = response.choices[0].message.content.strip()
            data = self._extract_json(response_text)

            if not data or not data.get("is_job_email", False):
                return None

            return self._convert_dates(data)
        except Exception as e:
            print(f"Error parsing email with OpenAI: {str(e)}")
            return None

    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_job_posting_prompt(job_url, job_text)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024,
                temperature=0.1
            )

            response_text = response.choices[0].message.content.strip()
            data = self._extract_json(response_text)

            if data:
                return self._convert_dates(data)
            return None
        except Exception as e:
            print(f"Error parsing job posting with OpenAI: {str(e)}")
            return None

    def _get_email_parsing_prompt(self, email_subject: str, email_date: str, email_body: str) -> str:
        # Same prompt as Anthropic
        return AnthropicProvider._get_email_parsing_prompt(self, email_subject, email_date, email_body)

    def _get_job_posting_prompt(self, job_url: str, job_text: str) -> str:
        # Same prompt as Anthropic
        return AnthropicProvider._get_job_posting_prompt(self, job_url, job_text)


class GoogleProvider(LLMProvider):
    """Google Gemini provider"""

    def __init__(self, api_key: str):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_email_parsing_prompt(email_subject, email_date, email_body)

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            data = self._extract_json(response_text)

            if not data or not data.get("is_job_email", False):
                return None

            return self._convert_dates(data)
        except Exception as e:
            print(f"Error parsing email with Google: {str(e)}")
            return None

    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_job_posting_prompt(job_url, job_text)

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            data = self._extract_json(response_text)

            if data:
                return self._convert_dates(data)
            return None
        except Exception as e:
            print(f"Error parsing job posting with Google: {str(e)}")
            return None

    def _get_email_parsing_prompt(self, email_subject: str, email_date: str, email_body: str) -> str:
        return AnthropicProvider._get_email_parsing_prompt(self, email_subject, email_date, email_body)

    def _get_job_posting_prompt(self, job_url: str, job_text: str) -> str:
        return AnthropicProvider._get_job_posting_prompt(self, job_url, job_text)


class OpenRouterProvider(LLMProvider):
    """OpenRouter provider (supports multiple models)"""

    def __init__(self, api_key: str, model: str = "anthropic/claude-3.5-sonnet"):
        from openai import OpenAI
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        self.model = model

    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_email_parsing_prompt(email_subject, email_date, email_body)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024
            )

            response_text = response.choices[0].message.content.strip()
            data = self._extract_json(response_text)

            if not data or not data.get("is_job_email", False):
                return None

            return self._convert_dates(data)
        except Exception as e:
            print(f"Error parsing email with OpenRouter: {str(e)}")
            return None

    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        prompt = self._get_job_posting_prompt(job_url, job_text)

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024
            )

            response_text = response.choices[0].message.content.strip()
            data = self._extract_json(response_text)

            if data:
                return self._convert_dates(data)
            return None
        except Exception as e:
            print(f"Error parsing job posting with OpenRouter: {str(e)}")
            return None

    def _get_email_parsing_prompt(self, email_subject: str, email_date: str, email_body: str) -> str:
        return AnthropicProvider._get_email_parsing_prompt(self, email_subject, email_date, email_body)

    def _get_job_posting_prompt(self, job_url: str, job_text: str) -> str:
        return AnthropicProvider._get_job_posting_prompt(self, job_url, job_text)


class LLMService:
    """Unified service for interacting with multiple LLM providers"""

    def __init__(self, provider: str = "anthropic", api_key: Optional[str] = None, **kwargs):
        """
        Initialize LLM service with specified provider

        Args:
            provider: One of "anthropic", "openai", "google", "openrouter"
            api_key: API key for the provider
            **kwargs: Additional provider-specific arguments (e.g., model name)
        """
        self.provider_name = provider.lower()

        if not api_key:
            raise ValueError(f"API key required for {provider}")

        if self.provider_name == "anthropic":
            self.provider = AnthropicProvider(api_key)
        elif self.provider_name == "openai":
            self.provider = OpenAIProvider(api_key)
        elif self.provider_name == "google":
            self.provider = GoogleProvider(api_key)
        elif self.provider_name == "openrouter":
            model = kwargs.get("model", "anthropic/claude-3.5-sonnet")
            self.provider = OpenRouterProvider(api_key, model)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def parse_job_email(self, email_body: str, email_subject: str = "", email_date: str = "") -> Optional[Dict[str, Any]]:
        """Parse a job application email using the configured provider"""
        return self.provider.parse_job_email(email_body, email_subject, email_date)

    def parse_job_posting(self, job_text: str, job_url: str = "") -> Optional[Dict[str, Any]]:
        """Parse a job posting using the configured provider"""
        return self.provider.parse_job_posting(job_text, job_url)

    @staticmethod
    def get_available_providers() -> Dict[str, Dict[str, Any]]:
        """Get list of available LLM providers with metadata"""
        return {
            "anthropic": {
                "name": "Claude (Anthropic)",
                "models": ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022"],
                "default_model": "claude-sonnet-4-20250514",
                "description": "Most accurate and context-aware"
            },
            "openai": {
                "name": "GPT-4 (OpenAI)",
                "models": ["gpt-4o", "gpt-4-turbo", "gpt-4"],
                "default_model": "gpt-4o",
                "description": "Fast and reliable"
            },
            "google": {
                "name": "Gemini (Google)",
                "models": ["gemini-2.0-flash-exp", "gemini-1.5-pro"],
                "default_model": "gemini-2.0-flash-exp",
                "description": "Fast with good multimodal support"
            },
            "openrouter": {
                "name": "OpenRouter (Multi-Model)",
                "models": [
                    "anthropic/claude-3.5-sonnet",
                    "openai/gpt-4o",
                    "google/gemini-2.0-flash-exp",
                    "meta-llama/llama-3.3-70b-instruct"
                ],
                "default_model": "anthropic/claude-3.5-sonnet",
                "description": "Access multiple models through one API"
            }
        }
