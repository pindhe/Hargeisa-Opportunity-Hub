from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_optional_user
from app.listings import filter_opportunities, opportunity_query, sort_opportunities
from app.models import Category, Opportunity, OpportunityStatus, Organization, Setting, User
from app.present import category_out, organization_out, present_card, present_detail, user_context
from app.present import days_remaining
from app.schemas import CategoryOut, HomeOut, OpportunityCard, OpportunityDetail, OrganizationOut, PageOut, SearchOut

router = APIRouter(prefix="/api", tags=["catalog"])

SUGGESTIONS = [
    "Software engineering internships",
    "Scholarships in Hargeisa",
    "Hackathons this month",
    "Remote AI courses",
    "Fellowships for graduates",
    "Volunteering in Somaliland",
]


def _counts(db: Session) -> tuple[dict[str, int], dict[str, int]]:
    category_rows = (
        db.query(Opportunity.category_id, func.count(Opportunity.id))
        .filter(Opportunity.status == OpportunityStatus.APPROVED.value)
        .group_by(Opportunity.category_id)
        .all()
    )
    org_rows = (
        db.query(Opportunity.organization_id, func.count(Opportunity.id))
        .filter(Opportunity.status == OpportunityStatus.APPROVED.value)
        .group_by(Opportunity.organization_id)
        .all()
    )
    return {key: value for key, value in category_rows}, {key: value for key, value in org_rows}


def _setting(db: Session, key: str) -> str:
    row = db.get(Setting, key)
    return row.value if row else ""


@router.get("/home", response_model=HomeOut)
def home(db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)) -> HomeOut:
    bookmarks, apps = user_context(db, user.id if user else None)
    category_counts, org_counts = _counts(db)
    approved = opportunity_query(db).filter(Opportunity.status == OpportunityStatus.APPROVED.value).all()
    open_items = []
    for item in approved:
        remaining = days_remaining(item.deadline)
        if remaining is None or remaining >= 0:
            open_items.append(item)
    latest = sorted(open_items, key=lambda item: item.created_at, reverse=True)[:6]
    closing = sorted(
        [item for item in open_items if item.deadline is not None],
        key=lambda item: item.deadline,
    )[:6]
    featured = [item for item in open_items if item.featured][:6]
    categories = [category_out(row, category_counts.get(row.id, 0)) for row in db.query(Category).order_by(Category.name).all()]
    organizations = [
        organization_out(row, org_counts.get(row.id, 0))
        for row in db.query(Organization).filter(Organization.verified.is_(True)).order_by(Organization.name).all()
    ]
    students = db.query(User).filter(User.role != "ADMIN").count()
    return HomeOut(
        stats={
            "opportunities": len(open_items),
            "organizations": db.query(Organization).count(),
            "students": students,
            "platforms": 1,
        },
        latest=[present_card(item, bookmarks, apps, counts=category_counts) for item in latest],
        closing_soon=[present_card(item, bookmarks, apps, counts=category_counts) for item in closing],
        featured=[present_card(item, bookmarks, apps, counts=category_counts) for item in featured],
        categories=categories,
        organizations=organizations,
        announcement=_setting(db, "announcement"),
    )


@router.get("/opportunities", response_model=PageOut)
def list_opportunities(
    q: str | None = None,
    category: str | None = None,
    type: str | None = Query(default=None, alias="type"),
    location: str | None = None,
    remote: bool | None = None,
    deadline: str | None = None,
    education_level: str | None = None,
    organization: str | None = None,
    skills: str | None = None,
    sort: str = "latest",
    featured: bool | None = None,
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> PageOut:
    items = filter_opportunities(
        db,
        q=q,
        category=category,
        opportunity_type=type,
        location=location,
        remote=remote,
        deadline=deadline,
        education_level=education_level,
        organization=organization,
        skills=skills,
        featured=featured,
        public=True,
    )
    items = sort_opportunities(db, items, sort, user)
    page = max(page, 1)
    page_size = min(max(page_size, 1), 48)
    start = (page - 1) * page_size
    bookmarks, apps = user_context(db, user.id if user else None)
    category_counts, _ = _counts(db)
    return PageOut(
        items=[present_card(item, bookmarks, apps, counts=category_counts) for item in items[start : start + page_size]],
        total=len(items),
        page=page,
        page_size=page_size,
    )


@router.get("/opportunities/{slug}", response_model=OpportunityDetail)
def opportunity_detail(slug: str, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)) -> OpportunityDetail:
    opp = opportunity_query(db).filter(Opportunity.slug == slug).first()
    if opp is None or (opp.status != OpportunityStatus.APPROVED.value and (user is None or user.role != "ADMIN")):
        raise HTTPException(status_code=404, detail="Opportunity not found")
    if opp.status == OpportunityStatus.APPROVED.value:
        opp.views += 1
        db.commit()
        db.refresh(opp)
    bookmarks, apps = user_context(db, user.id if user else None)
    return present_detail(opp, bookmarks, apps)


