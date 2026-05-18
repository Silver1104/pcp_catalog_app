from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator

from app.services.image_metadata import classify_image_storage


class ProductBase(BaseModel):
    design_number: str
    design_name: str
    company_name: str
    dimensions_options: list[str]
    product_category: str
    subcategory: str
    image_url: str | None = None


class ProductCreate(BaseModel):
    design_number: str | None = None
    design_name: str | None = None
    company_name: str
    dimensions_options: list[str]
    product_category: str
    subcategory: str
    image_url: str | None = None
    image_object_key: str | None = None

    @field_validator("dimensions_options")
    @classmethod
    def dimensions_not_empty(cls, v: list[str]) -> list[str]:
        cleaned = [d.strip() for d in v if d and str(d).strip()]
        if not cleaned:
            raise ValueError("At least one dimension is required")
        return cleaned


class ProductUpdate(BaseModel):
    design_number: str | None = None
    design_name: str | None = None
    company_name: str | None = None
    dimensions_options: list[str] | None = None
    product_category: str | None = None
    subcategory: str | None = None
    image_url: str | None = None
    image_object_key: str | None = None


class ProductRead(ProductBase):
    id: int
    image_object_key: str | None = None
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def image_storage(self) -> str:
        return classify_image_storage(
            image_url=self.image_url,
            image_object_key=self.image_object_key,
        )


class FilterOptions(BaseModel):
    categories: list[str]
    subcategories: list[str]
    subcategories_by_category: dict[str, list[str]]
    companies: list[str]
    dimensions: list[str]


class TaxonomyRead(BaseModel):
    categories: list[str]
    subcategories: list[str]
    subcategories_by_category: dict[str, list[str]]


class TaxonomyCheckRequest(BaseModel):
    product_category: str
    subcategory: str
    exclude_product_id: int | None = None


class TaxonomyCheckResponse(BaseModel):
    warnings: list[str]
    is_new_category: bool
    is_new_subcategory: bool
    is_new_pair: bool


class ImageUploadResponse(BaseModel):
    image_url: str
    object_key: str
    design_number: str
    warnings: list[str] = Field(default_factory=list)


class BulkUploadResponse(BaseModel):
    created: list[ProductRead]
    count: int
    warnings: list[str] = Field(default_factory=list)


class ThemeColors(BaseModel):
    brand: dict[str, str]
    accent: dict[str, str]


class SiteSettingsRead(BaseModel):
    company_name: str
    tagline: str
    catalog_title: str
    footer_text: str
    logo_url: str | None = None
    theme: ThemeColors
    model_config = ConfigDict(from_attributes=True)


class SiteSettingsUpdate(BaseModel):
    company_name: str | None = None
    tagline: str | None = None
    catalog_title: str | None = None
    footer_text: str | None = None
    logo_url: str | None = None
    theme: dict[str, Any] | None = None


class AdminVerifyResponse(BaseModel):
    ok: bool = True
    r2_configured: bool = False


class MessageResponse(BaseModel):
    message: str
