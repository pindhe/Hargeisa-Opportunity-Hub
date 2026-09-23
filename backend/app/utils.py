import re
import unicodedata

from fastapi import HTTPException

from app.models import OpportunityType, OpportunityStatus, ApplicationStatus, Role, NotificationType


def unique_slug(db, model, value: str, current_id: str | None = None) -> str:
    base = slugify(value)[:160] or "item"
    candidate = base
    number = 2
    while True:
        existing = db.query(model).filter(model.slug == candidate).first()
        if existing is None or existing.id == current_id:
            return candidate
        candidate = f"{base}-{number}"[:180]
        number += 1


def unique_username(db, full_name: str, current_id: str | None = None) -> str:
    base = slugify(full_name)[:60] or "user"
    candidate = base
    number = 2
    while True:
        existing = db.query(model_user()).filter_by(username=candidate).first()
        if existing is None or existing.id == current_id:
            return candidate
        candidate = f"{base}-{number}"[:80]
        number += 1


def model_user():
    from app.models import User

    return User


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return value[:180] or "item"


def clean_list(values: list[str] | None) -> list[str]:
    if not values:
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in values:
        text = " ".join(item.split()).strip()
        key = text.lower()
        if text and key not in seen:
            seen.add(key)
            cleaned.append(text[:80])
    return cleaned[:40]


def ensure_http_url(url: str) -> str:
    cleaned = url.strip()
    if not cleaned.startswith(("http://", "https://")):
        raise HTTPException(status_code=422, detail="Application URL must start with http:// or https://")
    return cleaned


def ensure_type(value: str) -> str:
    allowed = {item.value for item in OpportunityType}
    if value not in allowed:
        raise HTTPException(status_code=422, detail="Unknown opportunity type")
    return value


def ensure_status(value: str) -> str:
    allowed = {item.value for item in OpportunityStatus}
    if value not in allowed:
        raise HTTPException(status_code=422, detail="Unknown opportunity status")
    return value


def ensure_application_status(value: str) -> str:
    allowed = {item.value for item in ApplicationStatus}
    if value not in allowed:
        raise HTTPException(status_code=422, detail="Unknown application status")
    return value


def ensure_role(value: str, allow_admin: bool = False) -> str:
    allowed = {item.value for item in Role}
    if not allow_admin:
        allowed.discard(Role.ADMIN.value)
    if value not in allowed:
        raise HTTPException(status_code=422, detail="Unknown user role")
    return value


def ensure_notification_type(value: str) -> str:
    allowed = {item.value for item in NotificationType}
    if value not in allowed:
        raise HTTPException(status_code=422, detail="Unknown notification type")
    return value


def human_join(items: list[str]) -> str:
    unique: list[str] = []
    for item in items:
        if item not in unique:
            unique.append(item)
    if not unique:
        return ""
    if len(unique) == 1:
        return unique[0]
    if len(unique) == 2:
        return f"{unique[0]} and {unique[1]}"
    return ", ".join(unique[:-1]) + f", and {unique[-1]}"


TYPE_LABELS = {
    "SCHOLARSHIP": "Scholarships",
    "JOB": "Jobs",
    "INTERNSHIP": "Internships",
    "COURSE": "Courses",
    "TRAINING": "Training",
    "HACKATHON": "Hackathons",
    "COMPETITION": "Competitions",
    "FELLOWSHIP": "Fellowships",
    "VOLUNTEERING": "Volunteering",
    "EVENT": "Events",
}

LOCATION_GROUPS = {
    "hargeisa": ["hargeisa"],
    "somaliland": ["hargeisa", "borama", "berbera", "burao", "somaliland"],
    "somalia": ["mogadishu", "somalia", "somaliland", "hargeisa", "borama", "berbera", "burao"],
    "africa": ["somaliland", "somalia", "kenya", "africa", "hargeisa", "nairobi", "borama"],
    "international": ["international", "global", "abroad"],
    "remote": ["remote"],
}
