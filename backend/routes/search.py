from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import sqlite3
import json
from logger import logger
from routes.zim_loader import FTS_DB_PATH, get_zim_metadata

router = APIRouter()

@router.get("/search")
def search_articles(q: str = Query(..., min_length=1)):
    try:
        with sqlite3.connect("./cache/search_index.db") as conn:
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute(
                """
            SELECT zim_id, title, path
            FROM articles
            WHERE articles MATCH ?
            LIMIT 50
            """,
                (q,),
            )
            rows = cur.fetchall()
    except sqlite3.OperationalError as e:
        logger.warning(f"Search query failed: {e}")
        return {"results": []}

    return {
        "results": [
            {
                "zim_id": row["zim_id"],
                "title": row["title"],
                "path": row["path"],
            }
            for row in rows
        ]
    }


@router.get("/search/stream")
def search_stream(q: str = Query(..., min_length=1)):
    """Yield search results sequentially for each ZIM archive."""

    def generate():
        try:
            conn = sqlite3.connect(FTS_DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            zims = [m["file"] for m in get_zim_metadata()]
            for zim in zims:
                cur.execute(
                    "SELECT zim_id, title, path FROM articles WHERE zim_id=? AND articles MATCH ? LIMIT 50",
                    (zim, q),
                )
                for row in cur.fetchall():
                    data = {
                        "zim_id": row["zim_id"],
                        "title": row["title"],
                        "path": row["path"],
                    }
                    yield f"data: {json.dumps(data)}\n\n"
        except sqlite3.OperationalError as e:
            logger.warning(f"Search query failed: {e}")
        finally:
            yield "event: end\ndata: done\n\n"
            if 'conn' in locals():
                conn.close()

    return StreamingResponse(generate(), media_type="text/event-stream")
