from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from routes.zim_loader import get_zim_metadata, get_article

router = APIRouter()

@router.get("/zim/list")
def list_zims():
    return {"zims": get_zim_metadata()}


@router.get("/article/{zim_id}/{path:path}", response_class=HTMLResponse)
def get_article_html(zim_id: str, path: str):
    article = get_article(zim_id, path)
    if article:
        return HTMLResponse(article.content or "")
    raise HTTPException(status_code=404, detail="Article not found")
