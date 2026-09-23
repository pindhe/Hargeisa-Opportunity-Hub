import json
import re
import urllib.request
from datetime import datetime, timedelta, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.models import Opportunity, OpportunityStatus, User
from app.present import days_remaining
from app.services.recommend import ranked_opportunities
from app.utils import TYPE_LABELS

TYPE_KEYWORDS = {
    "scholarship": "SCHOLARSHIP",
    "scholarships": "SCHOLARSHIP",
    "job": "JOB",
    "jobs": "JOB",
    "internship": "INTERNSHIP",
    "internships": "INTERNSHIP",
    "course": "COURSE",
    "courses": "COURSE",
    "training": "TRAINING",
    "hackathon": "HACKATHON",
    "hackathons": "HACKATHON",
    "competition": "COMPETITION",
    "competitions": "COMPETITION",
    "fellowship": "FELLOWSHIP",
    "fellowships": "FELLOWSHIP",
    "volunteer": "VOLUNTEERING",
    "volunteering": "VOLUNTEERING",
    "event": "EVENT",
    "events": "EVENT",
}

LOCATION_KEYWORDS = {
    "hargeisa": "Hargeisa",
    "borama": "Borama",
    "berbera": "Berbera",
    "burao": "Burao",
    "somaliland": "Somaliland",
    "somalia": "Somalia",
    "remote": "Remote",
    "international": "International",
    "africa": "Africa",
}


def _base_query(db: Session):
    return db.query(Opportunity).options(
        selectinload(Opportunity.organization),
        selectinload(Opportunity.category),
    ).filter(Opportunity.status == OpportunityStatus.APPROVED.value)


def _open_only(items: list[Opportunity]) -> list[Opportunity]:
    open_items: list[Opportunity] = []
    for item in items:
        remaining = days_remaining(item.deadline)
        if remaining is None or remaining >= 0:
            open_items.append(item)
    return open_items


def _polish(question: str, fallback: str, titles: list[str]) -> str:
    if not settings.openai_api_key:
        return fallback
    payload = {
        "model": settings.openai_model,
        "temperature": 0.3,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are the HOH assistant for students in Hargeisa and Somaliland. "
                    "Rewrite the draft so it is warm, concise, and practical. "
                    "Only mention opportunities from the provided list. Do not invent listings, dates, or links."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {"question": question, "draft": fallback, "opportunities": titles},
                    ensure_ascii=False,
                ),
            },
        ],
    }
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            body = json.loads(response.read().decode("utf-8"))
        text = body["choices"][0]["message"]["content"].strip()
        return text or fallback
    except Exception:
        return fallback


def _prepare_reply(opp: Opportunity) -> str:
    lines = [
        f"Here is a practical way to prepare for {opp.title} at {opp.organization.name}.",
        "",
        "Read the eligibility first and check that your university, year, and location fit.",
    ]
    if opp.requirements:
        lines.append("Requirements to prepare against:")
        lines.append(opp.requirements.strip())
    if opp.skills:
        lines.append(f"Refresh these skills before you apply: {', '.join(opp.skills)}.")
    lines.append("Prepare a short note that connects your studies to the opportunity, then apply through the official link and add it to your tracker.")
    if opp.deadline:
        lines.append("Keep the deadline visible so you can submit before it closes.")
    return "\n".join(lines)


