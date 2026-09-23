from datetime import datetime, timedelta, timezone

from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Query, Session, selectinload

from app.models import Category, Opportunity, OpportunityStatus, Organization, User
from app.present import days_remaining
from app.services.recommend import score_opportunity
from app.models import Application, Bookmark


def opportunity_query(db: Session) -> Query:
    return db.query(Opportunity).options(
        selectinload(Opportunity.organization),
        selectinload(Opportunity.category),
    )


def filter_opportunities(
    db: Session,
    *,
    q: str | None = None,
    category: str | None = None,
    opportunity_type: str | None = None,
    location: str | None = None,
    remote: bool | None = None,
    deadline: str | None = None,
    education_level: str | None = None,
    organization: str | None = None,
    skills: str | None = None,
    status: str | None = None,
    featured: bool | None = None,
    public: bool = True,
) -> list[Opportunity]:
    query = opportunity_query(db)
    if public:
        query = query.filter(Opportunity.status == OpportunityStatus.APPROVED.value)
    elif status:
        query = query.filter(Opportunity.status == status)
    if featured is not None:
        query = query.filter(Opportunity.featured.is_(featured))
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if organization:
        query = query.join(Organization).filter(Organization.slug == organization)
    if opportunity_type:
        query = query.filter(Opportunity.opportunity_type == opportunity_type)
    if location:
        like = f"%{location}%"
        query = query.filter(or_(Opportunity.location.ilike(like), Opportunity.country.ilike(like)))
    if remote is True:
        query = query.filter(Opportunity.is_remote.is_(True))
    if education_level:
        query = query.filter(cast(Opportunity.education_levels, String).ilike(f"%{education_level}%"))
    if skills:
        parts = [part.strip() for part in skills.split(",") if part.strip()]
        if parts:
            query = query.filter(or_(*[cast(Opportunity.skills, String).ilike(f"%{skill}%") for skill in parts]))
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Opportunity.title.ilike(like),
                Opportunity.short_description.ilike(like),
                Opportunity.description.ilike(like),
                Opportunity.location.ilike(like),
                cast(Opportunity.tags, String).ilike(like),
                cast(Opportunity.skills, String).ilike(like),
            )
        )
    items = query.all()
    now = datetime.now(timezone.utc)
    if deadline == "week":
        horizon = now + timedelta(days=7)
        items = [item for item in items if item.deadline and now <= _aware(item.deadline) <= horizon]
    elif deadline == "month":
        horizon = now + timedelta(days=31)
        items = [item for item in items if item.deadline and now <= _aware(item.deadline) <= horizon]
    elif deadline == "soon":
        horizon = now + timedelta(days=14)
        items = [item for item in items if item.deadline and now <= _aware(item.deadline) <= horizon]
    if public:
        items = [item for item in items if (days_remaining(item.deadline) is None or days_remaining(item.deadline) >= 0)]
    return items


def _aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def sort_opportunities(db: Session, items: list[Opportunity], sort: str, user: User | None) -> list[Opportunity]:
    if sort == "views":
        return sorted(items, key=lambda item: item.views, reverse=True)
    if sort == "deadline":
        return sorted(
            items,
            key=lambda item: (
                item.deadline is None,
                _aware(item.deadline) if item.deadline else datetime.max.replace(tzinfo=timezone.utc),
            ),
        )
    if sort == "recommended" and user is not None:
        bookmark_types = {
            row[0]
            for row in db.query(Opportunity.opportunity_type)
            .join(Bookmark, Bookmark.opportunity_id == Opportunity.id)
            .filter(Bookmark.user_id == user.id)
        }
        application_types = {
            row[0]
            for row in db.query(Opportunity.opportunity_type)
            .join(Application, Application.opportunity_id == Opportunity.id)
            .filter(Application.user_id == user.id)
        }
        scored = [(score_opportunity(user, item, bookmark_types, application_types)[0], item) for item in items]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [item for _, item in scored]
    if sort == "recommended":
        return sorted(items, key=lambda item: (item.featured, item.created_at), reverse=True)
    return sorted(items, key=lambda item: _aware(item.created_at), reverse=True)
