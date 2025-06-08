# config.py - Admin configurable settings (ZIM directory)
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import json
import os
from routes.zim_loader import load_zim_files

CONFIG_PATH = "./data/config.json"
router = APIRouter()

class ConfigModel(BaseModel):
    zim_dir: str
    llm_enabled: bool = False
    llm_url: str = "http://localhost:11434/api/generate"
    llm_api_key: str | None = None

def load_config():
    if not os.path.exists(CONFIG_PATH):
        return {
            "zim_dir": "/data/zim",
            "llm_enabled": False,
            "llm_url": "http://localhost:11434/api/generate",
            "llm_api_key": ""
        }
    with open(CONFIG_PATH) as f:
        return json.load(f)

def save_config(data):
    with open(CONFIG_PATH, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/admin/config")
def get_config():
    return load_config()

@router.post("/admin/config")
def update_config(config: ConfigModel, request: Request):
    session = request.cookies.get("zim_admin")
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    save_config(config.dict())
    load_zim_files()  # dynamically reload ZIMs
    return {"message": "Config updated and ZIMs reloaded", "config": config}
