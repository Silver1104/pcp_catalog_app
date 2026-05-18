from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BACKEND_DIR / ".env"


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
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()


def get_cors_origins() -> list[str]:
    return [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
