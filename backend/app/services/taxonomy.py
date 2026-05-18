from sqlalchemy.orm import Session

from app.models import Product


def get_taxonomy(db: Session) -> dict:
    rows = db.query(Product.product_category, Product.subcategory).distinct().all()
    categories = sorted({r[0] for r in rows if r[0]})
    subcategories = sorted({r[1] for r in rows if r[1]})
    pairs = sorted({(r[0], r[1]) for r in rows if r[0] and r[1]})
    subcategories_by_category: dict[str, list[str]] = {}
    for cat, sub in pairs:
        subcategories_by_category.setdefault(cat, []).append(sub)
    for cat in subcategories_by_category:
        subcategories_by_category[cat] = sorted(subcategories_by_category[cat])
    return {
        "categories": categories,
        "subcategories": subcategories,
        "subcategories_by_category": subcategories_by_category,
    }


def check_taxonomy_warnings(
    db: Session,
    *,
    product_category: str,
    subcategory: str,
    exclude_product_id: int | None = None,
) -> list[str]:
    warnings: list[str] = []
    category = product_category.strip()
    sub = subcategory.strip()

    if not category or not sub:
        return warnings

    cat_exists = (
        db.query(Product.id)
        .filter(Product.product_category == category)
        .first()
        is not None
    )
    sub_exists = (
        db.query(Product.id)
        .filter(Product.subcategory == sub)
        .first()
        is not None
    )
    pair_exists = (
        db.query(Product.id)
        .filter(Product.product_category == category, Product.subcategory == sub)
        .first()
        is not None
    )

    if not cat_exists:
        warnings.append(f'New category "{category}" will be created for the catalog.')
    if not sub_exists:
        warnings.append(f'New subcategory "{sub}" will be created for the catalog.')
    if cat_exists and not pair_exists:
        warnings.append(
            f'Category "{category}" exists, but subcategory "{sub}" is new under that category.'
        )

    if exclude_product_id is not None and pair_exists:
        other = (
            db.query(Product)
            .filter(
                Product.product_category == category,
                Product.subcategory == sub,
                Product.id != exclude_product_id,
            )
            .count()
        )
        if other > 0:
            warnings.append(
                f'Another product already uses category "{category}" and subcategory "{sub}". '
                "R2 images use a unique path per design number."
            )

    return warnings
