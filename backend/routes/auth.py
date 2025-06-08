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
                response.set_cookie("zim_admin", "admin", httponly=True)
                return {"message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("zim_admin")
    return {"message": "Logged out"}
