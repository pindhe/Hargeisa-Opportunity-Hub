from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

connect_args: dict[str, object] = {}
if settings.resolved_database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(settings.resolved_database_url, connect_args=connect_args)

if settings.resolved_database_url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _enable_sqlite_fks(dbapi_connection, _record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
