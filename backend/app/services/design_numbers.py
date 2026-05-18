import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Product
from app.utils.paths import slugify_segment

_SEQ_SUFFIX = re.compile(r"-(\d{4,})$")


def design_number_prefix(category: str, subcategory: str) -> str:
    """Stable prefix for serialized design numbers: {category-slug}-{subcategory-slug}."""
    cat = slugify_segment(category, fallback="category")
    sub = slugify_segment(subcategory, fallback="subcategory")
    return f"{cat}-{sub}"


def _max_sequence_for_pair(db: Session, category: str, subcategory: str, prefix: str) -> int:
    rows = (
        db.query(Product.design_number)
        .filter(
            Product.product_category == category,
            Product.subcategory == subcategory,
        )
        .all()
    )
    max_seq = 0
    for (design_number,) in rows:
        if not design_number:
            continue
        if design_number.startswith(prefix + "-"):
            match = _SEQ_SUFFIX.search(design_number)
            if match:
                max_seq = max(max_seq, int(match.group(1)))
    return max_seq


def allocate_design_numbers(
    db: Session,
    category: str,
    subcategory: str,
    count: int = 1,
) -> list[str]:
    """Reserve `count` sequential design numbers for a category + subcategory pair."""
    if count < 1:
        return []
    prefix = design_number_prefix(category, subcategory)
    start = _max_sequence_for_pair(db, category, subcategory, prefix) + 1
    return [f"{prefix}-{seq:04d}" for seq in range(start, start + count)]


def allocate_design_number(db: Session, category: str, subcategory: str) -> str:
    return allocate_design_numbers(db, category, subcategory, 1)[0]


def assert_design_number_available(
    db: Session,
    design_number: str,
    *,
    exclude_product_id: int | None = None,
) -> None:
    query = db.query(Product.id).filter(Product.design_number == design_number)
    if exclude_product_id is not None:
        query = query.filter(Product.id != exclude_product_id)
    if query.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Design number "{design_number}" is already in use',
        )


def _sequence_label(design_number: str) -> str:
    seq_match = _SEQ_SUFFIX.search(design_number)
    if seq_match:
        return seq_match.group(1).lstrip("0") or "1"
    return design_number


def bulk_design_name(subcategory: str, design_number: str) -> str:
    """Display name for bulk uploads: {Subcategory}-{serialized number}."""
    return f"{subcategory.strip()}-{_sequence_label(design_number)}"


def default_design_name(subcategory: str, design_number: str) -> str:
    return bulk_design_name(subcategory, design_number)


def design_name_from_filename(filename: str, subcategory: str, design_number: str) -> str:
    stem = filename.rsplit(".", 1)[0] if filename else ""
    cleaned = re.sub(r"[-_]+", " ", stem).strip()
    if cleaned and len(cleaned) >= 2:
        return cleaned.title()[:256]
    return default_design_name(subcategory, design_number)
