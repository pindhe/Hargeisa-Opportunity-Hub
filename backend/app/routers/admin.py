from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.listings import filter_opportunities, opportunity_query, sort_opportunities
from app.models import (
    Application,
    Category,
    Notification,
    NotificationType,
    Opportunity,
    OpportunityStatus,
    Organization,
    Report,
    Role,
    Setting,
    User,
)
from app.present import category_out, organization_out, present_card, present_detail, user_context
from app.schemas import (
    AdminUserUpdate,
    AnalyticsOut,
    ApplicationOut,
    CategoryIn,
    CategoryOut,
    MessageOut,
    NotificationCreate,
    OpportunityDetail,
    OpportunityIn,
    OrganizationIn,
    OrganizationOut,
    PageOut,
    ReportOut,
    SettingsOut,
    UserOut,
)
from app.utils import clean_list, ensure_http_url, ensure_notification_type, ensure_role, ensure_status, ensure_type, slugify, unique_slug

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _media(url: str | None) -> str | None:
    if not url or not url.strip():
        return None
    cleaned = url.strip()
    if cleaned.startswith(("/uploads/", "/orgs/")) or cleaned.startswith(("http://", "https://")):
        return cleaned
    raise HTTPException(status_code=422, detail="Image must be an http(s) URL")


def _fill(opp: Opportunity, payload: OpportunityIn, db: Session) -> None:
    if db.get(Organization, payload.organization_id) is None:
        raise HTTPException(status_code=422, detail="Select an organization")
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=422, detail="Select a category")
    opp.title = payload.title.strip()
    opp.slug = unique_slug(db, Opportunity, payload.title, opp.id)
    opp.short_description = payload.short_description.strip()
    opp.description = payload.description.strip()
    opp.organization_id = payload.organization_id
    opp.category_id = payload.category_id
    opp.opportunity_type = ensure_type(payload.opportunity_type)
    opp.location = payload.location.strip()
    opp.country = payload.country.strip()
    opp.is_remote = payload.is_remote
    opp.eligibility = payload.eligibility.strip()
    opp.requirements = payload.requirements.strip()
    opp.benefits = payload.benefits.strip()
    opp.application_url = ensure_http_url(payload.application_url)
    opp.deadline = payload.deadline
    opp.start_date = payload.start_date
    opp.end_date = payload.end_date
    opp.image = _media(payload.image)
    opp.tags = clean_list(payload.tags)
    opp.skills = clean_list(payload.skills)
    opp.education_levels = clean_list(payload.education_levels)
    opp.featured = payload.featured
    opp.status = ensure_status(payload.status)
    opp.updated_at = datetime.now(timezone.utc)


def _notify_match(db: Session, opp: Opportunity) -> None:
    users = db.query(User).filter(User.role != Role.ADMIN.value, User.onboarding_complete.is_(True)).all()
    for person in users:
        if opp.opportunity_type in (person.preferred_categories or []):
            db.add(
                Notification(
                    user_id=person.id,
                    title="New opportunity",
                    message=f"{opp.title} was just published in {opp.category.name if opp.category else 'HOH'}.",
                    type=NotificationType.NEW_OPPORTUNITY.value,
                    link=f"/opportunities/{opp.slug}",
                )
            )


def _month_keys(count: int = 6) -> list[str]:
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month
    keys: list[str] = []
    for _ in range(count):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(keys))


