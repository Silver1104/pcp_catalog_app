from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import require_admin
from app.config import ENV_FILE, settings
from app.database import get_db
from app.services.image_metadata import normalize_image_fields
from app.services.products import (
    build_product_data,
    bulk_create_from_images,
    upload_image_for_product,
)
from app.services.taxonomy import check_taxonomy_warnings, get_taxonomy
from app.storage.r2 import is_r2_configured, object_exists
from app.utils.paths import build_product_image_key

router = APIRouter(
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


@router.post("/verify", response_model=schemas.AdminVerifyResponse)
def verify_admin():
    return schemas.AdminVerifyResponse(r2_configured=is_r2_configured())


@router.get("/r2-status")
def r2_status():
    return {
        "configured": is_r2_configured(),
        "env_file": str(ENV_FILE),
        "vars": {
            "R2_ACCOUNT_ID": bool(settings.r2_account_id),
            "R2_ACCESS_KEY_ID": bool(settings.r2_access_key_id),
            "R2_SECRET_ACCESS_KEY": bool(settings.r2_secret_access_key),
            "R2_BUCKET_NAME": bool(settings.r2_bucket_name),
            "R2_PUBLIC_CDN_URL": bool(settings.r2_public_cdn_url),
        },
    }


@router.get("/taxonomy", response_model=schemas.TaxonomyRead)
def admin_taxonomy(db: Session = Depends(get_db)):
    return get_taxonomy(db)


@router.post("/taxonomy/check", response_model=schemas.TaxonomyCheckResponse)
def admin_check_taxonomy(payload: schemas.TaxonomyCheckRequest, db: Session = Depends(get_db)):
    category = payload.product_category.strip()
    sub = payload.subcategory.strip()
    taxonomy = get_taxonomy(db)
    is_new_category = category not in taxonomy["categories"]
    is_new_subcategory = sub not in taxonomy["subcategories"]
    pair_key = (category, sub)
    existing_pairs = {
        (c, s) for c, subs in taxonomy["subcategories_by_category"].items() for s in subs
    }
    is_new_pair = pair_key not in existing_pairs
    warnings = check_taxonomy_warnings(
        db,
        product_category=category,
        subcategory=sub,
        exclude_product_id=payload.exclude_product_id,
    )
    return schemas.TaxonomyCheckResponse(
        warnings=warnings,
        is_new_category=is_new_category,
        is_new_subcategory=is_new_subcategory,
        is_new_pair=is_new_pair,
    )


@router.post("/upload-image", response_model=schemas.ImageUploadResponse)
async def admin_upload_image(
    file: UploadFile = File(...),
    product_category: str = Form(...),
    subcategory: str = Form(...),
    design_number: str = Form(""),
    exclude_product_id: int | None = Form(None),
    db: Session = Depends(get_db),
):
    from app.services.products import resolve_design_number

    category = product_category.strip()
    sub = subcategory.strip()
    if not category or not sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category and subcategory are required for upload",
        )

    design = resolve_design_number(
        db,
        product_category=category,
        subcategory=sub,
        design_number=design_number or None,
    )

    warnings = check_taxonomy_warnings(
        db,
        product_category=category,
        subcategory=sub,
        exclude_product_id=exclude_product_id,
    )

    object_key = build_product_image_key(
        category,
        sub,
        design,
        use_fixed_filename=settings.r2_use_fixed_image_name,
    )
    if (
        settings.r2_use_fixed_image_name
        and is_r2_configured()
        and object_exists(object_key)
    ):
        warnings.append(
            f'R2 object "{object_key}" already exists and will be overwritten with this upload.'
        )

    image_url, object_key = await upload_image_for_product(
        file=file,
        product_category=category,
        subcategory=sub,
        design_number=design,
    )

    return schemas.ImageUploadResponse(
        image_url=image_url,
        object_key=object_key,
        design_number=design,
        warnings=warnings,
    )


@router.post("/products/bulk-upload", response_model=schemas.BulkUploadResponse)
async def admin_bulk_upload(
    files: list[UploadFile] = File(...),
    product_category: str = Form(...),
    subcategory: str = Form(...),
    company_name: str = Form(...),
    dimensions_options: str = Form(""),
    db: Session = Depends(get_db),
):
    category = product_category.strip()
    sub = subcategory.strip()
    if not category or not sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category and subcategory are required",
        )

    dims = [d.strip() for d in dimensions_options.split(",") if d.strip()]
    warnings = check_taxonomy_warnings(db, product_category=category, subcategory=sub)

    created = await bulk_create_from_images(
        db,
        files=files,
        product_category=category,
        subcategory=sub,
        company_name=company_name,
        dimensions_options=dims,
    )

    return schemas.BulkUploadResponse(
        created=created,
        count=len(created),
        warnings=warnings,
    )


@router.get("/products", response_model=list[schemas.ProductRead])
def admin_list_products(db: Session = Depends(get_db)):
    return crud.get_all_products(db)


@router.post("/products", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED)
def admin_create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    data = build_product_data(
        db,
        product_category=payload.product_category,
        subcategory=payload.subcategory,
        company_name=payload.company_name,
        dimensions_options=payload.dimensions_options,
        design_number=payload.design_number,
        design_name=payload.design_name,
        image_url=payload.image_url,
        image_object_key=payload.image_object_key,
    )
    return crud.create_product(db, data)


@router.put("/products/{product_id}", response_model=schemas.ProductRead)
def admin_update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    from app.storage.r2 import delete_product_image

    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    old_key = product.image_object_key
    old_url = product.image_url
    new_key = data.get("image_object_key")
    new_url = data.get("image_url")
    image_changing = new_key is not None or new_url is not None
    if image_changing:
        url = data["image_url"] if "image_url" in data else product.image_url
        key = data["image_object_key"] if "image_object_key" in data else product.image_object_key
        data["image_url"], data["image_object_key"] = normalize_image_fields(
            image_url=url, image_object_key=key
        )

    if "design_number" in data and (not data["design_number"] or not str(data["design_number"]).strip()):
        data.pop("design_number")
    elif "design_number" in data:
        from app.services.design_numbers import assert_design_number_available

        assert_design_number_available(
            db, data["design_number"], exclude_product_id=product_id
        )

    updated = crud.update_product(db, product, data)

    if image_changing and (new_key != old_key or new_url != old_url):
        delete_product_image(object_key=old_key, image_url=old_url)

    return updated


@router.delete("/products/{product_id}", response_model=schemas.MessageResponse)
def admin_delete_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    crud.delete_product(db, product)
    return schemas.MessageResponse(message="Product deleted")


@router.get("/settings", response_model=schemas.SiteSettingsRead)
def admin_read_settings(db: Session = Depends(get_db)):
    return crud.get_site_settings(db)


@router.put("/settings", response_model=schemas.SiteSettingsRead)
def admin_update_settings(payload: schemas.SiteSettingsUpdate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")
    return crud.update_site_settings(db, data)
