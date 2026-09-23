import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from app.config import BASE_DIR
from app.database import get_db
from app.deps import get_current_user
from app.listings import opportunity_query
from app.models import (
    Application,
    ApplicationStatus,
    Bookmark,
    Notification,
    NotificationType,
    Opportunity,
    Report,
    User,
)
from app.present import present_card, user_context
from app.schemas import (
    ApplicationIn,
    ApplicationOut,
    ApplicationUpdate,
    BookmarkIn,
    MessageOut,
    NotificationOut,
    OnboardingIn,
    OpportunityCard,
    ProfileUpdate,
    PublicUserOut,
    ReportIn,
    UserOut,
)
from app.services.recommend import ranked_opportunities
from app.utils import clean_list, ensure_application_status

router = APIRouter(prefix="/api", tags=["account"])
UPLOAD_DIR = BASE_DIR / "uploads"
ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


def _apply_profile(user: User, data: dict) -> None:
    list_fields = {"skills", "interests", "preferred_categories", "preferred_locations"}
    for key, value in data.items():
        if key in list_fields:
            setattr(user, key, clean_list(value))
        elif isinstance(value, str):
            setattr(user, key, value.strip())
        else:
            setattr(user, key, value)
    user.updated_at = datetime.now(timezone.utc)


@router.get("/profile", response_model=UserOut)
def profile(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/profile", response_model=UserOut)
def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    _apply_profile(user, payload.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/profile/onboarding", response_model=UserOut)
def onboarding(payload: OnboardingIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    data = payload.model_dump()
    if not data.get("location"):
        data["location"] = data["preferred_locations"][0]
    _apply_profile(user, data)
    user.onboarding_complete = True
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.post("/profile/avatar", response_model=UserOut)
async def avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    suffix = ALLOWED.get(file.content_type or "")
    if suffix is None:
        raise HTTPException(status_code=422, detail="Upload a JPG, PNG, WEBP, or GIF image")
    content = await file.read()
    if len(content) > 2_000_000:
        raise HTTPException(status_code=422, detail="Image must be under 2 MB")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{suffix}"
    (UPLOAD_DIR / filename).write_bytes(content)
    user.profile_image = f"/uploads/{filename}"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/users/{username}", response_model=PublicUserOut)
def public_profile(username: str, db: Session = Depends(get_db)) -> PublicUserOut:
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    return PublicUserOut(
        username=user.username,
        full_name=user.full_name,
        profile_image=user.profile_image,
        location=user.location,
        university=user.university,
        faculty=user.faculty,
        department=user.department,
        graduation_year=user.graduation_year,
        education_level=user.education_level,
        skills=user.skills or [],
        interests=user.interests or [],
        bio=user.bio,
        role=user.role,
    )


@router.get("/bookmarks", response_model=list[OpportunityCard])
def bookmarks(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[OpportunityCard]:
    rows = (
        db.query(Bookmark)
        .options(
            selectinload(Bookmark.opportunity).selectinload(Opportunity.organization),
            selectinload(Bookmark.opportunity).selectinload(Opportunity.category),
        )
        .filter(Bookmark.user_id == user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    _, apps = user_context(db, user.id)
    ids = {row.opportunity_id for row in rows}
    return [present_card(row.opportunity, ids, apps) for row in rows]


@router.post("/bookmarks", response_model=MessageOut)
def add_bookmark(payload: BookmarkIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageOut:
    opp = db.get(Opportunity, payload.opportunity_id)
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    existing = db.query(Bookmark).filter(Bookmark.user_id == user.id, Bookmark.opportunity_id == opp.id).first()
    if existing is None:
        db.add(Bookmark(user_id=user.id, opportunity_id=opp.id))
        db.commit()
    return MessageOut(message="Saved")


@router.delete("/bookmarks/{opportunity_id}", response_model=MessageOut)
def remove_bookmark(opportunity_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageOut:
    row = db.query(Bookmark).filter(Bookmark.user_id == user.id, Bookmark.opportunity_id == opportunity_id).first()
    if row is not None:
        db.delete(row)
        db.commit()
    return MessageOut(message="Removed")


def _applications(db: Session, user_id: str) -> list[Application]:
    return (
        db.query(Application)
        .options(
            selectinload(Application.opportunity).selectinload(Opportunity.organization),
            selectinload(Application.opportunity).selectinload(Opportunity.category),
        )
        .filter(Application.user_id == user_id)
        .all()
    )


def _present_application(row: Application, bookmarks: set[str]) -> ApplicationOut:
    return ApplicationOut(
        id=row.id,
        status=row.status,
        notes=row.notes or "",
        applied_at=row.applied_at,
        updated_at=row.updated_at,
        opportunity=present_card(row.opportunity, bookmarks, {row.opportunity_id: row.status}),
    )


@router.get("/applications", response_model=list[ApplicationOut])
def applications(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ApplicationOut]:
    bookmarks, _ = user_context(db, user.id)
    return [_present_application(row, bookmarks) for row in _applications(db, user.id)]


@router.post("/applications", response_model=ApplicationOut)
def track(payload: ApplicationIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ApplicationOut:
    status = ensure_application_status(payload.status)
    opp = opportunity_query(db).filter(Opportunity.id == payload.opportunity_id).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    row = db.query(Application).filter(Application.user_id == user.id, Application.opportunity_id == opp.id).first()
    if row is None:
        row = Application(user_id=user.id, opportunity_id=opp.id, status=status, notes=payload.notes.strip())
        db.add(row)
    else:
        row.status = status
        if payload.notes:
            row.notes = payload.notes.strip()
    if status in {
        ApplicationStatus.APPLIED.value,
        ApplicationStatus.INTERVIEW.value,
        ApplicationStatus.ACCEPTED.value,
        ApplicationStatus.REJECTED.value,
    } and row.applied_at is None:
        row.applied_at = datetime.now(timezone.utc)
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    row = _applications(db, user.id)
    match = next(item for item in row if item.opportunity_id == opp.id)
    bookmarks, _ = user_context(db, user.id)
    return _present_application(match, bookmarks)


@router.patch("/applications/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationOut:
    row = db.query(Application).filter(Application.id == application_id, Application.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if payload.status is not None:
        row.status = ensure_application_status(payload.status)
        if row.status in {
            ApplicationStatus.APPLIED.value,
            ApplicationStatus.INTERVIEW.value,
            ApplicationStatus.ACCEPTED.value,
            ApplicationStatus.REJECTED.value,
        } and row.applied_at is None:
            row.applied_at = datetime.now(timezone.utc)
    if payload.notes is not None:
        row.notes = payload.notes.strip()
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    loaded = next(item for item in _applications(db, user.id) if item.id == row.id)
    bookmarks, _ = user_context(db, user.id)
    return _present_application(loaded, bookmarks)


@router.get("/notifications", response_model=list[NotificationOut])
def notifications(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/notifications/unread-count")
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).count()
    return {"count": count}


@router.post("/notifications/{notification_id}/read", response_model=MessageOut)
def mark_read(notification_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageOut:
    row = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    return MessageOut(message="Read")


@router.post("/notifications/read-all", response_model=MessageOut)
def read_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageOut:
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).update({Notification.is_read: True})
    db.commit()
    return MessageOut(message="All read")


@router.get("/recommendations", response_model=list[OpportunityCard])
def recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[OpportunityCard]:
    ranked = ranked_opportunities(db, user, limit=8)
    bookmarks, apps = user_context(db, user.id)
    return [present_card(opp, bookmarks, apps, reason=reason) for opp, reason in ranked]


@router.post("/reports", response_model=MessageOut)
def report(payload: ReportIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageOut:
    opp = db.get(Opportunity, payload.opportunity_id)
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db.add(
        Report(
            user_id=user.id,
            opportunity_id=opp.id,
            reason=payload.reason.strip(),
            description=payload.description.strip(),
        )
    )
    db.add(
        Notification(
            user_id=user.id,
            title="Report received",
            message=f"Thanks for flagging {opp.title}. An admin will review it.",
            type=NotificationType.SYSTEM.value,
            link=f"/opportunities/{opp.slug}",
        )
    )
    db.commit()
    return MessageOut(message="Report sent")
