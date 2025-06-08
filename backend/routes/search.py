from fastapi import APIRouter, Query
import sqlite3

router = APIRouter()

@router.get("/search")
def search_articles(q: str = Query(..., min_length=1)):
    conn = sqlite3.connect("./cache/search_index.db")
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
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
    except sqlite3.OperationalError:
        rows = []
    finally:
        conn.close()

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
