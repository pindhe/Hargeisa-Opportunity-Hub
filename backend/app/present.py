from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Application, Bookmark, Category, Opportunity, Organization
from app.schemas import CategoryOut, OpportunityCard, OpportunityDetail, OrganizationBrief, OrganizationOut


def days_remaining(deadline: datetime | None) -> int | None:
    if deadline is None:
        return None
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    today = datetime.now(timezone.utc).date()
    return (deadline.date() - today).days


def category_out(category: Category, count: int = 0) -> CategoryOut:
    return CategoryOut(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        icon=category.icon,
        color=category.color,
        opportunity_count=count,
    )


def organization_brief(org: Organization) -> OrganizationBrief:
    return OrganizationBrief.model_validate(org)


def organization_out(org: Organization, count: int = 0) -> OrganizationOut:
    return OrganizationOut(
        id=org.id,
        name=org.name,
        slug=org.slug,
        logo=org.logo,
        verified=org.verified,
        location=org.location,
        description=org.description,
        website=org.website,
        email=org.email,
        phone=org.phone,
        created_at=org.created_at,
        opportunity_count=count,
    )


def user_context(db: Session, user_id: str | None) -> tuple[set[str], dict[str, str]]:
    if not user_id:
        return set(), {}
    bookmarks = {row.opportunity_id for row in db.query(Bookmark.opportunity_id).filter(Bookmark.user_id == user_id)}
    apps = {
        row.opportunity_id: row.status
        for row in db.query(Application.opportunity_id, Application.status).filter(Application.user_id == user_id)
    }
    return bookmarks, apps


def present_card(
    opp: Opportunity,
    bookmarks: set[str] | None = None,
    apps: dict[str, str] | None = None,
    reason: str | None = None,
    counts: dict[str, int] | None = None,
) -> OpportunityCard:
    bookmarks = bookmarks or set()
    apps = apps or {}
    counts = counts or {}
    return OpportunityCard(
        id=opp.id,
        title=opp.title,
        slug=opp.slug,
        short_description=opp.short_description,
        organization=organization_brief(opp.organization),
        category=category_out(opp.category, counts.get(opp.category_id, 0)),
        opportunity_type=opp.opportunity_type,
        location=opp.location,
        country=opp.country,
        is_remote=opp.is_remote,
        deadline=opp.deadline,
        image=opp.image,
        tags=opp.tags or [],
        skills=opp.skills or [],
        featured=opp.featured,
        status=opp.status,
        views=opp.views,
        created_at=opp.created_at,
        bookmarked=opp.id in bookmarks,
        application_status=apps.get(opp.id),
        days_remaining=days_remaining(opp.deadline),
        recommendation_reason=reason,
    )


def present_detail(
    opp: Opportunity,
    bookmarks: set[str],
    apps: dict[str, str],
) -> OpportunityDetail:
    card = present_card(opp, bookmarks, apps)
    return OpportunityDetail(
        **card.model_dump(),
        description=opp.description,
        eligibility=opp.eligibility,
        requirements=opp.requirements,
        benefits=opp.benefits,
        application_url=opp.application_url,
        start_date=opp.start_date,
        end_date=opp.end_date,
        education_levels=opp.education_levels or [],
        updated_at=opp.updated_at,
    )
