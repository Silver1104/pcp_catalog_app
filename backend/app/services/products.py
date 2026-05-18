import asyncio

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Product
from app.services.design_numbers import (
    allocate_design_number,
    allocate_design_numbers,
    assert_design_number_available,
    default_design_name,
    design_name_from_filename,
)
from app.services.images import read_upload_as_webp
from app.services.image_metadata import normalize_image_fields
from app.storage.r2 import is_r2_configured, upload_product_image
from app.utils.paths import build_product_image_key


def resolve_design_number(
    db: Session,
    *,
    product_category: str,
    subcategory: str,
    design_number: str | None,
) -> str:
    category = product_category.strip()
    sub = subcategory.strip()
    if not category or not sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category and subcategory are required",
        )
    if design_number and design_number.strip():
        dn = design_number.strip()
        assert_design_number_available(db, dn)
        return dn
    return allocate_design_number(db, category, sub)


def resolve_design_name(
    *,
    subcategory: str,
    design_number: str,
    design_name: str | None,
    filename: str | None = None,
) -> str:
    if design_name and design_name.strip():
        return design_name.strip()
    if filename:
        return design_name_from_filename(filename, subcategory, design_number)
    return default_design_name(subcategory, design_number)


async def upload_image_for_product(
    *,
    file: UploadFile,
    product_category: str,
    subcategory: str,
    design_number: str,
) -> tuple[str, str]:
    if not is_r2_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="R2 is not configured on the server",
        )
    object_key = build_product_image_key(
        product_category,
        subcategory,
        design_number,
        use_fixed_filename=settings.r2_use_fixed_image_name,
    )
    body, content_type = await read_upload_as_webp(file)
    image_url = await asyncio.to_thread(
        upload_product_image,
        object_key=object_key,
        body=body,
        content_type=content_type,
    )
    return image_url, object_key


def build_product_data(
    db: Session,
    *,
    product_category: str,
    subcategory: str,
    company_name: str,
    dimensions_options: list[str],
    design_number: str | None = None,
    design_name: str | None = None,
    image_url: str | None = None,
    image_object_key: str | None = None,
    filename: str | None = None,
) -> dict:
    if not dimensions_options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one dimension is required",
        )

    dn = resolve_design_number(
        db,
        product_category=product_category,
        subcategory=subcategory,
        design_number=design_number,
    )
    name = resolve_design_name(
        subcategory=subcategory,
        design_number=dn,
        design_name=design_name,
        filename=filename,
    )
    url, key = normalize_image_fields(image_url=image_url, image_object_key=image_object_key)
    return {
        "design_number": dn,
        "design_name": name,
        "company_name": company_name.strip(),
        "product_category": product_category.strip(),
        "subcategory": subcategory.strip(),
        "dimensions_options": dimensions_options,
        "image_url": url,
        "image_object_key": key,
    }


async def bulk_create_from_images(
    db: Session,
    *,
    files: list[UploadFile],
    product_category: str,
    subcategory: str,
    company_name: str,
    dimensions_options: list[str],
) -> list[Product]:
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")
    if not is_r2_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="R2 is required for bulk image upload",
        )

    if not dimensions_options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one dimension is required",
        )

    category = product_category.strip()
    sub = subcategory.strip()
    design_numbers = allocate_design_numbers(db, category, sub, len(files))
    created: list[Product] = []
    chunk_size = max(1, settings.bulk_upload_chunk_size)

    for chunk_start in range(0, len(files), chunk_size):
        chunk_files = files[chunk_start : chunk_start + chunk_size]
        chunk_numbers = design_numbers[chunk_start : chunk_start + chunk_size]
        chunk_created: list[Product] = []
        chunk_keys: list[str] = []

        try:
            for upload, dn in zip(chunk_files, chunk_numbers, strict=True):
                image_url, object_key = await upload_image_for_product(
                    file=upload,
                    product_category=category,
                    subcategory=sub,
                    design_number=dn,
                )
                chunk_keys.append(object_key)
                data = build_product_data(
                    db,
                    product_category=category,
                    subcategory=sub,
                    company_name=company_name,
                    dimensions_options=dimensions_options,
                    design_number=dn,
                    design_name=None,
                    image_url=image_url,
                    image_object_key=object_key,
                    filename=upload.filename,
                )
                product = Product(**data)
                db.add(product)
                chunk_created.append(product)

            db.commit()
            for product in chunk_created:
                db.refresh(product)
            created.extend(chunk_created)
        except Exception as exc:
            db.rollback()
            from app.storage.r2 import delete_object

            for key in chunk_keys:
                try:
                    delete_object(key)
                except Exception:
                    pass

            saved = len(created)
            if saved:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=(
                        f"Bulk upload failed after saving {saved} product(s). "
                        f"Refresh the admin list — do not retry the same batch without checking. "
                        f"Cause: {exc}"
                    ),
                ) from exc
            raise
    return created
