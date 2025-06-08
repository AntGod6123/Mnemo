from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
import io
import pdfkit
import re
from routes.zim_loader import get_zim_metadata, get_article

router = APIRouter()

@router.get("/zim/list")
def list_zims():
    return {"zims": get_zim_metadata()}


@router.get("/article/{zim_id}/{path:path}", response_class=HTMLResponse)
def get_article_html(zim_id: str, path: str):
    article = get_article(zim_id, path)
    if article:
        sanitized = re.sub(r"<script.*?>.*?</script>", "", article.content or "", flags=re.DOTALL | re.IGNORECASE)
        return HTMLResponse(
            sanitized,
            headers={"Content-Security-Policy": "default-src 'self'"}
        )
    raise HTTPException(status_code=404, detail="Article not found")


@router.get("/article/{zim_id}/{path:path}/pdf")
def get_article_pdf(zim_id: str, path: str):
    """Return the requested article rendered as a PDF file."""
    article = get_article(zim_id, path)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    pdf_bytes = pdfkit.from_string(article.content or "", False)
    filename = path.split("/")[-1] or "article"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}.pdf"},
    )
