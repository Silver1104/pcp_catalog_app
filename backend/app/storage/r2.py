from functools import lru_cache
from urllib.parse import unquote

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException, status

from app.config import settings
from app.utils.paths import build_cdn_url


class R2NotConfiguredError(Exception):
    pass


def is_r2_configured() -> bool:
    return bool(
        settings.r2_account_id
        and settings.r2_access_key_id
        and settings.r2_secret_access_key
        and settings.r2_bucket_name
        and settings.r2_public_cdn_url
    )


@lru_cache
def get_s3_client():
    if not is_r2_configured():
        raise R2NotConfiguredError("Cloudflare R2 is not configured on the server")
    endpoint = settings.r2_endpoint_url or (
        f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
    )
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )


def object_key_from_cdn_url(url: str | None) -> str | None:
    """Extract R2 object key from a public CDN URL served by this app."""
    if not url or not settings.r2_public_cdn_url:
        return None
    base = settings.r2_public_cdn_url.rstrip("/") + "/"
    if not url.startswith(base):
        return None
    return unquote(url[len(base) :].lstrip("/"))


def upload_product_image(*, object_key: str, body: bytes, content_type: str) -> str:
    try:
        client = get_s3_client()
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Body=body,
            ContentType=content_type,
            CacheControl="public, max-age=31536000, immutable",
        )
    except R2NotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except (ClientError, BotoCoreError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload image to R2: {exc}",
        ) from exc

    return build_cdn_url(settings.r2_public_cdn_url, object_key)


def delete_object(object_key: str | None) -> bool:
    """
    Delete a single object from R2. Does not delete prefix \"folders\" (R2 has none).
    Returns True if deleted or key was empty; False if not configured or key not ours.
    """
    if not object_key or not is_r2_configured():
        return False
    try:
        client = get_s3_client()
        client.delete_object(Bucket=settings.r2_bucket_name, Key=object_key)
        return True
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            return True
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to delete image from R2: {exc}",
        ) from exc
    except BotoCoreError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to delete image from R2: {exc}",
        ) from exc


def delete_product_image(*, object_key: str | None, image_url: str | None) -> None:
    key = object_key or object_key_from_cdn_url(image_url)
    if key:
        delete_object(key)


def object_exists(object_key: str) -> bool:
    if not is_r2_configured():
        return False
    try:
        client = get_s3_client()
        client.head_object(Bucket=settings.r2_bucket_name, Key=object_key)
        return True
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code in ("404", "NoSuchKey", "NotFound"):
            return False
        return False
    except BotoCoreError:
        return False
