# AI / Agent context — Tile Catalog

This file is the **entry point for AI assistants** working in this repository. Read it first, then follow links for depth.

## What this project is

A **tile design catalog** for manufacturing/wholesale: public browse/search/filter UI + admin panel for products, branding, and Cloudflare R2 image storage.

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | React 18, Vite 6, Tailwind 3, React Router 7 | `frontend/src/` |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2 | `backend/app/` |
| Database | PostgreSQL 16 | `docker-compose.yml` |
| Images | Cloudflare R2 (S3 API), optional | `backend/app/storage/r2.py` |

## Documentation map

| Doc | Audience | Contents |
|-----|----------|----------|
| [README.md](README.md) | Humans | Quick start, feature summary |
| [docs/README.md](docs/README.md) | Everyone | Full documentation index |
| [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) | New developers | Step-by-step setup |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Devs / AI | System design, data flows |
| [docs/API.md](docs/API.md) | Devs / AI | All HTTP endpoints |
| [docs/DATABASE.md](docs/DATABASE.md) | Devs / AI | Tables, migrations, design numbers |
| [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | Operators | Admin UI workflows |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | DevOps | Env vars |
| [docs/R2_SETUP.md](docs/R2_SETUP.md) | DevOps | Cloudflare R2 + CDN |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Support | Common issues |
| [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md) | DevOps | Render deployment |
| [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md) | AI | Dense full-context reference |

## Critical conventions

1. **Config**: `backend/.env` is loaded via absolute path (`backend/app/config.py` → `ENV_FILE`). Server must be restarted after `.env` changes.
2. **Router naming**: Site settings router is imported as `site_settings_router` in `main.py` — do not shadow `app.config.settings`.
3. **Multiple products per subcategory**: Supported. R2 path default: `{category}/{subcategory}/{design-number}.webp`. Set `R2_USE_FIXED_IMAGE_NAME=false` (default).
4. **Admin auth**: Header `X-Admin-Key` on all `/api/admin/*` routes; frontend stores key in `sessionStorage` (`catalog_admin_key`).
5. **Image storage types**: `r2`, `r2_linked`, `external`, `none` — see `app/services/image_metadata.py`.
6. **No Alembic**: Schema via `create_all` + `app/migrate.py` for additive columns only.

## Key paths

```
backend/app/main.py          # App entry, CORS, lifespan
backend/app/routers/admin.py # Admin API + uploads
backend/app/services/products.py  # Create, bulk upload
backend/app/services/design_numbers.py  # Auto design # allocation
frontend/src/App.jsx         # Routes / and /admin
frontend/src/pages/CatalogPage.jsx
frontend/src/components/admin/ProductManager.jsx
```

## Commands

```bash
docker compose up -d
cd backend && .venv\Scripts\activate && pip install -r requirements.txt
copy .env.example .env   # edit, save, then:
python seed.py
uvicorn app.main:app --reload --port 8000

cd frontend && npm install && npm run dev
```

## When changing code

- **New product field**: `models.py` → `migrate.py` → `schemas.py` → `crud.py` → filters in `crud._apply_filters` → frontend forms/filters/cards.
- **New API route**: router → document in `docs/API.md`.
- **R2 behavior**: `storage/r2.py`, `utils/paths.py`, `services/products.py`.

Do not commit `backend/.env` or real API keys. See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).
