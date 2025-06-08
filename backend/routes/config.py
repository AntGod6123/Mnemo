# config.py - Admin configurable settings (ZIM directory)
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import json
import os
from routes.zim_loader import load_zim_files
import argostranslate.package as argos_pkg
from .auth import get_session_username
from logger import logger

CONFIG_PATH = "./data/config.json"
router = APIRouter()

class ConfigModel(BaseModel):
    zim_dir: str
    llm_enabled: bool = False
    llm_url: str = "http://localhost:11434/api/generate"
    llm_api_key: str | None = None
    zim_overrides: dict[str, dict[str, str]] = {}

def load_config():
    if not os.path.exists(CONFIG_PATH):
        return {
            "zim_dir": "/data/zim",
            "llm_enabled": False,
            "llm_url": "http://localhost:11434/api/generate",
            "llm_api_key": "",
            "zim_overrides": {}
        }
    with open(CONFIG_PATH) as f:
        data = json.load(f)
        data.setdefault("zim_overrides", {})
        return data

def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/admin/config")
def get_config():
    return load_config()

@router.post("/admin/config")
def update_config(config: ConfigModel, request: Request):
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    save_config(config.dict())
    logger.info("Configuration updated")
    load_zim_files()  # dynamically reload ZIMs
    return {"message": "Config updated and ZIMs reloaded", "config": config}


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
