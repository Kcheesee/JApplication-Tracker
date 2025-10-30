from fastapi import APIRouter
from ..services.llm_service import LLMService

router = APIRouter(prefix="/api/llm", tags=["LLM"])


@router.get("/providers")
def get_llm_providers():
    """Get list of available LLM providers with metadata"""
    return {
        "success": True,
        "providers": LLMService.get_available_providers()
    }
