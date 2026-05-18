"""Seed sample tile products. Run after DB is up: python seed.py"""

from app.crud import get_site_settings
from app.database import Base, SessionLocal, engine
from app.models import Product

SAMPLE_PRODUCTS = [
    {
        "design_number": "TN-1042",
        "design_name": "Marble Vein White",
        "company_name": "Apex Ceramics",
        "dimensions_options": ["12×24 in", "24×24 in", "24×48 in"],
        "product_category": "Porcelain",
        "subcategory": "Marble Look",
        "image_url": "https://images.unsplash.com/photo-1615873968403-89e068629265?w=600&q=80",
    },
    {
        "design_number": "TN-2087",
        "design_name": "Terrazzo Speckle",
        "company_name": "StoneLine Tiles",
        "dimensions_options": ["12×12 in", "18×18 in"],
        "product_category": "Ceramic",
        "subcategory": "Terrazzo",
        "image_url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80",
    },
    {
        "design_number": "TN-3156",
        "design_name": "Slate Horizon",
        "company_name": "Apex Ceramics",
        "dimensions_options": ["12×24 in", "6×24 in"],
        "product_category": "Natural Stone Look",
        "subcategory": "Slate",
        "image_url": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
    },
    {
        "design_number": "TN-4201",
        "design_name": "Warm Oak Wood",
        "company_name": "Nordic Surfaces",
        "dimensions_options": ["8×48 in", "6×36 in", "9×48 in"],
        "product_category": "Wood Look",
        "subcategory": "Oak",
        "image_url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    },
    {
        "design_number": "TN-5093",
        "design_name": "Concrete Ash",
        "company_name": "StoneLine Tiles",
        "dimensions_options": ["24×24 in", "12×24 in"],
        "product_category": "Porcelain",
        "subcategory": "Concrete Look",
        "image_url": "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80",
    },
    {
        "design_number": "TN-6110",
        "design_name": "Mediterranean Blue",
        "company_name": "Coastal Tile Co.",
        "dimensions_options": ["4×12 in", "3×6 in"],
        "product_category": "Mosaic",
        "subcategory": "Subway",
        "image_url": "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80",
    },
    {
        "design_number": "TN-7224",
        "design_name": "Hex Honeycomb",
        "company_name": "Coastal Tile Co.",
        "dimensions_options": ["8×9 in"],
        "product_category": "Mosaic",
        "subcategory": "Geometric",
        "image_url": "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=600&q=80",
    },
    {
        "design_number": "TN-8305",
        "design_name": "Calacatta Gold",
        "company_name": "Nordic Surfaces",
        "dimensions_options": ["24×48 in", "12×24 in", "24×24 in"],
        "product_category": "Porcelain",
        "subcategory": "Marble Look",
        "image_url": "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=600&q=80",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        get_site_settings(db)

        if db.query(Product).count() > 0:
            print("Database already has products. Skipping product seed.")
            return
        for item in SAMPLE_PRODUCTS:
            db.add(Product(**item))
        db.commit()
        print(f"Seeded {len(SAMPLE_PRODUCTS)} products.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
