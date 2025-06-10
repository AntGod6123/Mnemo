# config.py - Admin configurable settings (ZIM directory)
from fastapi import APIRouter, Request, HTTPException, UploadFile
from pydantic import BaseModel
from typing import Optional
import json
import os
import shutil
import argostranslate.package as argos_pkg
from .auth import get_session_username
from logger import logger

CONFIG_PATH = "./data/config.json"
router = APIRouter()

class ConfigModel(BaseModel):
    zim_dir: str
    extra_zim_dirs: list[str] = []
    icon_dir: str = "./data/icons"
    session_timeout: int = 30
    llm_enabled: bool = False
    llm_url: str = "http://localhost:11434/api/generate"
    llm_api_key: str | None = None
    llm_model: str = "llama3"
    ldap_url: str | None = None
    sso_url: str | None = None
    zim_overrides: dict[str, dict[str, str]] = {}


class ConfigUpdateRequest(ConfigModel):
    move_existing: bool = False
    create_dirs: bool = False

def load_config():
    env_zim = os.getenv("ZIM_DIR")
    env_extra = os.getenv("EXTRA_ZIM_DIRS")
    env_icon = os.getenv("ICON_DIR")
    env_timeout = os.getenv("SESSION_TIMEOUT")

    defaults = {
        "zim_dir": env_zim or "/app/data/zim",
        "extra_zim_dirs": [d for d in (env_extra.split(":")) if d] if env_extra else [],
        "icon_dir": env_icon or "./data/icons",
        "session_timeout": int(env_timeout) if env_timeout else 30,
        "llm_enabled": False,
        "llm_url": "http://localhost:11434/api/generate",
        "llm_api_key": "",
        "llm_model": "llama3",
        "ldap_url": None,
        "sso_url": None,
        "zim_overrides": {},
    }

    if not os.path.exists(CONFIG_PATH):
        return defaults

    with open(CONFIG_PATH) as f:
        data = json.load(f)

    data.setdefault("zim_overrides", {})
    data.setdefault("llm_model", "llama3")
    data.setdefault("ldap_url", None)
    data.setdefault("sso_url", None)
    data.setdefault("icon_dir", defaults["icon_dir"])
    data.setdefault("extra_zim_dirs", defaults["extra_zim_dirs"])
    data.setdefault("session_timeout", 30)

    if env_zim:
        data["zim_dir"] = env_zim
    if env_extra:
        data["extra_zim_dirs"] = defaults["extra_zim_dirs"]
    if env_icon:
        data["icon_dir"] = env_icon
    if env_timeout:
        data["session_timeout"] = int(env_timeout)

    return data

def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/admin/config")
def get_config():
    return load_config()

@router.post("/admin/config")
def update_config(config: ConfigUpdateRequest, request: Request):
    from routes.zim_loader import load_zim_files
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    current = load_config()
    data = config.dict()
    move = data.pop("move_existing")
    create = data.pop("create_dirs")

    new_zim = data["zim_dir"]
    new_extra = data.get("extra_zim_dirs", [])
    new_icon = data.get("icon_dir", "./data/icons")

    if move:
        if current["zim_dir"] != new_zim:
            if not os.path.exists(new_zim):
                if create:
                    os.makedirs(new_zim, exist_ok=True)
                else:
                    raise HTTPException(status_code=400, detail="New ZIM directory missing")
            for file in os.listdir(current["zim_dir"]):
                if file.endswith(".zim"):
                    shutil.move(os.path.join(current["zim_dir"], file), os.path.join(new_zim, file))

        cur_extra = current.get("extra_zim_dirs", [])
        for idx, d in enumerate(new_extra):
            if not os.path.exists(d):
                if create:
                    os.makedirs(d, exist_ok=True)
                else:
                    raise HTTPException(status_code=400, detail="New ZIM directory missing")
            if idx < len(cur_extra) and cur_extra[idx] != d:
                if os.path.exists(cur_extra[idx]):
                    for f in os.listdir(cur_extra[idx]):
                        if f.endswith(".zim"):
                            shutil.move(os.path.join(cur_extra[idx], f), os.path.join(d, f))

        if current.get("icon_dir", "./data/icons") != new_icon:
            if not os.path.exists(new_icon):
                if create:
                    os.makedirs(new_icon, exist_ok=True)
                else:
                    raise HTTPException(status_code=400, detail="Icon directory missing")
            old_icon_dir = current.get("icon_dir", "./data/icons")
            if os.path.exists(old_icon_dir):
                for file in os.listdir(old_icon_dir):
                    shutil.move(os.path.join(old_icon_dir, file), os.path.join(new_icon, file))

    save_config(data)
    logger.info("Configuration updated")
    load_zim_files()  # dynamically reload ZIMs
    return {"message": "Config updated and ZIMs reloaded", "config": data}


@router.post("/admin/update-argos")
def update_argos(request: Request):
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        argos_pkg.update_package_index()
        for p in argos_pkg.get_available_packages():
            p.install()
        logger.info("Argos packages updated")
        return {"message": "Argos packages updated"}
    except Exception as e:
        logger.error(f"Argos update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/upload-icon")
async def upload_icon(file: UploadFile, request: Request):
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    config = load_config()
    directory = config.get("icon_dir", "./data/icons")
    os.makedirs(directory, exist_ok=True)
    filename = os.path.basename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]:
        raise HTTPException(status_code=400, detail="Invalid image type")
    with open(os.path.join(directory, filename), "wb") as f:
        f.write(await file.read())
    logger.info(f"Uploaded icon {filename}")
    return {"message": "Icon uploaded", "filename": filename}


@router.post("/admin/upload-zim")
async def upload_zim(file: UploadFile, request: Request):
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    config = load_config()
    directory = config.get("zim_dir", "./data/zim")
    if not os.path.exists(directory):
        raise HTTPException(status_code=400, detail="ZIM directory missing")
    filename = os.path.basename(file.filename)
    if not filename.endswith(".zim"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    with open(os.path.join(directory, filename), "wb") as f:
        f.write(await file.read())
    logger.info(f"Uploaded ZIM {filename}")
    from routes.zim_loader import load_zim_files
    load_zim_files()
    return {"message": "ZIM uploaded", "filename": filename}