def _month(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.strftime("%Y-%m")


@router.get("/analytics", response_model=AnalyticsOut)
def analytics(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> AnalyticsOut:
    opportunities = db.query(Opportunity).all()
    users = db.query(User).all()
    applications = db.query(Application).all()
    active = sum(1 for item in opportunities if item.status == OpportunityStatus.APPROVED.value)
    expired = sum(1 for item in opportunities if item.status == OpportunityStatus.EXPIRED.value)
    by_category: dict[str, int] = {}
    popularity: dict[str, int] = {}
    for item in opportunities:
        name = item.category.name if item.category else "Other"
        by_category[name] = by_category.get(name, 0) + 1
        popularity[name] = popularity.get(name, 0) + item.views
    months = _month_keys()
    created = {key: 0 for key in months}
    registered = {key: 0 for key in months}
    for item in opportunities:
        key = _month(item.created_at)
        if key in created:
            created[key] += 1
    for person in users:
        key = _month(person.created_at)
        if key in registered:
            registered[key] += 1
    activity: dict[str, int] = {}
    for row in applications:
        activity[row.status] = activity.get(row.status, 0) + 1
    return AnalyticsOut(
        totals={
            "users": len(users),
            "opportunities": len(opportunities),
            "active": active,
            "expired": expired,
            "applications": len(applications),
            "organizations": db.query(Organization).count(),
        },
        by_category=[{"name": name, "count": count} for name, count in sorted(by_category.items())],
        by_month=[{"month": key, "count": created[key]} for key in months],
        registrations=[{"month": key, "count": registered[key]} for key in months],
        application_activity=[{"status": status, "count": count} for status, count in activity.items()],
        popular_categories=[
            {"name": name, "count": count} for name, count in sorted(popularity.items(), key=lambda item: item[1], reverse=True)[:6]
        ],
    )


@router.get("/opportunities", response_model=PageOut)
def admin_opportunities(
    q: str | None = None,
    status: str | None = None,
    category: str | None = None,
    type: str | None = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> PageOut:
    items = sort_opportunities(
        db,
        filter_opportunities(db, q=q, status=status, category=category, opportunity_type=type, public=False),
        "latest",
        admin,
    )
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)
    start = (page - 1) * page_size
    bookmarks, apps = user_context(db, admin.id)
    return PageOut(
        items=[present_card(item, bookmarks, apps) for item in items[start : start + page_size]],
        total=len(items),
        page=page,
        page_size=page_size,
    )


@router.post("/opportunities", response_model=OpportunityDetail)
def create_opportunity(payload: OpportunityIn, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> OpportunityDetail:
    opp = Opportunity(title=payload.title.strip(), slug="pending", description=" ", short_description=" ", organization_id=payload.organization_id, category_id=payload.category_id, opportunity_type="JOB", location="Hargeisa", country="Somaliland", application_url="https://example.com")
    db.add(opp)
    db.flush()
    previous = None
    _fill(opp, payload, db)
    if opp.status == OpportunityStatus.APPROVED.value:
        db.flush()
        db.refresh(opp)
        _notify_match(db, opp)
    db.commit()
    loaded = opportunity_query(db).filter(Opportunity.id == opp.id).first()
    assert loaded is not None
    return present_detail(loaded, set(), {})


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityDetail)
def get_opportunity(opportunity_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> OpportunityDetail:
    opp = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return present_detail(opp, set(), {})


@router.patch("/opportunities/{opportunity_id}", response_model=OpportunityDetail)
def update_opportunity(
    opportunity_id: str,
    payload: OpportunityIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> OpportunityDetail:
    opp = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    was_approved = opp.status == OpportunityStatus.APPROVED.value
    _fill(opp, payload, db)
    if opp.status == OpportunityStatus.APPROVED.value and not was_approved:
        _notify_match(db, opp)
    db.commit()
    loaded = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    assert loaded is not None
    return present_detail(loaded, set(), {})


@router.delete("/opportunities/{opportunity_id}", response_model=MessageOut)
def delete_opportunity(opportunity_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> MessageOut:
    opp = db.get(Opportunity, opportunity_id)
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db.delete(opp)
    db.commit()
    return MessageOut(message="Deleted")


@router.post("/opportunities/{opportunity_id}/approve", response_model=OpportunityDetail)
def approve(opportunity_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> OpportunityDetail:
    opp = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    newly = opp.status != OpportunityStatus.APPROVED.value
    opp.status = OpportunityStatus.APPROVED.value
    if newly:
        _notify_match(db, opp)
    db.commit()
    loaded = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    assert loaded is not None
    return present_detail(loaded, set(), {})


@router.post("/opportunities/{opportunity_id}/reject", response_model=OpportunityDetail)
def reject(opportunity_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> OpportunityDetail:
    opp = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp.status = OpportunityStatus.REJECTED.value
    db.commit()
    loaded = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    assert loaded is not None
    return present_detail(loaded, set(), {})


@router.post("/opportunities/{opportunity_id}/feature", response_model=OpportunityDetail)
def feature(opportunity_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> OpportunityDetail:
    opp = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp.featured = not opp.featured
    db.commit()
    loaded = opportunity_query(db).filter(Opportunity.id == opportunity_id).first()
    assert loaded is not None
    return present_detail(loaded, set(), {})


@router.get("/organizations", response_model=list[OrganizationOut])
def organizations(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[OrganizationOut]:
    rows = db.query(Organization).order_by(Organization.name).all()
    return [organization_out(row, len(row.opportunities)) for row in rows]


@router.post("/organizations", response_model=OrganizationOut)
def create_organization(payload: OrganizationIn, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> OrganizationOut:
    row = Organization(
        name=payload.name.strip(),
        slug=unique_slug(db, Organization, payload.name),
        description=payload.description.strip(),
        website=_media(payload.website) if payload.website else None,
        email=payload.email,
        phone=payload.phone,
        location=payload.location,
        logo=_media(payload.logo),
        verified=payload.verified,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return organization_out(row, 0)


@router.patch("/organizations/{organization_id}", response_model=OrganizationOut)
def update_organization(
    organization_id: str,
    payload: OrganizationIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> OrganizationOut:
    row = db.get(Organization, organization_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    row.name = payload.name.strip()
    row.slug = unique_slug(db, Organization, payload.name, row.id)
    row.description = payload.description.strip()
    row.website = _media(payload.website) if payload.website else None
    row.email = payload.email
    row.phone = payload.phone
    row.location = payload.location
    row.logo = _media(payload.logo)
    row.verified = payload.verified
    db.commit()
    db.refresh(row)
    return organization_out(row, len(row.opportunities))


@router.delete("/organizations/{organization_id}", response_model=MessageOut)
def delete_organization(organization_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> MessageOut:
    row = db.get(Organization, organization_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if row.opportunities:
        raise HTTPException(status_code=400, detail="Remove this organization's opportunities first")
    db.delete(row)
    db.commit()
    return MessageOut(message="Deleted")


@router.get("/categories", response_model=list[CategoryOut])
def categories(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[CategoryOut]:
    return [category_out(row, len(row.opportunities)) for row in db.query(Category).order_by(Category.name).all()]


@router.post("/categories", response_model=CategoryOut)
def create_category(payload: CategoryIn, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> CategoryOut:
    row = Category(
        name=payload.name.strip(),
        slug=unique_slug(db, Category, payload.name),
        description=payload.description.strip(),
        icon=payload.icon.strip() or "Sparkles",
        color=payload.color.strip() or "#0C6B58",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return category_out(row, 0)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: str,
    payload: CategoryIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> CategoryOut:
    row = db.get(Category, category_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Category not found")
    row.name = payload.name.strip()
    row.slug = unique_slug(db, Category, payload.name, row.id)
    row.description = payload.description.strip()
    row.icon = payload.icon.strip() or "Sparkles"
    row.color = payload.color.strip() or "#0C6B58"
    db.commit()
    db.refresh(row)
    return category_out(row, len(row.opportunities))


@router.delete("/categories/{category_id}", response_model=MessageOut)
def delete_category(category_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> MessageOut:
    row = db.get(Category, category_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Category not found")
    if row.opportunities:
        raise HTTPException(status_code=400, detail="This category still has opportunities")
    db.delete(row)
    db.commit()
    return MessageOut(message="Deleted")


@router.get("/users", response_model=list[UserOut])
def users(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[UserOut]:
    return [UserOut.model_validate(row) for row in db.query(User).order_by(User.created_at.desc()).all()]


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
) -> UserOut:
    row = db.get(User, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role is not None:
        row.role = ensure_role(payload.role, allow_admin=True)
        if row.id == admin.id and row.role != Role.ADMIN.value:
            raise HTTPException(status_code=400, detail="You cannot remove your own admin access")
    if payload.is_verified is not None:
        row.is_verified = payload.is_verified
    db.commit()
    db.refresh(row)
    return UserOut.model_validate(row)


@router.delete("/users/{user_id}", response_model=MessageOut)
def delete_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)) -> MessageOut:
    row = db.get(User, user_id)
    if row is None:
        raise HTTPException(status_code=404, detail="User not found")
    if row.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    if row.role == Role.ADMIN.value:
        admins = db.query(User).filter(User.role == Role.ADMIN.value).count()
        if admins <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last admin")
    db.delete(row)
    db.commit()
    return MessageOut(message="Deleted")


@router.get("/applications")
def all_applications(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    rows = db.query(Application).order_by(Application.updated_at.desc()).all()
    return [
        {
            "id": row.id,
            "status": row.status,
            "notes": row.notes,
            "applied_at": row.applied_at,
            "updated_at": row.updated_at,
            "user_name": row.user.full_name,
            "user_email": row.user.email,
            "opportunity_title": row.opportunity.title,
            "opportunity_slug": row.opportunity.slug,
        }
        for row in rows
    ]


@router.get("/reports", response_model=list[ReportOut])
def reports(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[ReportOut]:
    rows = db.query(Report).order_by(Report.created_at.desc()).all()
    return [
        ReportOut(
            id=row.id,
            reason=row.reason,
            description=row.description,
            status=row.status,
            created_at=row.created_at,
            user_name=row.user.full_name,
            user_email=row.user.email,
            opportunity_title=row.opportunity.title,
            opportunity_slug=row.opportunity.slug,
        )
        for row in rows
    ]


@router.patch("/reports/{report_id}", response_model=MessageOut)
def update_report(report_id: str, status: str, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> MessageOut:
    row = db.get(Report, report_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if status not in {"OPEN", "REVIEWED", "DISMISSED"}:
        raise HTTPException(status_code=422, detail="Unknown report status")
    row.status = status
    db.commit()
    return MessageOut(message="Updated")


@router.post("/notifications", response_model=MessageOut)
def send_notification(payload: NotificationCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> MessageOut:
    kind = ensure_notification_type(payload.type)
    if payload.user_email:
        person = db.query(User).filter(User.email == payload.user_email.lower()).first()
        if person is None:
            raise HTTPException(status_code=404, detail="No user with that email")
        targets = [person]
    else:
        targets = db.query(User).filter(User.role != Role.ADMIN.value).all()
    for person in targets:
        db.add(Notification(user_id=person.id, title=payload.title.strip(), message=payload.message.strip(), type=kind))
    db.commit()
    return MessageOut(message=f"Sent to {len(targets)} user{'s' if len(targets) != 1 else ''}")


@router.get("/settings", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> SettingsOut:
    def value(key: str, default: str = "") -> str:
        row = db.get(Setting, key)
        return row.value if row else default

    return SettingsOut(
        site_name=value("site_name", "HOH — Hargeisa Opportunity Hub"),
        support_email=value("support_email"),
        announcement=value("announcement"),
    )


@router.put("/settings", response_model=SettingsOut)
def update_settings(payload: SettingsOut, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> SettingsOut:
    for key, raw in payload.model_dump().items():
        row = db.get(Setting, key)
        if row is None:
            db.add(Setting(key=key, value=raw or ""))
        else:
            row.value = raw or ""
    db.commit()
    return payload
