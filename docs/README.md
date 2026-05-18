# Documentation index

Complete documentation for the **Tile Design Catalog** application.

## Start here

| I want to… | Read |
|------------|------|
| Run the app locally | [GETTING_STARTED.md](GETTING_STARTED.md) |
| Understand how it works | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Use the admin panel | [ADMIN_GUIDE.md](ADMIN_GUIDE.md) |
| Configure Cloudflare R2 | [R2_SETUP.md](R2_SETUP.md) |
| Call or extend the API | [API.md](API.md) |
| Work on the database | [DATABASE.md](DATABASE.md) |
| Set environment variables | [ENVIRONMENT.md](ENVIRONMENT.md) |
| Fix a problem | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Give an AI full project context | [AI_CONTEXT.md](AI_CONTEXT.md) or [../AGENTS.md](../AGENTS.md) |

## Project overview

```
catalog/
├── AGENTS.md              # AI assistant entry point
├── README.md              # Short overview + quick start
├── docker-compose.yml     # PostgreSQL
├── docs/                  # This folder
├── backend/               # FastAPI API
│   ├── .env.example
│   ├── seed.py
│   └── app/
└── frontend/              # React catalog UI
    └── src/
```

## Feature summary

- **Public catalog** (`/`): search, filters (design #, name, company, category, subcategory, dimension), responsive product grid, dynamic branding/theme.
- **Admin** (`/admin`): product CRUD, bulk image upload, R2 or external URLs, auto design numbers, taxonomy warnings, branding editor.
- **Storage**: PostgreSQL for data; optional R2 for images with CDN URLs.

## Support checklist

1. Is Docker/Postgres running?
2. Is `backend/.env` **saved** and API restarted?
3. Does `/api/health` return OK?
4. For R2: check `/api/admin/r2-status` and [R2_SETUP.md](R2_SETUP.md).
5. See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
