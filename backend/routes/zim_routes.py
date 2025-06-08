from fastapi import APIRouter
from routes.zim_loader import get_zim_metadata

router = APIRouter()

@router.get("/zim/list")
def list_zims():
    return {"zims": get_zim_metadata()}
