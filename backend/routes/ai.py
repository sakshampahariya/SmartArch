import json
import re

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

    prompt = f"Canvas context:\n{body.canvasDescription}\n\nUser request: {body.question}"
    try:
        raw = await get_architecture_suggestion(prompt)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {error}") from error

    # Detect canvas drawing response
    canvas_match = re.search(r"<CANVAS_JSON>(.*?)</CANVAS_JSON>", raw, re.DOTALL)
    if canvas_match:
        try:
            canvas_data = json.loads(canvas_match.group(1).strip())
            text_part = raw.replace(canvas_match.group(0), "").strip()
            return {
                "type": "canvas",
                "elements": canvas_data.get("elements", []),
                "title": canvas_data.get("title", "Diagram"),
                "suggestion": text_part or f"✅ '{canvas_data.get('title', 'Diagram')}' drawn on canvas!",
            }
        except json.JSONDecodeError:
            pass  # Fall through to text response

    return {"type": "text", "suggestion": raw}
