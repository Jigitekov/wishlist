from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from database import get_db
from models import User
from auth_utils import hash_password, verify_password, create_token, get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")
    user = User(email=body.email, hashed_password=hash_password(body.password), name=body.name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"token": create_token(str(user.id)), "user": {"id": str(user.id), "email": user.email, "name": user.name}}


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return {"token": create_token(str(user.id)), "user": {"id": str(user.id), "email": user.email, "name": user.name}}


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "name": user.name}
