"""
Job Posting URL Parser using Claude AI

Extracts structured job data from any job posting URL using LLM-powered parsing.
Works with LinkedIn, Indeed, Greenhouse, Lever, company career pages, etc.
"""

import httpx
import anthropic
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
import os
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class JobParserService:
    """Service for parsing job posting URLs and extracting structured data."""

    def __init__(self):
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment")

        self.client = anthropic.Anthropic(api_key=self.anthropic_api_key)

    async def parse_job_url(self, url: str) -> Dict[str, Any]:
        """
        Parse a job posting URL and extract structured data.

        Args:
            url: The job posting URL

        Returns:
            Dictionary with extracted job data
        """
        try:
            # Step 1: Fetch the HTML content
            html_content = await self._fetch_url(url)

            # Step 2: Clean and extract text from HTML
            text_content = self._extract_text(html_content)

            # Step 3: Use Claude to extract structured data
            job_data = await self._claude_extract(text_content, url)

            return {
                "success": True,
                "data": job_data,
                "source_url": url,
                "parsed_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error parsing job URL {url}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "source_url": url
            }

    async def _fetch_url(self, url: str) -> str:
        """Fetch HTML content from URL."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.text

    def _extract_text(self, html: str) -> str:
        """Extract clean text content from HTML."""
        soup = BeautifulSoup(html, 'lxml')

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()

        # Get text and clean it up
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)

        # Limit to reasonable size (Claude's context window)
        return text[:15000]  # ~3750 tokens

    async def _claude_extract(self, text: str, url: str) -> Dict[str, Any]:
        """Use Claude to extract structured job data from text."""

        prompt = f"""You are a job posting parser. Extract structured information from the following job posting text.

Job Posting URL: {url}

Job Posting Content:
{text}

Please extract the following information and return it as a JSON object:
{{
    "company": "Company name",
    "position": "Job title/position",
    "location": "Location (include remote/hybrid/onsite status)",
    "salary_min": "Minimum salary (number only, or null)",
    "salary_max": "Maximum salary (number only, or null)",
    "salary_currency": "Currency (USD, EUR, etc., or null)",
    "employment_type": "Full-time, Part-time, Contract, etc.",
    "experience_level": "Entry, Mid, Senior, Lead, etc.",
    "description": "Brief job description (2-3 sentences)",
    "requirements": ["List of key requirements/skills"],
    "tech_stack": ["List of technologies mentioned"],
    "benefits": ["List of benefits mentioned"],
    "remote_policy": "Remote, Hybrid, Onsite, or Unknown",
    "visa_sponsorship": true/false/null,
    "posting_date": "Date posted if available (YYYY-MM-DD format or null)"
}}

Important:
- If information is not found, use null or empty array
- Be accurate - only extract what's clearly stated
- For salary, extract numbers only (e.g., "100000" not "$100k")
- For requirements and tech_stack, list the most important items (max 10 each)
- Return ONLY the JSON object, no other text"""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.2,  # Low temperature for consistent extraction
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Extract JSON from response
            response_text = message.content[0].text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]

            # Parse JSON
            job_data = json.loads(response_text.strip())

            # Add source URL
            job_data["source_url"] = url

            return job_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response as JSON: {e}")
            logger.error(f"Response was: {response_text}")
            raise ValueError("Could not parse job posting data")

        except Exception as e:
            logger.error(f"Claude extraction failed: {e}")
            raise


# Singleton instance
_parser_service = None

def get_job_parser() -> JobParserService:
    """Get or create the job parser service instance."""
    global _parser_service
    if _parser_service is None:
        _parser_service = JobParserService()
    return _parser_service
