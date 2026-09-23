from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import (
    Application,
    ApplicationStatus,
    Bookmark,
    DeadlineReminder,
    Notification,
    NotificationType,
    Opportunity,
    OpportunityStatus,
)
from app.present import days_remaining

WINDOWS = {
    7: "7 days before the deadline",
    3: "3 days before the deadline",
    1: "tomorrow",
    0: "today",
}


def run_deadline_checks(db: Session) -> int:
    created = 0
    now = datetime.now(timezone.utc)
    approved = db.query(Opportunity).filter(Opportunity.status == OpportunityStatus.APPROVED.value).all()
    for opp in approved:
        remaining = days_remaining(opp.deadline)
        if remaining is not None and remaining < 0:
            opp.status = OpportunityStatus.EXPIRED.value
            opp.updated_at = now

    pairs: dict[tuple[str, str], Opportunity] = {}
    bookmark_rows = (
        db.query(Bookmark.user_id, Opportunity)
        .join(Opportunity, Opportunity.id == Bookmark.opportunity_id)
        .filter(Opportunity.status == OpportunityStatus.APPROVED.value)
        .all()
    )
    for user_id, opp in bookmark_rows:
        pairs[(user_id, opp.id)] = opp
    app_rows = (
        db.query(Application.user_id, Opportunity)
        .join(Opportunity, Opportunity.id == Application.opportunity_id)
        .filter(
            Opportunity.status == OpportunityStatus.APPROVED.value,
            Application.status != ApplicationStatus.REJECTED.value,
        )
        .all()
    )
    for user_id, opp in app_rows:
        pairs[(user_id, opp.id)] = opp

    for (user_id, opp_id), opp in pairs.items():
        remaining = days_remaining(opp.deadline)
        if remaining not in WINDOWS:
            continue
        kind = str(remaining)
        exists = (
            db.query(DeadlineReminder)
            .filter(
                DeadlineReminder.user_id == user_id,
                DeadlineReminder.opportunity_id == opp_id,
                DeadlineReminder.kind == kind,
            )
            .first()
        )
        if exists:
            continue
        when = WINDOWS[remaining]
        db.add(DeadlineReminder(user_id=user_id, opportunity_id=opp_id, kind=kind))
        db.add(
            Notification(
                user_id=user_id,
                title=f"Deadline {when}",
                message=f"{opp.title} closes {when}. Open it and confirm your application.",
                type=NotificationType.DEADLINE.value,
                link=f"/opportunities/{opp.slug}",
            )
        )
        created += 1
    db.commit()
    return created
