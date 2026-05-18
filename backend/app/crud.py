from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from app.defaults import DEFAULT_SITE_SETTINGS
from app.models import Product, SiteSettings
from app.storage.r2 import delete_product_image


def _apply_filters(
    query,
    *,
    search: str | None,
    design_number: str | None,
    design_name: str | None,
    company_name: str | None,
    product_category: str | None,
    subcategory: str | None,
    dimension: str | None,
):
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.design_number.ilike(term),
                Product.design_name.ilike(term),
                Product.company_name.ilike(term),
                Product.product_category.ilike(term),
                Product.subcategory.ilike(term),
                cast(Product.dimensions_options, String).ilike(term),
            )
        )

    if design_number:
        query = query.filter(Product.design_number.ilike(f"%{design_number.strip()}%"))
    if design_name:
        query = query.filter(Product.design_name.ilike(f"%{design_name.strip()}%"))
    if company_name:
        query = query.filter(Product.company_name == company_name)
    if product_category:
        query = query.filter(Product.product_category == product_category)
    if subcategory:
        query = query.filter(Product.subcategory == subcategory)
    if dimension:
        query = query.filter(Product.dimensions_options.any(dimension))

    return query


def get_products(
    db: Session,
    *,
    search: str | None = None,
    design_number: str | None = None,
    design_name: str | None = None,
    company_name: str | None = None,
    product_category: str | None = None,
    subcategory: str | None = None,
    dimension: str | None = None,
) -> list[Product]:
    query = db.query(Product)
    query = _apply_filters(
        query,
        search=search,
        design_number=design_number,
        design_name=design_name,
        company_name=company_name,
        product_category=product_category,
        subcategory=subcategory,
        dimension=dimension,
    )
    return query.order_by(Product.design_number).all()


def get_all_products(db: Session) -> list[Product]:
    return db.query(Product).order_by(Product.design_number).all()


def get_product(db: Session, product_id: int) -> Product | None:
    return db.query(Product).filter(Product.id == product_id).first()


def create_product(db: Session, data: dict) -> Product:
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: dict) -> Product:
    for key, value in data.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    delete_product_image(
        object_key=product.image_object_key,
        image_url=product.image_url,
    )
    db.delete(product)
    db.commit()


def get_filter_options(db: Session) -> dict[str, list[str] | dict[str, list[str]]]:
    taxonomy = _taxonomy_from_db(db)
    companies = [
        row[0]
        for row in db.query(Product.company_name)
        .distinct()
        .order_by(Product.company_name)
        .all()
    ]
    dimensions = sorted(
        {
            dim
            for (dims,) in db.query(Product.dimensions_options).all()
            for dim in (dims or [])
        }
    )
    return {
        "categories": taxonomy["categories"],
        "subcategories": taxonomy["subcategories"],
        "subcategories_by_category": taxonomy["subcategories_by_category"],
        "companies": companies,
        "dimensions": dimensions,
    }


def _taxonomy_from_db(db: Session) -> dict:
    rows = db.query(Product.product_category, Product.subcategory).distinct().all()
    categories = sorted({r[0] for r in rows if r[0]})
    subcategories = sorted({r[1] for r in rows if r[1]})
    subcategories_by_category: dict[str, list[str]] = {}
    for cat, sub in rows:
        if cat and sub:
            subcategories_by_category.setdefault(cat, set()).add(sub)
    subcategories_by_category = {
        cat: sorted(subs) for cat, subs in subcategories_by_category.items()
    }
    return {
        "categories": categories,
        "subcategories": subcategories,
        "subcategories_by_category": subcategories_by_category,
    }


def get_site_settings(db: Session) -> SiteSettings:
    settings = db.query(SiteSettings).filter(SiteSettings.id == 1).first()
    if settings is None:
        settings = SiteSettings(id=1, **DEFAULT_SITE_SETTINGS)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_site_settings(db: Session, data: dict) -> SiteSettings:
    settings = get_site_settings(db)
    for key, value in data.items():
        if value is not None:
            setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings
