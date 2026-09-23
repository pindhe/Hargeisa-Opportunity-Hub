from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user, get_optional_user
from app.listings import opportunity_query
from app.models import ChatMessage, Conversation, Opportunity, User
from app.present import present_card, user_context
from app.schemas import ChatIn, ChatMessageOut, ChatResponse, ConversationDetail, ConversationOut, OpportunityCard
from app.services.assistant import answer

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _cards_for(db: Session, user: User | None, opportunities: list[Opportunity]) -> list[OpportunityCard]:
    bookmarks, apps = user_context(db, user.id if user else None)
    return [present_card(item, bookmarks, apps) for item in opportunities]


def _load_cards(db: Session, user: User | None, slugs: list) -> list[OpportunityCard]:
    if not slugs:
        return []
    rows = opportunity_query(db).filter(Opportunity.slug.in_(slugs)).all()
    order = {slug: index for index, slug in enumerate(slugs)}
    rows.sort(key=lambda item: order.get(item.slug, 0))
    return _cards_for(db, user, rows)


@router.get("/conversations", response_model=list[ConversationOut])
def conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Conversation]:
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetail)
def conversation_detail(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetail:
    row = (
        db.query(Conversation)
        .options(selectinload(Conversation.messages))
        .filter(Conversation.id == conversation_id, Conversation.user_id == user.id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = [
        ChatMessageOut(
            id=message.id,
            role=message.role,
            content=message.content,
            opportunities=_load_cards(db, user, message.opportunities or []),
            created_at=message.created_at,
        )
        for message in row.messages
    ]
    return ConversationDetail(
        id=row.id,
        title=row.title,
        created_at=row.created_at,
        updated_at=row.updated_at,
        messages=messages,
    )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(row)
    db.commit()
    return {"message": "Deleted"}


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatIn,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> ChatResponse:
    conversation = None
    if user is not None:
        if payload.conversation_id:
            conversation = (
                db.query(Conversation)
                .filter(Conversation.id == payload.conversation_id, Conversation.user_id == user.id)
                .first()
            )
            if conversation is None:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            title = payload.message.strip()[:80]
            conversation = Conversation(user_id=user.id, title=title)
            db.add(conversation)
            db.flush()
        db.add(ChatMessage(conversation_id=conversation.id, role="user", content=payload.message.strip(), opportunities=[]))

    reply, opportunities = answer(db, user, payload.message)
    cards = _cards_for(db, user, opportunities)
    if conversation is not None:
        db.add(
            ChatMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=reply,
                opportunities=[item.slug for item in opportunities],
            )
        )
        conversation.updated_at = datetime.now(timezone.utc)
        db.commit()
    return ChatResponse(reply=reply, opportunities=cards, conversation_id=conversation.id if conversation else None)
