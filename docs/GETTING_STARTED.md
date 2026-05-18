# Getting started

Step-by-step guide to run the Tile Catalog on your machine.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Recent | PostgreSQL |
| Python | 3.11+ (3.12–3.14 tested) | Backend API |
| Node.js | 18+ | Frontend dev server |

Optional: Cloudflare R2 account for image uploads (see [R2_SETUP.md](R2_SETUP.md)).

## 1. Clone and open the project

```bash
cd d:\Projects\catalog   # or your clone path
```

## 2. Start the database

```bash
docker compose up -d
```

Verify Postgres is healthy:

```bash
docker compose ps
```

Default connection (matches `.env.example`):

- Host: `localhost:5432`
- User / password / database: `catalog` / `catalog` / `catalog`

## 3. Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Configure environment

```powershell
copy .env.example .env
```

Edit `backend/.env`:

1. Set `ADMIN_API_KEY` to a strong secret (required for admin).
2. For image uploads, fill all `R2_*` variables (see [ENVIRONMENT.md](ENVIRONMENT.md) and [R2_SETUP.md](R2_SETUP.md)).
3. **Save the file** (Ctrl+S). The API reads from disk, not unsaved editor buffers.

### Seed sample data (optional)

```powershell
python seed.py
```

Adds 8 sample products (external Unsplash URLs) and default site settings. Skips if products already exist.

### Run the API

```powershell
uvicorn app.main:app --reload --port 8000
```

Check:

- Health: http://127.0.0.1:8000/api/health
- Swagger: http://127.0.0.1:8000/docs

Startup log should show either `R2 uploads enabled` or `R2 uploads disabled`.

## 4. Frontend setup

New terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

- Catalog: http://localhost:5173/
- Admin: http://localhost:5173/admin

Vite proxies `/api` to port 8000 in development.

## 5. Sign in to admin

1. Go to http://localhost:5173/admin
2. Enter the value of `ADMIN_API_KEY` from `backend/.env`
3. Use **Products** or **Branding** tabs

## 6. Production build (frontend)

```powershell
cd frontend
npm run build
npm run preview
```

Set `VITE_API_URL` to your public API origin if the API is not on the same host.

## Next steps

- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — how to add products and upload images
- [R2_SETUP.md](R2_SETUP.md) — Cloudflare R2 configuration
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — if something fails
