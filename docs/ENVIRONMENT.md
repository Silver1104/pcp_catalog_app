# Environment variables

## Backend (`backend/.env`)

Loaded from **`backend/.env`** using an absolute path (`backend/app/config.py`).  
You must **save** the file and **restart** `uvicorn` after changes.

Copy template:

```bash
copy backend\.env.example backend\.env
```

### Required for basic operation

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+psycopg://catalog:catalog@localhost:5432/catalog` | SQLAlchemy connection URL |
| `ADMIN_API_KEY` | `your-strong-secret` | Protects all `/api/admin/*` routes |

### Required for R2 image uploads

All five must be non-empty for `is_r2_configured() === true`:

| Variable | Description |
|----------|-------------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | Bucket name |
| `R2_PUBLIC_CDN_URL` | Public CDN base URL, **no trailing slash** |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `R2_ENDPOINT_URL` | `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com` | S3 API endpoint |
| `R2_USE_FIXED_IMAGE_NAME` | `false` | `true` → `{cat}/{sub}/image.webp` (one file per folder, overwrites) |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed browser origins |

### Example `.env`

```env
DATABASE_URL=postgresql+psycopg://catalog:catalog@localhost:5432/catalog
ADMIN_API_KEY=change-me-in-production

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_CDN_URL=

R2_USE_FIXED_IMAGE_NAME=false
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://catalog.yourcompany.com
```

## Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL. Empty = same origin (works with Vite `/api` proxy in dev). Production example: `https://api.yourcompany.com` |

Set in `frontend/.env` or build-time environment.

## Docker Compose (PostgreSQL only)

Defined in `docker-compose.yml`:

| Variable | Value |
|----------|-------|
| `POSTGRES_USER` | `catalog` |
| `POSTGRES_PASSWORD` | `catalog` |
| `POSTGRES_DB` | `catalog` |
| Port | `5432` |

## Security notes

- Never commit `backend/.env` to git (listed in `.gitignore`).
- Do not put real secrets in `.env.example`.
- Use HTTPS in production.
- Restrict R2 API tokens to one bucket with minimum permissions.
