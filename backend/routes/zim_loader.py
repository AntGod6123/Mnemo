# zim_loader.py - Load and index ZIM files with cache and FTS indexing
import os
import json
import sqlite3
from libzim.reader import Archive


class Article:
    def __init__(self, title: str, url: str, content: str):
        self.title = title
        self.url = url
        self.content = content


class ZIMReader:
    def __init__(self, filename: str):
        self.archive = Archive(filename)
        keys = set(self.archive.metadata_keys)
        self.title = self._get_meta(keys, "Title") or self._get_meta(keys, "Name") or filename
        self.language = self._get_meta(keys, "Language") or ""

    def _get_meta(self, keys, key):
        if key in keys:
            try:
                return self.archive.get_metadata(key).decode("utf-8", "ignore")
            except Exception:
                return None
        return None

    def articles(self):
        for idx in range(self.archive.article_count):
            try:
                entry = self.archive._get_entry_by_id(idx)
                if entry.is_redirect:
                    continue
                item = entry.get_item()
                content = item.content.tobytes().decode("utf-8", "ignore")
                yield Article(entry.title, entry.path, content)
            except Exception:
                continue

    def get_article(self, path: str):
        try:
            entry = self.archive.get_entry_by_path(path)
            item = entry.get_item()
            content = item.content.tobytes().decode("utf-8", "ignore")
            return Article(entry.title, entry.path, content)
        except Exception:
            return None
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

def rebuild_search_index(zim_id, reader):
    """Rebuild the FTS search index for a ZIM reader.

    Articles are streamed lazily from the reader to avoid large
    memory usage when indexing massive collections.

    Returns the number of indexed articles.
    """
    os.makedirs("./cache", exist_ok=True)
    conn = sqlite3.connect(FTS_DB_PATH)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS articles USING fts5(
            zim_id, title, path
        )
        """
    )
    cur.execute("DELETE FROM articles WHERE zim_id = ?", (zim_id,))
    count = 0
    for art in reader.articles():
        cur.execute(
            "INSERT INTO articles (zim_id, title, path) VALUES (?, ?, ?)",
            (zim_id, art.title, art.url),
        )
        count += 1
    conn.commit()
    conn.close()
    return count

def load_zim_files():
    global ZIM_INDEX, ZIM_META
    with ZIM_LOCK:
        ZIM_INDEX.clear()
        ZIM_META.clear()

        config = load_config()
        zim_dir = Path(config.get("zim_dir", "/app/data/zim"))
        overrides = config.get("zim_overrides", {})

        if not zim_dir.exists():
            logger.error("ZIM directory not found")
            return

        meta_cache = []

        for zim_path in zim_dir.glob("*.zim"):
            try:
                reader = ZIMReader(str(zim_path))
                # Build the FTS search index lazily and determine article count
                count = rebuild_search_index(zim_path.name, reader)

                over = overrides.get(zim_path.name, {})
                zim_meta = {
                    "file": zim_path.name,
                    "title": over.get("title") or reader.title,
                    "lang": reader.language,
                    "count": count,
                }
                # Store only the reader and its metadata in memory
                ZIM_INDEX[zim_path.name] = {
                    "reader": reader,
                    "meta": zim_meta,
                }
                if "image" in over:
                    zim_meta["image"] = over["image"]
                meta_cache.append(zim_meta)
                ZIM_META.append(zim_meta)

                logger.info(f"Loaded {zim_path.name} with {count} articles")
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
