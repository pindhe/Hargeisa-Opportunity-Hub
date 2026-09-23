from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "dev-only-change-me-hargeisa-opportunity-hub"
    database_url: str = "sqlite:///./hoh.db"
    cors_origins: str = "http://localhost:3000"
    access_token_expire_minutes: int = 60 * 24 * 7
    auto_create_tables: bool = True
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(env_file=str(BASE_DIR / ".env"), extra="ignore")

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() in {"development", "dev", "local"}

    @property
    def resolved_database_url(self) -> str:
        url = self.database_url
        prefix = "sqlite:///./"
        if url.startswith(prefix):
            path = (BASE_DIR / url.removeprefix(prefix)).resolve()
            return "sqlite:///" + path.as_posix()
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
