"""
Resume Parser Service
Extracts text from PDF resumes and uses LLM to parse into structured data.
"""

import json
import re
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
from io import BytesIO

import pdfplumber
from anthropic import Anthropic


@dataclass
class ResumeData:
    """Structured resume data matching frontend expectations."""
    name: str = ""
    email: str = ""
    location: str = ""
    summary: str = ""
    experiences: List[Dict[str, Any]] = field(default_factory=list)
    technical_skills: List[str] = field(default_factory=list)
    soft_skills: List[str] = field(default_factory=list)
    education: List[Dict[str, Any]] = field(default_factory=list)
    projects: List[Dict[str, Any]] = field(default_factory=list)
    certifications: List[str] = field(default_factory=list)
    total_years_experience: int = 0
    industries: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ResumeParser:
    """Parses PDF resumes into structured data using LLM."""

    def __init__(self, api_key: str):
        """Initialize with Anthropic API key."""
        self.client = Anthropic(api_key=api_key)

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extract text content from PDF bytes."""
        text_parts = []

        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)

        return "\n\n".join(text_parts)

    def parse_resume(self, pdf_bytes: bytes) -> ResumeData:
        """Parse PDF resume into structured ResumeData."""
        # Extract text from PDF
        raw_text = self.extract_text_from_pdf(pdf_bytes)

        if not raw_text.strip():
            raise ValueError("Could not extract text from PDF. The file may be image-based or corrupted.")

        # Use LLM to parse into structured format
        structured_data = self._llm_parse(raw_text)

        return structured_data

    def _llm_parse(self, resume_text: str) -> ResumeData:
        """Use Claude to parse resume text into structured data."""

        prompt = f"""Parse the following resume text into a structured JSON format.

Resume Text:
---
{resume_text}
---

Extract and return a JSON object with these fields:
{{
    "name": "Full name of the candidate",
    "email": "Email address",
    "location": "City, State or location",
    "summary": "Professional summary or objective if present, otherwise empty string",
    "experiences": [
        {{
            "company": "Company name",
            "title": "Job title",
            "duration": "e.g., Jan 2020 - Present",
            "bullets": ["Achievement or responsibility 1", "Achievement 2", ...]
        }}
    ],
    "technical_skills": ["Skill 1", "Skill 2", ...],
    "soft_skills": ["Leadership", "Communication", ...],
    "education": [
        {{
            "institution": "University name",
            "degree": "Degree type and major",
            "year": "Graduation year or date range"
        }}
    ],
    "projects": [
        {{
            "name": "Project name",
            "description": "Brief description",
            "technologies": ["Tech 1", "Tech 2"]
        }}
    ],
    "certifications": ["Certification 1", "Certification 2", ...],
    "total_years_experience": 5,
    "industries": ["Industry 1", "Industry 2", ...]
}}

Important instructions:
1. Extract ALL technical skills mentioned anywhere in the resume (skills sections, experience bullets, projects)
2. For soft_skills, infer from context (leadership roles, collaboration mentions, etc.)
3. Calculate total_years_experience by summing up work experience durations
4. Infer industries from company types and job roles
5. If a field cannot be determined, use empty string for strings, empty array for lists, 0 for numbers
6. Return ONLY valid JSON, no additional text or markdown formatting

JSON Output:"""

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract text content from response
        response_text = response.content[0].text.strip()

        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```"):
            # Remove opening code block
            response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
            # Remove closing code block
            response_text = re.sub(r'\n?```$', '', response_text)

        try:
            data = json.loads(response_text)
        except json.JSONDecodeError as e:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                data = json.loads(json_match.group())
            else:
                raise ValueError(f"Failed to parse LLM response as JSON: {e}")

        # Create ResumeData from parsed JSON
        return ResumeData(
            name=data.get("name", ""),
            email=data.get("email", ""),
            location=data.get("location", ""),
            summary=data.get("summary", ""),
            experiences=data.get("experiences", []),
            technical_skills=data.get("technical_skills", []),
            soft_skills=data.get("soft_skills", []),
            education=data.get("education", []),
            projects=data.get("projects", []),
            certifications=data.get("certifications", []),
            total_years_experience=data.get("total_years_experience", 0),
            industries=data.get("industries", [])
        )
