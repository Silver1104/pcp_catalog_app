import re
import unicodedata

_INVALID_CHARS = re.compile(r"[^a-z0-9\-]+")


def slugify_segment(value: str, *, fallback: str = "item") -> str:
    """Safe object-key segment for R2 paths."""
    normalized = unicodedata.normalize("NFKD", value.strip().lower())
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = _INVALID_CHARS.sub("-", ascii_text).strip("-")
    slug = re.sub(r"-{2,}", "-", slug)
    return slug or fallback


def build_product_image_key(
    category: str,
    subcategory: str,
    design_number: str,
    *,
    use_fixed_filename: bool = False,
) -> str:
    """
    Object key in R2. Default: {category}/{subcategory}/{design}.webp (unique per product).
    If R2_USE_FIXED_IMAGE_NAME=true: {category}/{subcategory}/image.webp (one image per folder).
    """
    cat = slugify_segment(category, fallback="category")
    sub = slugify_segment(subcategory, fallback="subcategory")
    if use_fixed_filename:
        return f"{cat}/{sub}/image.webp"
    design = slugify_segment(design_number, fallback="design")
    return f"{cat}/{sub}/{design}.webp"


def build_cdn_url(cdn_base: str, object_key: str) -> str:
    base = cdn_base.rstrip("/")
    return f"{base}/{object_key}"
