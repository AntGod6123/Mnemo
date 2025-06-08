from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel
import json
import os
import bcrypt

router = APIRouter()

USERS_FILE = "./data/users.json"

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
                response.set_cookie("zim_admin", user["username"], httponly=True)
                return {"message": "Login successful", "username": user["username"]}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("zim_admin")
    return {"message": "Logged out"}

@router.get("/auth/status")
def status(request: Request):
    username = request.cookies.get("zim_admin")
    if username:
        return {"logged_in": True, "username": username}
    return {"logged_in": False}
