"""Lightweight schema patches for existing databases."""

from sqlalchemy import inspect, text

from app.database import engine


def run_migrations() -> None:
    inspector = inspect(engine)
    if "products" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("products")}
    with engine.begin() as conn:
        if "subcategory" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE products "
                    "ADD COLUMN subcategory VARCHAR(128) NOT NULL DEFAULT 'General'"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_products_subcategory "
                    "ON products (subcategory)"
                )
            )
        if "image_object_key" not in columns:
            conn.execute(
                text("ALTER TABLE products ADD COLUMN image_object_key TEXT")
            )
