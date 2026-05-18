from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON

from app.database import Base


class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, default=1)
    company_name = Column(String(256), nullable=False)
    tagline = Column(String(256), nullable=False)
    catalog_title = Column(String(256), nullable=False)
    footer_text = Column(String(512), nullable=False)
    logo_url = Column(Text, nullable=True)
    theme = Column(JSON, nullable=False)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    design_number = Column(String(64), nullable=False, index=True)
    design_name = Column(String(256), nullable=False, index=True)
    company_name = Column(String(256), nullable=False, index=True)
    dimensions_options = Column(ARRAY(String), nullable=False, default=list)
    product_category = Column(String(128), nullable=False, index=True)
    subcategory = Column(String(128), nullable=False, index=True)
    image_url = Column(Text, nullable=True)
    image_object_key = Column(Text, nullable=True)
