from app.storage.r2 import object_key_from_cdn_url


def classify_image_storage(*, image_url: str | None, image_object_key: str | None) -> str:
    """
    r2          — uploaded via app; object key stored
    r2_linked   — CDN URL matches our bucket but no key stored (legacy / pasted URL)
    external    — image hosted outside R2 (e.g. Unsplash, seed data)
    none        — no image
    """
    if image_object_key:
        return "r2"
    if image_url and object_key_from_cdn_url(image_url):
        return "r2_linked"
    if image_url:
        return "external"
    return "none"


def normalize_image_fields(
    *,
    image_url: str | None,
    image_object_key: str | None,
) -> tuple[str | None, str | None]:
    """Keep URL and object key consistent; external URLs must not keep an R2 key."""
    url = image_url.strip() if image_url else None
    key = image_object_key.strip() if image_object_key else None

    if not url:
        return None, None

    derived = object_key_from_cdn_url(url)
    if derived:
        return url, key or derived

    return url, None