def answer(db: Session, user: User | None, message: str) -> tuple[str, list[Opportunity]]:
    text = message.strip()
    lowered = text.lower()

    if any(phrase in lowered for phrase in ["hello", "hi ", "hey", "help me use", "what can you do"]) and len(lowered) < 40:
        featured = _open_only(_base_query(db).filter(Opportunity.featured.is_(True)).limit(3).all())
        reply = (
            "I can search approved opportunities on HOH. Ask for scholarships, internships in Hargeisa, "
            "roles that match your skills, or anything closing this week."
        )
        return _polish(text, reply, [item.title for item in featured]), featured

    if "prepar" in lowered:
        words = [word for word in re.split(r"[^a-z0-9]+", lowered) if len(word) > 3 and word not in {"prepare", "help", "this", "opportunity"}]
        query = _base_query(db)
        if words:
            query = query.filter(or_(*[Opportunity.title.ilike(f"%{word}%") for word in words[:4]]))
        found = _open_only(query.limit(1).all())
        if not found and user is not None:
            ranked = ranked_opportunities(db, user, limit=1)
            found = [ranked[0][0]] if ranked else []
        if not found:
            return "Tell me the opportunity title and I will help you prepare from its requirements.", []
        reply = _prepare_reply(found[0])
        return _polish(text, reply, [found[0].title]), found

    wants_profile = any(
        phrase in lowered
        for phrase in ["my skills", "match my", "for me", "should i apply", "recommend", "my profile", "interested in"]
    )
    closing = any(phrase in lowered for phrase in ["this week", "closing", "deadline", "soon", "today"])

    chosen_type = next((value for key, value in TYPE_KEYWORDS.items() if re.search(rf"\b{key}\b", lowered)), None)
    chosen_location = next((value for key, value in LOCATION_KEYWORDS.items() if key in lowered), None)

    if wants_profile and user is None:
        return "Sign in and finish your profile, then I can match opportunities to your skills, interests, and location.", []

    if wants_profile and user is not None and not closing and chosen_type is None and chosen_location is None:
        ranked = ranked_opportunities(db, user, limit=6)
        if not ranked:
            return "I could not find a strong match yet. Add skills and interests on your profile, or browse the full catalogue.", []
        titles = [item[0].title for item in ranked]
        reason = ranked[0][1]
        reply = f"These are the strongest matches on HOH right now. {reason}"
        return _polish(text, reply, titles), [item[0] for item in ranked]

    query = _base_query(db)
    if chosen_type:
        query = query.filter(Opportunity.opportunity_type == chosen_type)
    if chosen_location == "Remote":
        query = query.filter(Opportunity.is_remote.is_(True))
    elif chosen_location:
        like = f"%{chosen_location}%"
        query = query.filter(or_(Opportunity.location.ilike(like), Opportunity.country.ilike(like)))

    keywords = [
        word
        for word in re.split(r"[^a-z0-9+]+", lowered)
        if len(word) > 3 and word not in TYPE_KEYWORDS and word not in LOCATION_KEYWORDS and word not in {
            "find", "show", "what", "which", "available", "opportunities", "opportunity", "students", "student",
            "this", "week", "closing", "soon", "help", "please", "with", "from", "that", "have", "need",
            "want", "looking", "there", "about", "your", "should", "apply",
        }
    ]
    for word in keywords[:5]:
        like = f"%{word}%"
        query = query.filter(
            or_(
                Opportunity.title.ilike(like),
                Opportunity.short_description.ilike(like),
                Opportunity.description.ilike(like),
                Opportunity.location.ilike(like),
            )
        )

    if closing:
        horizon = datetime.now(timezone.utc) + timedelta(days=7)
        now = datetime.now(timezone.utc)
        query = query.filter(Opportunity.deadline.is_not(None), Opportunity.deadline >= now, Opportunity.deadline <= horizon)
        results = query.order_by(Opportunity.deadline.asc()).limit(8).all()
    else:
        results = _open_only(query.order_by(Opportunity.featured.desc(), Opportunity.created_at.desc()).limit(8).all())

    if wants_profile and user is not None and results:
        ranked_ids = {item[0].id: item[1] for item in ranked_opportunities(db, user, limit=30)}
        results.sort(key=lambda item: item.id in ranked_ids, reverse=True)

    if not results:
        reply = "I could not find an approved opportunity that matches that search. Try a broader location or category, or check Explore."
        return reply, []

    label = TYPE_LABELS.get(chosen_type, "opportunities") if chosen_type else "opportunities"
    place = f" in {chosen_location}" if chosen_location else ""
    if closing:
        reply = f"I found {len(results)} {label.lower()} closing within 7 days{place}."
    else:
        reply = f"I found {len(results)} matching {label.lower()}{place} on HOH."
    if user and user.interests and wants_profile:
        reply += " " + ranked_opportunities(db, user, limit=1)[0][1] if ranked_opportunities(db, user, limit=1) else ""
    return _polish(text, reply, [item.title for item in results]), results
