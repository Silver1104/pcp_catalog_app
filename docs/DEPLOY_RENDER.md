# Deploy to Render

This guide deploys the Tile Catalog as three Render resources:

| Resource | Type | Purpose |
|----------|------|---------|
| `catalog-db` | PostgreSQL | Database |
| `catalog-api` | Web Service (Python) | FastAPI backend |
| `catalog-web` | Static Site | React frontend |

## Prerequisites

- [Render](https://render.com) account (free tier works for testing)
- GitHub/GitLab repo with this project pushed
- (Optional) Cloudflare R2 for image uploads — [R2_SETUP.md](R2_SETUP.md)

---

## Option A — One-click Blueprint (recommended)

### 1. Push code to Git

```bash
git init
git add .
git commit -m "Initial catalog"
git remote add origin https://github.com/YOU/catalog.git
git push -u origin main
```

### 2. Create Blueprint on Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect your repository
3. Render reads root **`render.yaml`** and creates 3 resources
4. Click **Apply**

### 3. Wait for deploy

- **catalog-api** builds first (Python + pip)
- **catalog-web** builds with `VITE_API_URL` pointing at the API URL
- **catalog-db** provisions PostgreSQL

### 4. Set CORS on the API

1. Open **catalog-web** → copy its URL (e.g. `https://catalog-web.onrender.com`)
2. Open **catalog-api** → **Environment** → set:

```env
CORS_ORIGINS=https://catalog-web.onrender.com
```

Use your exact static site URL (no trailing slash). Save to redeploy the API.

### 5. Save your admin key

1. Open **catalog-api** → **Environment**
2. Copy **`ADMIN_API_KEY`** (auto-generated) — you need this for `/admin`
3. Sign in at `https://catalog-web.onrender.com/admin`

### 6. Configure R2 (for image uploads)

On **catalog-api** → **Environment**, add:

```env
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_CDN_URL=https://your-cdn.example.com
R2_USE_FIXED_IMAGE_NAME=false
```

Save → service redeploys. See [R2_SETUP.md](R2_SETUP.md).

### 7. (Optional) Seed sample products

**catalog-api** → **Shell**:

```bash
python seed.py
```

### 8. Verify

| Check | URL |
|-------|-----|
| Catalog | `https://catalog-web.onrender.com` |
| API health | `https://catalog-api.onrender.com/api/health` |
| API docs | `https://catalog-api.onrender.com/docs` |
| Admin | `https://catalog-web.onrender.com/admin` |

---

## Option B — Manual setup (3 services)

### 1. PostgreSQL

1. **New** → **PostgreSQL**
2. Name: `catalog-db`, database `catalog`, user `catalog`
3. Create → copy **Internal Database URL** (or External if API is outside Render)

### 2. Backend (catalog-api)

1. **New** → **Web Service** → connect repo
2. Settings:

| Field | Value |
|-------|--------|
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

3. **Environment** variables:

| Key | Value |
|-----|--------|
| `PYTHON_VERSION` | `3.12.8` |
| `DATABASE_URL` | Paste Render Postgres URL (see note below) |
| `ADMIN_API_KEY` | Long random secret |
| `CORS_ORIGINS` | Your frontend URL, e.g. `https://catalog-web.onrender.com` |
| `R2_*` | Optional — see [ENVIRONMENT.md](ENVIRONMENT.md) |

**DATABASE_URL note:** Render gives `postgresql://...`. The app converts it to `postgresql+psycopg://` automatically.

4. Deploy → note URL: `https://catalog-api.onrender.com`

### 3. Frontend (catalog-web)

1. **New** → **Static Site** → same repo
2. Settings:

| Field | Value |
|-------|--------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

3. **Environment**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://catalog-api.onrender.com` (no trailing slash) |

4. Deploy → `https://catalog-web.onrender.com`

### 4. Fix CORS if needed

If the catalog loads but API calls fail (browser CORS error):

1. **catalog-api** → **Environment**
2. Set `CORS_ORIGINS` to exactly your static site URL
3. Redeploy API

---

## How the pieces connect

```text
Browser
  → catalog-web.onrender.com     (static HTML/JS)
  → catalog-api.onrender.com/api (JSON API)
  → catalog-db                   (PostgreSQL)
  → Cloudflare R2                (images, optional)
```

- Frontend build bakes in `VITE_API_URL` at **build time** — changing it requires **Rebuild** on the static site.
- Backend reads env at **runtime** — change env → automatic redeploy.

---

## SPA routing (React Router)

React Router handles `/admin` in the browser, but Render’s static host must **rewrite** unknown paths to `index.html`. Without this, visiting `/admin` directly returns **Not Found**.

### Manual deploy (required)

1. Open your **static site** on Render (the frontend service).
2. Go to **Redirects** (or **Redirects / Rewrites**).
3. Add a rule:

| Field | Value |
|-------|--------|
| Source | `/*` |
| Destination | `/index.html` |
| Action | **Rewrite** (not Redirect) |

4. Save. Test `https://your-site.onrender.com/admin` in a new tab.

### Blueprint deploy

`render.yaml` includes the same rewrite under `catalog-web` → `routes`. If you deployed before that was added, add the rule in the dashboard as above.

---

## Free tier limitations

- Services **spin down** after ~15 min idle (cold start ~30–60s)
- Free Postgres expires after 90 days (export data before then)
- For production: use paid instances + custom domains

---

## Custom domains

1. **catalog-web** → Settings → **Custom Domains** → e.g. `catalog.yourcompany.com`
2. **catalog-api** → e.g. `api.catalog.yourcompany.com`
3. Update **catalog-web** env: `VITE_API_URL=https://api.catalog.yourcompany.com` → **Manual Deploy**
4. Update **catalog-api** env: `CORS_ORIGINS=https://catalog.yourcompany.com`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS error in browser | Set `CORS_ORIGINS` on API to exact frontend URL |
| API 502 on cold start | Wait 1 min; free tier waking up |
| Database connection failed | Check `DATABASE_URL`; use Internal URL if both on Render |
| Admin upload disabled | Add all `R2_*` vars on API |
| `/admin` shows Not Found | Add Render rewrite: `/*` → `/index.html` (Rewrite) on the static site |
| Wrong API in production | Rebuild static site after changing `VITE_API_URL` |

More: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Files used for Render

| File | Purpose |
|------|---------|
| `render.yaml` | Blueprint definition |
| `backend/requirements.txt` | Python dependencies |
| `render.yaml` → `catalog-web.routes` | SPA rewrite for Blueprint deploys |
| `backend/app/config.py` | Env + Postgres URL normalization |