@router.get("/opportunities/{slug}/related", response_model=list[OpportunityCard])
def related(slug: str, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    opp = db.query(Opportunity).filter(Opportunity.slug == slug).first()
    if opp is None:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    items = filter_opportunities(db, public=True)
    ranked = [item for item in items if item.id != opp.id and (item.category_id == opp.category_id or item.opportunity_type == opp.opportunity_type)]
    bookmarks, apps = user_context(db, user.id if user else None)
    cards: list[OpportunityCard] = [present_card(item, bookmarks, apps) for item in ranked[:3]]
    return cards


@router.get("/categories", response_model=list[CategoryOut])
def categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    counts, _ = _counts(db)
    return [category_out(row, counts.get(row.id, 0)) for row in db.query(Category).order_by(Category.name).all()]


@router.get("/categories/{slug}", response_model=CategoryOut)
def category_detail(slug: str, db: Session = Depends(get_db)) -> CategoryOut:
    row = db.query(Category).filter(Category.slug == slug).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Category not found")
    counts, _ = _counts(db)
    return category_out(row, counts.get(row.id, 0))


@router.get("/organizations", response_model=list[OrganizationOut])
def organizations(db: Session = Depends(get_db)):
    _, counts = _counts(db)
    return [organization_out(row, counts.get(row.id, 0)) for row in db.query(Organization).order_by(Organization.name).all()]


@router.get("/organizations/{slug}")
def organization_detail(slug: str, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    row = db.query(Organization).filter(Organization.slug == slug).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    _, counts = _counts(db)
    items = filter_opportunities(db, organization=slug, public=True)
    bookmarks, apps = user_context(db, user.id if user else None)
    return {
        "organization": organization_out(row, counts.get(row.id, 0)),
        "opportunities": [present_card(item, bookmarks, apps) for item in items],
    }


@router.get("/search", response_model=SearchOut)
def search(
    q: str = "",
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> SearchOut:
    query = q.strip()
    bookmarks, apps = user_context(db, user.id if user else None)
    if not query:
        return SearchOut(query="", opportunities=[], organizations=[], related_categories=[], suggestions=SUGGESTIONS, total=0)
    items = sort_opportunities(db, filter_opportunities(db, q=query, public=True), "latest", user)
    like = f"%{query}%"
    orgs = db.query(Organization).filter(Organization.name.ilike(like)).limit(6).all()
    _, org_counts = _counts(db)
    category_counts, _ = _counts(db)
    related = []
    seen: set[str] = set()
    for item in items:
        if item.category_id not in seen:
            seen.add(item.category_id)
            related.append(category_out(item.category, category_counts.get(item.category_id, 0)))
    if not related:
        related = [
            category_out(row, category_counts.get(row.id, 0))
            for row in db.query(Category).filter(Category.name.ilike(like)).all()
        ]
    suggestions = [item for item in SUGGESTIONS if query.lower() not in item.lower()][:4]
    return SearchOut(
        query=query,
        opportunities=[present_card(item, bookmarks, apps, counts=category_counts) for item in items[:24]],
        organizations=[organization_out(row, org_counts.get(row.id, 0)) for row in orgs],
        related_categories=related[:6],
        suggestions=suggestions,
        total=len(items),
    )


@router.get("/settings")
def public_settings(db: Session = Depends(get_db)):
    return {
        "site_name": _setting(db, "site_name") or "HOH — Hargeisa Opportunity Hub",
        "support_email": _setting(db, "support_email"),
        "announcement": _setting(db, "announcement"),
    }


@router.get("/health")
def health():
    return {"status": "ok"}
