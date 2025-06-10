from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel
import json
import os
import bcrypt
from itsdangerous import URLSafeSerializer, BadSignature
import time
from logger import logger

router = APIRouter()

USERS_FILE = "./data/users.json"

# Signed session serializer
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable not set")
serializer = URLSafeSerializer(SECRET_KEY, salt="mnemo-session")


def create_token(username: str, minutes: int) -> str:
    """Create a signed session token for the given user with expiry."""
    exp = int(time.time()) + minutes * 60
    return serializer.dumps({"u": username, "exp": exp})


def decode_token(token: str) -> str | None:
    """Return username if token is valid and not expired else None."""
    try:
        data = serializer.loads(token)
    except BadSignature:
        return None
    if isinstance(data, str):
        # old token without expiry
        return data
    exp = data.get("exp")
    if exp and time.time() > exp:
        return None
    return data.get("u")


def get_session_username(request: Request) -> str | None:
    token = request.cookies.get("mnemo_session")
    if not token:
        return None
    return decode_token(token)

class LoginRequest(BaseModel):
    username: str
    password: str


class AddUserRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login")
def login(data: LoginRequest, response: Response):
    from routes.config import load_config
    if not os.path.exists(USERS_FILE):
        raise HTTPException(status_code=401, detail="No users defined")

    with open(USERS_FILE) as f:
        users = json.load(f)

    for user in users:
        if user["username"] == data.username:
            if bcrypt.checkpw(data.password.encode(), user["password"].encode()):
                cfg = load_config()
                minutes = cfg.get("session_timeout", 30)
                token = create_token(user["username"], minutes)
                response.set_cookie(
                    "mnemo_session", token, httponly=True, max_age=minutes * 60
                )
                logger.info("User logged in")
                return {"message": "Login successful", "username": user["username"]}
    logger.warning("Failed login attempt")
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


@router.post("/admin/add-user")
def add_user(data: AddUserRequest, request: Request):
    session = get_session_username(request)
    if session != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    users = []
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE) as f:
            users = json.load(f)

    for user in users:
        if user["username"] == data.username:
            raise HTTPException(status_code=400, detail="User already exists")

    hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    users.append({"username": data.username, "password": hashed})
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

    logger.info(f"Added user {data.username}")
    return {"message": "User added"}
