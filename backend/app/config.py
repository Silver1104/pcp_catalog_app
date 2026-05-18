from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"


def normalize_database_url(url: str) -> str:
    """Render/Heroku provide postgres:// or postgresql:// — psycopg3 needs postgresql+psycopg://"""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and "+psycopg" not in url and "+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://catalog:catalog@localhost:5432/catalog"
    admin_api_key: str = "catalog-admin-dev-key"

    # Cloudflare R2 (S3-compatible). Leave blank to disable uploads (URL-only mode).
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_public_cdn_url: str = ""
    r2_endpoint_url: str = ""
    r2_use_fixed_image_name: bool = False
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.is_file() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_database_url(cls, v: str) -> str:
        return normalize_database_url(v) if v else v

    @field_validator("admin_api_key", mode="before")
    @classmethod
    def strip_admin_api_key(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


settings = Settings()


def get_cors_origins() -> list[str]:
    return [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
