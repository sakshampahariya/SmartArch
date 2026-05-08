from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.groq_service import get_architecture_suggestion

router = APIRouter(prefix="/api/ai", tags=["ai"])


class SuggestRequest(BaseModel):
    canvasDescription: str = ""
    question: str


@router.post("/suggest")
async def suggest(body: SuggestRequest):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question required")

    prompt = f"Architecture:\n{body.canvasDescription}\n\nQuestion: {body.question}"
    try:
        suggestion = await get_architecture_suggestion(prompt)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {error}") from error

    return {"suggestion": suggestion}
