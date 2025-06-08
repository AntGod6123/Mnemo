# zim_loader.py - Load and index ZIM files with cache and FTS indexing
import os
import json
import sqlite3
from pyzim.reader import ZIMReader
from pathlib import Path
from threading import Lock
from logger import logger

ZIM_INDEX = {}
ZIM_META = []
ZIM_LOCK = Lock()
CONFIG_PATH = "./data/config.json"
CACHE_PATH = "./cache/zim_index.json"
FTS_DB_PATH = "./cache/search_index.db"

def load_config():
    with open(CONFIG_PATH) as f:
        return json.load(f)

def save_cache(meta):
    os.makedirs("./cache", exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(meta, f, indent=2)

def try_load_cache():
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH) as f:
            return json.load(f)
    return []

def rebuild_search_index(zim_id, articles):
    os.makedirs("./cache", exist_ok=True)
    conn = sqlite3.connect(FTS_DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS articles USING fts5(
            zim_id, title, path
        )
    """)
    cur.execute("DELETE FROM articles WHERE zim_id = ?", (zim_id,))
    for art in articles:
        cur.execute("INSERT INTO articles (zim_id, title, path) VALUES (?, ?, ?)",
                    (zim_id, art.title, art.url))
    conn.commit()
    conn.close()

def load_zim_files():
    global ZIM_INDEX, ZIM_META
    with ZIM_LOCK:
        ZIM_INDEX.clear()
        ZIM_META.clear()

        config = load_config()
        zim_dir = Path(config.get("zim_dir", "/data/zim"))
        overrides = config.get("zim_overrides", {})

        if not zim_dir.exists():
            logger.error("ZIM directory not found")
            return

        meta_cache = []

        for zim_path in zim_dir.glob("*.zim"):
            try:
                reader = ZIMReader(str(zim_path))
                articles = list(reader.articles())
                ZIM_INDEX[zim_path.name] = {
                    "reader": reader,
                    "articles": articles
                }

                rebuild_search_index(zim_path.name, articles)

                over = overrides.get(zim_path.name, {})
                zim_meta = {
                    "file": zim_path.name,
                    "title": over.get("title") or reader.title,
                    "lang": reader.language,
                    "count": len(articles)
                }
                if "image" in over:
                    zim_meta["image"] = over["image"]
                meta_cache.append(zim_meta)
                ZIM_META.append(zim_meta)

                logger.info(f"Loaded {zim_path.name} with {len(articles)} articles")
            except Exception as e:
                logger.error(f"Failed to load {zim_path.name}: {e}")

        save_cache(meta_cache)

def get_zim_metadata():
    with ZIM_LOCK:
        return ZIM_META or try_load_cache()

def get_article(zim_id, path):
    with ZIM_LOCK:
        reader = ZIM_INDEX.get(zim_id, {}).get("reader")
        if reader:
            return reader.get_article(path)
    return None
