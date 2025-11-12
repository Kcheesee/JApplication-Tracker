"""
Company Research Service using Multi-Provider AI

Fetches and analyzes company information for interview preparation.
Supports Claude, GPT-4, Gemini, and OpenRouter.
Provides comprehensive research including overview, news, culture, tech stack, etc.
"""

import httpx
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
import logging
import json
from datetime import datetime
from .llm_service import LLMService

logger = logging.getLogger(__name__)


class CompanyResearchService:
    """Service for researching companies using web scraping + Multi-Provider AI analysis."""

    def __init__(self, provider: str = "anthropic", api_key: Optional[str] = None):
        """
        Initialize company research service with specified LLM provider.

        Args:
            provider: LLM provider (anthropic, openai, google, openrouter)
            api_key: API key for the provider (uses user settings if not provided)
        """
        self.llm_service = LLMService(provider=provider, api_key=api_key) if api_key else None
        self.provider = provider

    async def research_company(
        self,
        company_name: str,
        company_website: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Research a company and provide interview preparation insights.

        Args:
            company_name: Name of the company
            company_website: Optional company website URL

        Returns:
            Dictionary with comprehensive company research
        """
        try:
            # Step 1: Gather company information from web
            company_data = await self._gather_company_info(company_name, company_website)

            # Step 2: Use LLM to analyze and create interview prep summary
            research = await self._llm_analyze(company_name, company_data)

            return {
                "success": True,
                "company_name": company_name,
                "research": research,
                "researched_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error researching company {company_name}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "company_name": company_name
            }

    async def _gather_company_info(
        self,
        company_name: str,
        website: Optional[str]
    ) -> str:
        """Gather company information from various sources."""

        gathered_info = []

        # Try to fetch company website
        if website:
            try:
                website_content = await self._fetch_and_extract(website)
                gathered_info.append(f"=== Company Website ===\n{website_content}")
            except Exception as e:
                logger.warning(f"Could not fetch company website: {e}")

        # Try to fetch LinkedIn company page
        try:
            linkedin_url = f"https://www.linkedin.com/company/{company_name.lower().replace(' ', '-')}"
            linkedin_content = await self._fetch_and_extract(linkedin_url)
            gathered_info.append(f"=== LinkedIn Page ===\n{linkedin_content}")
        except Exception as e:
            logger.warning(f"Could not fetch LinkedIn page: {e}")

        # If we got nothing, do a Google search to gather basic info
        if not gathered_info:
            try:
                search_url = f"https://www.google.com/search?q={company_name.replace(' ', '+')}+company+overview"
                search_content = await self._fetch_and_extract(search_url)
                gathered_info.append(f"=== Web Search Results ===\n{search_content}")
            except Exception as e:
                logger.warning(f"Could not perform web search: {e}")

        return "\n\n".join(gathered_info) if gathered_info else f"Limited information available for {company_name}"

    async def _fetch_and_extract(self, url: str) -> str:
        """Fetch URL and extract clean text content."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            # Parse HTML and extract text
            soup = BeautifulSoup(response.text, 'lxml')

            # Remove unwanted elements
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()

            # Get text
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = '\n'.join(chunk for chunk in chunks if chunk)

            # Limit size
            return text[:10000]  # ~2500 tokens

    async def _llm_analyze(self, company_name: str, raw_data: str) -> Dict[str, Any]:
        """Use configured LLM to analyze company data and create interview prep summary."""

        if not self.llm_service:
            raise ValueError("LLM service not initialized - API key required")

        prompt = f"""You are a career coach helping someone prepare for a job interview. Analyze the following information about {company_name} and create a comprehensive research summary.

Company Information:
{raw_data}

Create a structured research summary with the following sections:

1. COMPANY OVERVIEW (3-4 sentences)
   - What the company does
   - Industry and market position
   - Company size (if available)
   - Founded date and HQ location (if available)

2. RECENT NEWS & DEVELOPMENTS (last 6-12 months)
   - Funding rounds, acquisitions, or IPO
   - New product launches or major updates
   - Layoffs or hiring freezes
   - Awards or recognition
   - If no recent news found, say "No major news found"

3. CULTURE & VALUES
   - Work environment (remote, hybrid, in-office)
   - Company values or mission
   - Employee benefits (if mentioned)
   - Work-life balance indicators

4. TECH STACK (if applicable)
   - Technologies and tools they use
   - Programming languages
   - Cloud platforms
   - If tech company, mention their tech focus

5. INTERVIEW PREPARATION TIPS
   - 4-5 specific talking points to mention in interview
   - Questions to ask the interviewer
   - Key things this company values in candidates

6. QUICK FACTS
   - Employee count (approximate if exact not available)
   - Glassdoor rating (if found)
   - Recent funding amount (if found)
   - Notable clients or customers

Return the response as a JSON object with these sections:
{{
    "overview": "...",
    "recent_news": ["news item 1", "news item 2", ...],
    "culture": {{
        "work_environment": "...",
        "values": "...",
        "benefits": ["benefit 1", "benefit 2", ...]
    }},
    "tech_stack": ["tech 1", "tech 2", ...],
    "interview_tips": {{
        "talking_points": ["point 1", "point 2", ...],
        "questions_to_ask": ["question 1", "question 2", ...]
    }},
    "quick_facts": {{
        "employee_count": "...",
        "glassdoor_rating": "...",
        "funding": "...",
        "notable_clients": ["client 1", "client 2", ...]
    }}
}}

Important:
- If information is not available, use null or empty array
- Be specific and factual - only include what's clearly stated
- Focus on information useful for interview preparation
- Keep it concise but comprehensive

Return ONLY the JSON object, no other text."""

        try:
            # Create a temporary wrapper to match our prompt format
            # The LLMService expects job-related prompts, so we'll use raw extraction
            import anthropic
            import openai
            from google import generativeai as genai

            # Call the appropriate API based on provider
            if self.provider == "anthropic":
                client = anthropic.Anthropic(api_key=self.llm_service.provider.client.api_key)
                message = client.messages.create(
                    model=self.llm_service.provider.model,
                    max_tokens=3000,
                    temperature=0.3,
                    messages=[{"role": "user", "content": prompt}]
                )
                response_text = message.content[0].text.strip()

            elif self.provider == "openai" or self.provider == "openrouter":
                response = self.llm_service.provider.client.chat.completions.create(
                    model=self.llm_service.provider.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=3000,
                    temperature=0.3
                )
                response_text = response.choices[0].message.content.strip()

            elif self.provider == "google":
                generation_config = {
                    "max_output_tokens": 3000,
                    "temperature": 0.3,
                }
                response = self.llm_service.provider.model.generate_content(
                    prompt,
                    generation_config=generation_config
                )
                response_text = response.text.strip()

            else:
                raise ValueError(f"Unsupported provider: {self.provider}")

            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]

            # Parse JSON
            research_data = json.loads(response_text.strip())

            return research_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.error(f"Response was: {response_text[:500]}")
            raise ValueError("Could not parse company research data")

        except Exception as e:
            logger.error(f"LLM analysis failed ({self.provider}): {e}")
            raise


# Singleton instances per provider
_research_services = {}

def get_company_researcher(provider: str = "anthropic", api_key: Optional[str] = None) -> CompanyResearchService:
    """
    Get or create a company research service instance for the specified provider.

    Args:
        provider: LLM provider (anthropic, openai, google, openrouter)
        api_key: API key for the provider

    Returns:
        CompanyResearchService instance
    """
    if not api_key:
        raise ValueError(f"API key required for {provider}")

    cache_key = f"{provider}:{api_key[:8]}"  # Cache by provider and partial key

    if cache_key not in _research_services:
        _research_services[cache_key] = CompanyResearchService(provider=provider, api_key=api_key)

    return _research_services[cache_key]
