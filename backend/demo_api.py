"""Standalone API demo for Job Fit Analyzer - No DB required."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.analyzer import (
    AnalyzeRequest,
    AnalyzeResponse,
    TailorRequest,
    TailorResponse,
    QuickCheckRequest,
    QuickCheckResponse,
    RequirementMatchResponse,
    TailoringActionResponse,
)

app = FastAPI(
    title="Job Fit Analyzer API",
    description="AI-powered job posting analysis and resume matching",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Job Fit Analyzer API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "endpoints": [
            "POST /api/analyzer/analyze",
            "POST /api/analyzer/tailor",
            "POST /api/analyzer/quick-check"
        ]
    }

@app.post("/api/analyzer/analyze", response_model=AnalyzeResponse)
async def analyze_job_fit(request: AnalyzeRequest):
    """
    Analyze how well a resume fits a job posting.
    
    Returns match score, detailed breakdown, and recommendations.
    
    **Example Response**:
    - match_score: 0.84 (84% match)
    - match_label: "Good Match"
    - should_apply: true
    - matches: Detailed requirement breakdown
    - top_suggestions: Improvement recommendations
    """
    return AnalyzeResponse(
        match_score=0.84,
        match_label="Good Match (Demo)",
        should_apply=True,
        recommendation="DEMO: This is a sample response. Real analysis requires authentication.",
        matches=[
            RequirementMatchResponse(
                requirement_text="5+ years Python experience",
                category="experience",
                strength="strong",
                evidence=["8 years Python experience"],
                explanation="Exceeds requirement"
            )
        ],
        strong_matches=3,
        matches_count=2,
        partial_matches=1,
        gaps=1,
        dealbreakers=[],
        top_suggestions=["Add Kubernetes to skills"],
        missing_keywords=["kubernetes", "docker"]
    )

@app.post("/api/analyzer/tailor", response_model=TailorResponse)
async def generate_tailoring_plan(request: TailorRequest):
    """
    Generate a resume tailoring plan based on fit analysis.
    
    Returns specific actions to improve resume match.
    
    **Example Actions**:
    - Add missing technical skills
    - Modify experience bullets
    - Incorporate keywords
    - Update summary
    """
    return TailorResponse(
        job_title="Software Engineer (Demo)",
        company="TechCorp",
        current_score=0.65,
        projected_score=0.80,
        actions=[
            TailoringActionResponse(
                action_type="add_skill",
                section="Technical Skills",
                priority="high",
                suggestion="Add Kubernetes, Docker to skills section",
                example="Kubernetes, Docker, CI/CD"
            )
        ],
        keywords_to_add=["kubernetes", "docker"],
        suggested_summary=None,
        cover_letter_points=["Address experience gap in cover letter"]
    )

@app.post("/api/analyzer/quick-check", response_model=QuickCheckResponse)
async def quick_compatibility_check(request: QuickCheckRequest):
    """
    Quick compatibility check between job description and resume summary.
    
    Useful for filtering jobs before full analysis.
    
    **Use Case**: Quickly determine if a job is worth analyzing in detail.
    """
    return QuickCheckResponse(
        compatible=True,
        score=0.75,
        key_matches=["python", "api", "sql"],
        key_gaps=["kubernetes"],
        recommendation="Strong match - proceed with full analysis (Demo)"
    )

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "mode": "demo"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
