from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=list[schemas.ProductRead])
def list_products(
    search: str | None = Query(None, description="Search across all product fields"),
    design_number: str | None = None,
    design_name: str | None = None,
    company_name: str | None = None,
    product_category: str | None = None,
    subcategory: str | None = None,
    dimension: str | None = None,
    db: Session = Depends(get_db),
):
    return crud.get_products(
        db,
        search=search,
        design_number=design_number,
        design_name=design_name,
        company_name=company_name,
        product_category=product_category,
        subcategory=subcategory,
        dimension=dimension,
    )


@router.get("/filter-options", response_model=schemas.FilterOptions)
def filter_options(db: Session = Depends(get_db)):
    return crud.get_filter_options(db)
