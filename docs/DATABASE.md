# Database

PostgreSQL 16 via Docker Compose (see root `docker-compose.yml`).

Connection string format:

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
```

## Tables

### `products`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | PK | Auto-increment |
| `design_number` | VARCHAR(64) | No | Indexed; not UNIQUE at DB level |
| `design_name` | VARCHAR(256) | No | Indexed |
| `company_name` | VARCHAR(256) | No | Indexed |
| `dimensions_options` | TEXT[] | No | PostgreSQL array of size strings |
| `product_category` | VARCHAR(128) | No | Indexed |
| `subcategory` | VARCHAR(128) | No | Indexed |
| `image_url` | TEXT | Yes | Public URL shown in catalog |
| `image_object_key` | TEXT | Yes | R2 object key for delete/upload tracking |

**Multiple rows** may share the same `product_category` + `subcategory`.

### `site_settings`

Singleton row (`id = 1`).

| Column | Type | Description |
|--------|------|-------------|
| `company_name` | VARCHAR(256) | |
| `tagline` | VARCHAR(256) | |
| `catalog_title` | VARCHAR(256) | |
| `footer_text` | VARCHAR(512) | |
| `logo_url` | TEXT | Optional |
| `theme` | JSONB/JSON | Brand color map + accent colors |

Created automatically on first `GET /api/settings` if missing (defaults in `app/defaults.py`).

## Schema management

- **New installs:** `Base.metadata.create_all()` on API startup.
- **Upgrades:** `app/migrate.py` runs additive `ALTER TABLE` for:
  - `products.subcategory` (default `'General'`)
  - `products.image_object_key`

There is **no Alembic**. For new columns, add to `models.py` and extend `migrate.py`.

## Design number allocation

Implemented in `app/services/design_numbers.py`.

**Prefix:** `slugify(category) + "-" + slugify(subcategory)`

**Next number:** Max existing suffix `-NNNN` (4+ digits) for products in that category/subcategory pair, then +1.

**Examples:**

| Category | Subcategory | Generated IDs |
|----------|-------------|---------------|
| Porcelain | Marble Look | `porcelain-marble-look-0001`, `0002`, … |

Manual design numbers (e.g. seed `TN-1042`) do not consume auto-sequence slots unless they match the prefix pattern with `-NNNN` suffix.

**Uniqueness:** Application checks duplicate `design_number` on create; not enforced by DB unique index.

## Seeding

```bash
cd backend
python seed.py
```

- Ensures `site_settings` row exists.
- Inserts 8 sample products if table is empty (external image URLs).

## Useful SQL

```sql
-- Products per subcategory
SELECT product_category, subcategory, COUNT(*)
FROM products
GROUP BY 1, 2
ORDER BY 1, 2;

-- Image storage breakdown
SELECT
  CASE
    WHEN image_object_key IS NOT NULL THEN 'r2'
    WHEN image_url IS NOT NULL THEN 'has_url'
    ELSE 'none'
  END AS storage,
  COUNT(*)
FROM products
GROUP BY 1;
```

## Backup

Standard PostgreSQL tools:

```bash
docker compose exec db pg_dump -U catalog catalog > backup.sql
```
