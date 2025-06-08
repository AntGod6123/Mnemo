from fastapi import APIRouter
from pydantic import BaseModel
import requests
from routes.zim_loader import get_article
from routes.config import load_config

router = APIRouter()


class LLMQuery(BaseModel):
    query: str
    context_path: str | None = None
    zim_id: str | None = None

@router.post("/llm/query")
def llm_query(data: LLMQuery):
    config = load_config()
    if not config.get("llm_enabled"):
        return {"answer": ""}
    llm_url = config.get("llm_url", "http://localhost:11434/api/generate")
    api_key = config.get("llm_api_key")
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

    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    try:
        res = requests.post(llm_url, json=payload, headers=headers)
        result = res.json()
        return {
            "answer": result.get("response", "").strip(),
            "source_titles": [],
            "source_urls": []
        }
    except Exception as e:
        return {"answer": f"LLM query failed: {str(e)}"}
