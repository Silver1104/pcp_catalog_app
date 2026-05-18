# AI context — complete application reference

Dense reference for AI assistants. Human-readable docs: [docs/README.md](README.md). Entry point: [../AGENTS.md](../AGENTS.md).

## Repository purpose

B2B tile **design catalog**: wholesalers/manufacturers show tile designs with metadata (design #, name, company, category, subcategory, dimensions, image). Operators manage content via password-like API key admin UI.

## Tech stack

- **Frontend:** React 18, Vite 6, Tailwind 3, React Router 7 — SPA, no SSR
- **Backend:** FastAPI, Uvicorn, SQLAlchemy 2, Pydantic Settings 2, psycopg 3
- **DB:** PostgreSQL 16 (Docker)
- **Storage:** Cloudflare R2 via boto3 S3 API; images served via CDN URL

## Directory map

```
backend/app/
  main.py                 # FastAPI, CORS, lifespan, router mount
  config.py               # Settings from backend/.env (ENV_FILE absolute)
  database.py             # engine, SessionLocal, get_db
  models.py               # Product, SiteSettings ORM
  schemas.py              # Pydantic DTOs
  crud.py                 # queries, filters, delete+ R2 cleanup
  auth.py                 # require_admin (X-Admin-Key)
  migrate.py              # ALTER subcategory, image_object_key
  defaults.py             # DEFAULT_THEME, DEFAULT_SITE_SETTINGS
  routers/products.py     # GET products, filter-options
  routers/settings.py     # GET public settings
  routers/admin.py        # all admin + upload + bulk
  services/products.py    # build_product_data, bulk_create, upload
  services/design_numbers.py  # allocate_design_number(s)
  services/images.py      # PIL → WebP
  services/image_metadata.py  # classify + normalize URL/key
  services/taxonomy.py    # warnings for new cat/sub
  storage/r2.py           # upload, delete, object_key_from_cdn_url
  utils/paths.py          # slugify, build_product_image_key

frontend/src/
  App.jsx                 # Routes, BrandingProvider
  pages/CatalogPage.jsx   # public UI
  pages/AdminPage.jsx     # login, tabs
  hooks/useCatalog.js     # search/filters/products
  context/BrandingContext.jsx
  api/client.js           # apiFetch, apiUpload, sessionStorage key
  api/products.js, admin.js, settings.js
  components/             # SearchBar, FilterPanel, ProductGrid, ProductCard
  components/admin/       # ProductManager, ProductForm, BulkUploadForm, TaxonomySelect, BrandingForm
```

## Data model

### Product

- Many products per `(product_category, subcategory)` allowed
- `design_number`: string, auto format `{cat-slug}-{sub-slug}-{NNNN}` or manual
- `dimensions_options`: PostgreSQL `TEXT[]`
- `image_url`: what `<img src>` uses
- `image_object_key`: R2 key for delete; may be null for external URLs
- Computed `image_storage`: r2 | r2_linked | external | none

### SiteSettings

- Single row id=1: branding text + `theme` JSON (brand 50-950, accent)

## API summary

Public: `GET /api/health`, `/api/products`, `/api/products/filter-options`, `/api/settings`

Admin (header `X-Admin-Key`): verify, r2-status, taxonomy, taxonomy/check, upload-image, products/bulk-upload, products CRUD, settings CRUD

Filter logic: AND across all provided query params; `search` OR across text fields including subcategory and dimensions cast to string.

## Key behaviors

### Auto design number

`allocate_design_numbers(db, category, subcategory, count)` — scans existing design_numbers in pair matching `-NNNN` suffix under prefix.

### R2 path

Default: `{slug(cat)}/{slug(sub)}/{slug(design_number)}.webp`  
Fixed mode (`R2_USE_FIXED_IMAGE_NAME=true`): `{slug(cat)}/{slug(sub)}/image.webp` — **overwrites**

### Delete product

`crud.delete_product`: `delete_product_image` then SQL DELETE. Only the object key is removed, not prefix.

### Update product image

After fix: DB update first, then delete old R2 object if image changed.

### Bulk upload

Single transaction: allocate N design numbers, loop upload+insert, commit. On failure: rollback DB (orphan R2 objects possible if upload succeeded before failure — operational caveat).

### Admin frontend auth

`sessionStorage` key `catalog_admin_key`; sent as `X-Admin-Key` on admin requests.

### Branding

`GET /api/settings` → `applyTheme()` sets CSS vars `--brand-*`, `--accent*`. Tailwind uses `var(--brand-500)` etc.

## Configuration pitfalls

1. `.env` must be saved; loaded from `backend/.env` not cwd-relative only
2. Do not import settings router as `settings` in main.py
3. All 5 R2 vars required for uploads
4. CORS: `CORS_ORIGINS` comma-separated

## Extension checklist

New product field:

1. `models.py` column
2. `migrate.py` ALTER if needed
3. `schemas.py` ProductBase/Create/Update/Read
4. `crud._apply_filters` if searchable/filterable
5. `seed.py` samples
6. Frontend: ProductForm, ProductCard, FilterPanel, useCatalog EMPTY_FILTERS
7. `docs/API.md`, `docs/DATABASE.md`

## Testing commands

```bash
# Health
curl http://127.0.0.1:8000/api/health

# Products
curl "http://127.0.0.1:8000/api/products?subcategory=Marble%20Look"

# Admin verify
curl -X POST http://127.0.0.1:8000/api/admin/verify -H "X-Admin-Key: YOUR_KEY"
```

## Known gaps (do not assume implemented)

- Pagination
- Alembic migrations
- Unique DB constraint on design_number (app-level check on create)
- Rate limiting, JWT auth, user roles
- Automatic orphan R2 cleanup on failed bulk upload
- image_object_key backfill script for legacy rows

## Related files to read for tasks

| Task | Read first |
|------|------------|
| Image/R2 bug | `storage/r2.py`, `services/products.py`, `services/image_metadata.py` |
| Filters/search | `crud.py`, `useCatalog.js`, `FilterPanel.jsx` |
| Admin forms | `ProductForm.jsx`, `BulkUploadForm.jsx`, `routers/admin.py` |
| Theming | `defaults.py`, `BrandingForm.jsx`, `utils/theme.js` |
| Env issues | `config.py`, `ENVIRONMENT.md` |
