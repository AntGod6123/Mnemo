from fastapi import APIRouter, Request
from pydantic import BaseModel
import requests
from routes.zim_loader import get_article

router = APIRouter()

LLM_URL = "http://localhost:11434/api/generate"  # Ollama

class LLMQuery(BaseModel):
    query: str
    context_path: str | None = None
    zim_id: str | None = None

@router.post("/llm/query")
def llm_query(data: LLMQuery):
    context = ""

    if data.zim_id and data.context_path:
        article = get_article(data.zim_id, data.context_path)
        if article:
            context = article.content or ""

    payload = {
        "model": "llama3",  # or whatever model is loaded
        "prompt": f"{context}\n\nUser question: {data.query}",
        "stream": False
    }

    try:
        res = requests.post(LLM_URL, json=payload)
        result = res.json()
        return {
            "answer": result.get("response", "").strip(),
            "source_titles": [],
            "source_urls": []
        }
    except Exception as e:
        return {"answer": f"LLM query failed: {str(e)}"}
