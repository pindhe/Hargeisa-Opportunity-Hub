from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import ForgotPasswordIn, LoginIn, MessageOut, RegisterIn, ResetPasswordIn, TokenOut, UserOut
from app.security import create_access_token, hash_password, hash_reset_token, new_reset_token, verify_password
from app.utils import ensure_role, unique_username

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    role = ensure_role(payload.role, allow_admin=False)
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(
        full_name=payload.full_name.strip(),
        username=unique_username(db, payload.full_name),
        email=email,
        password_hash=hash_password(payload.password),
        role=role,
        is_verified=True,
        skills=[],
        interests=[],
        preferred_categories=[],
        preferred_locations=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return TokenOut(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(payload: ForgotPasswordIn, db: Session = Depends(get_db)) -> MessageOut:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    token = None
    if user is not None:
        raw = new_reset_token()
        user.reset_token_hash = hash_reset_token(raw)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        if settings.is_development:
            token = raw
    return MessageOut(
        message="If that email is registered, a reset link is ready.",
        reset_token=token,
    )


@router.post("/reset-password", response_model=MessageOut)
def reset_password(payload: ResetPasswordIn, db: Session = Depends(get_db)) -> MessageOut:
    token_hash = hash_reset_token(payload.token)
    user = db.query(User).filter(User.reset_token_hash == token_hash).first()
    if user is None or user.reset_token_expires is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid")
    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link has expired")
    user.password_hash = hash_password(payload.password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.commit()
    return MessageOut(message="Password updated. You can sign in.")
