# zim_loader.py - Load and index ZIM files with cache and FTS indexing
import os
import json
import sqlite3
from libzim.reader import Archive
from threading import Lock, Thread


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
from logger import logger
from routes.config import load_config

ZIM_INDEX = {}
ZIM_META = []
ZIM_LOCK = Lock()
CACHE_PATH = "./cache/zim_index.json"
FTS_DB_PATH = "./cache/search_index.db"

def save_cache(meta):
    os.makedirs("./cache", exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(meta, f, indent=2)

def try_load_cache():
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH) as f:
            return json.load(f)
    return []

def search_index_has_entries(zim_name: str) -> bool:
    if not os.path.exists(FTS_DB_PATH):
        return False
    conn = sqlite3.connect(FTS_DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM articles WHERE zim_id=? LIMIT 1", (zim_name,))
    row = cur.fetchone()
    conn.close()
    return row is not None

def index_up_to_date(zim_path: Path, meta: dict | None) -> bool:
    if not meta:
        return False
    return (
        meta.get("mtime") == zim_path.stat().st_mtime
        and meta.get("size") == zim_path.stat().st_size
        and search_index_has_entries(zim_path.name)
    )

def _index_thread(zim_name: str, reader: "ZIMReader", meta: dict, cache: dict):
    count = rebuild_search_index(zim_name, reader)
    with ZIM_LOCK:
        meta["count"] = count
        cache[zim_name] = meta
        if zim_name in ZIM_INDEX:
            ZIM_INDEX[zim_name]["meta"]["count"] = count
        save_cache(list(cache.values()))
    logger.info(f"Indexed {zim_name} with {count} articles")

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

def load_zim_files(blocking: bool = False):
    """Load ZIM archives and rebuild their search indexes.

    When *blocking* is False, search index creation occurs in background
    threads so server startup is not delayed.
    """
    global ZIM_INDEX, ZIM_META

    cached = {m["file"]: m for m in try_load_cache()}
    meta_cache: dict[str, dict] = cached.copy()

    with ZIM_LOCK:
        ZIM_INDEX.clear()
        ZIM_META.clear()

        config = load_config()
        base_dir = Path(config.get("zim_dir", "/app/data/zim"))
        overrides = config.get("zim_overrides", {})

        dirs = [base_dir]
        if not base_dir.exists():
            logger.error(f"ZIM directory not found: {base_dir}")

        for directory in dirs:
            if not directory.exists():
                continue
            for zim_path in directory.glob("*.zim"):
                try:
                    reader = ZIMReader(str(zim_path))
                    over = overrides.get(zim_path.name, {})

                    cached_meta = cached.get(zim_path.name)
                    mtime = zim_path.stat().st_mtime
                    size = zim_path.stat().st_size

                    zim_meta = {
                        "file": zim_path.name,
                        "title": over.get("title") or reader.title,
                        "lang": reader.language,
                        "count": cached_meta.get("count", 0) if cached_meta else 0,
                        "mtime": mtime,
                        "size": size,
                    }

                    if "image" in over:
                        zim_meta["image"] = over["image"]

                    ZIM_INDEX[zim_path.name] = {
                        "reader": reader,
                        "meta": zim_meta,
                    }
                    ZIM_META.append(zim_meta)
                    meta_cache[zim_path.name] = zim_meta

                    if index_up_to_date(zim_path, cached_meta):
                        logger.info(f"Loaded {zim_path.name} (index up-to-date)")
                    else:
                        if blocking:
                            _index_thread(zim_path.name, reader, zim_meta, meta_cache)
                        else:
                            Thread(
                                target=_index_thread,
                                args=(zim_path.name, reader, zim_meta, meta_cache),
                                daemon=True,
                            ).start()
                        logger.info(f"Loaded {zim_path.name}; indexing queued")
                except Exception as e:
                    logger.error(f"Failed to load {zim_path.name}: {e}")

        save_cache(list(meta_cache.values()))

def get_zim_metadata():
    with ZIM_LOCK:
        return ZIM_META or try_load_cache()

def get_article(zim_id, path):
    with ZIM_LOCK:
        reader = ZIM_INDEX.get(zim_id, {}).get("reader")
        if reader:
            return reader.get_article(path)
    return None
