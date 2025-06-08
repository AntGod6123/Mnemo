from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel
import json
import os
import bcrypt
from itsdangerous import URLSafeSerializer, BadSignature
from logger import logger

router = APIRouter()

USERS_FILE = "./data/users.json"

# Signed session serializer
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable not set")
serializer = URLSafeSerializer(SECRET_KEY, salt="mnemo-session")


def create_token(username: str) -> str:
    """Create a signed session token for the given user."""
    return serializer.dumps(username)


def decode_token(token: str) -> str | None:
    """Return username if token is valid else None."""
    try:
        return serializer.loads(token)
    except BadSignature:
        return None


def get_session_username(request: Request) -> str | None:
    token = request.cookies.get("mnemo_session")
    if not token:
        return None
    return decode_token(token)

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login")
def login(data: LoginRequest, response: Response):
    if not os.path.exists(USERS_FILE):
        raise HTTPException(status_code=401, detail="No users defined")

    with open(USERS_FILE) as f:
        users = json.load(f)

    for user in users:
        if user["username"] == data.username:
            if bcrypt.checkpw(data.password.encode(), user["password"].encode()):
                token = create_token(user["username"])
                response.set_cookie("mnemo_session", token, httponly=True)
                logger.info(f"User {data.username} logged in")
                return {"message": "Login successful", "username": user["username"]}
    logger.warning(f"Failed login attempt for {data.username}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("mnemo_session")
    logger.info("User logged out")
    return {"message": "Logged out"}

@router.get("/auth/status")
def status(request: Request):
    username = get_session_username(request)
    if username:
        return {"logged_in": True, "username": username}
    return {"logged_in": False}
