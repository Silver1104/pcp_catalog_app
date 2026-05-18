# Tile Design Catalog

A mobile-first product catalog for tile manufacturing and wholesale: browse designs, search and filter, and manage products and branding through an admin panel.

## Quick start

```bash
# 1. Database
docker compose up -d

# 2. Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env            # edit ADMIN_API_KEY (+ R2 for uploads)
python seed.py
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- **Catalog:** http://localhost:5173  
- **Admin:** http://localhost:5173/admin  
- **API docs:** http://127.0.0.1:8000/docs  

Full setup: **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)**

## Documentation

| Document | Description |
|----------|-------------|
| **[docs/README.md](docs/README.md)** | Documentation index |
| [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) | Detailed setup |
| [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | Using the admin panel |
| [docs/R2_SETUP.md](docs/R2_SETUP.md) | Cloudflare R2 images |
| [docs/API.md](docs/API.md) | HTTP API reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |
| **[AGENTS.md](AGENTS.md)** | AI assistant entry point |
| [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md) | Full context for AI |

## Stack

React · Vite · Tailwind · FastAPI · PostgreSQL · Cloudflare R2 (optional)

## Features

- Product grid with search and filters (category, subcategory, company, dimensions, …)
- Dynamic branding and color theme
- Admin: product CRUD, bulk image upload, R2 or external URLs
- Auto-generated design numbers per category/subcategory
- R2 image cleanup when products are deleted

## Project structure

```
catalog/
├── AGENTS.md              # AI context entry
├── docs/                  # Full documentation
├── backend/               # FastAPI + SQLAlchemy
├── frontend/              # React catalog UI
└── docker-compose.yml     # PostgreSQL
```

## License

Private / internal use — adjust as needed for your organization.
