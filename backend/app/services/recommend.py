import re

from sqlalchemy.orm import Session, selectinload

from app.models import Application, Bookmark, Opportunity, OpportunityStatus, User
from app.present import days_remaining
from app.utils import LOCATION_GROUPS, TYPE_LABELS, human_join


def _tokens(value: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9+]+", value.lower()) if len(token) > 2]


def _haystack(opp: Opportunity) -> str:
    parts = [
        opp.title,
        opp.short_description,
        opp.description,
        opp.location,
        opp.country,
        " ".join(opp.tags or []),
        " ".join(opp.skills or []),
        opp.organization.name if opp.organization else "",
        opp.category.name if opp.category else "",
    ]
    return " ".join(parts).lower()


def location_match(user: User, opp: Opportunity) -> bool:
    prefs = [item.lower() for item in (user.preferred_locations or [])]
    blob = f"{opp.location} {opp.country}".lower()
    for pref in prefs:
        if pref == "remote" and opp.is_remote:
            return True
        for needle in LOCATION_GROUPS.get(pref, [pref]):
            if needle in blob:
                return True
    return False


def score_opportunity(
    user: User,
    opp: Opportunity,
    bookmark_types: set[str],
    application_types: set[str],
) -> tuple[int, str]:
    score = 0
    text = _haystack(opp)
    preferred = set(user.preferred_categories or [])
    matched_interests: list[str] = []
    matched_skills: list[str] = []

    if opp.opportunity_type in preferred:
        score += 28

    for interest in user.interests or []:
        tokens = _tokens(interest)
        if tokens and any(token in text for token in tokens):
            score += 18
            matched_interests.append(interest)

    opp_skills = {skill.lower() for skill in (opp.skills or []) + (opp.tags or [])}
    for skill in user.skills or []:
        if skill.lower() in opp_skills or any(token in text for token in _tokens(skill)):
            matched_skills.append(skill)
    if matched_skills:
        score += min(36, 12 * len(set(item.lower() for item in matched_skills)))

    if location_match(user, opp):
        score += 14
    if user.education_level and user.education_level in (opp.education_levels or []):
        score += 8
    if opp.opportunity_type in bookmark_types:
        score += 6
    if opp.opportunity_type in application_types:
        score += 4
    if opp.featured:
        score += 2

    bits: list[str] = []
    if matched_interests:
        bits.append(f"you selected {human_join(matched_interests[:3])}")
    if matched_skills:
        bits.append(f"your skills include {human_join(matched_skills[:3])}")
    if opp.opportunity_type in preferred and not matched_interests:
        label = TYPE_LABELS.get(opp.opportunity_type, opp.opportunity_type).lower()
        bits.append(f"you prefer {label}")
    if not bits and location_match(user, opp):
        bits.append("it matches your location preferences")

    if bits:
        reason = "Recommended because " + " and ".join(bits[:2]) + "."
        reason = reason.replace(" and and ", " and ")
    else:
        reason = "Recommended based on your profile."
    return score, reason


def ranked_opportunities(
    db: Session,
    user: User,
    limit: int = 8,
    exclude_ids: set[str] | None = None,
) -> list[tuple[Opportunity, str]]:
    exclude_ids = exclude_ids or set()
    opportunities = (
        db.query(Opportunity)
        .options(selectinload(Opportunity.organization), selectinload(Opportunity.category))
        .filter(Opportunity.status == OpportunityStatus.APPROVED.value)
        .all()
    )
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
    scored: list[tuple[int, float, Opportunity, str]] = []
    for opp in opportunities:
        if opp.id in exclude_ids:
            continue
        remaining = days_remaining(opp.deadline)
        if remaining is not None and remaining < 0:
            continue
        value, reason = score_opportunity(user, opp, bookmark_types, application_types)
        if value <= 0:
            continue
        created = opp.created_at.timestamp() if opp.created_at else 0
        scored.append((value, created, opp, reason))
    scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [(opp, reason) for _, _, opp, reason in scored[:limit]]
