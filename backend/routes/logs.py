from fastapi import APIRouter, Request, HTTPException
import os
from .auth import get_session_username

LOG_FILE = "./data/server.log"

router = APIRouter()

@router.get("/admin/logs")
def read_logs(request: Request):
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if not os.path.exists(LOG_FILE):
        return {"logs": ""}
    with open(LOG_FILE) as f:
        lines = f.readlines()
    return {"logs": "".join(lines[-200:])}
