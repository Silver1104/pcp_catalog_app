# Troubleshooting

## Setup and startup

### API fails on startup: `AttributeError: module ... settings`

**Cause:** Import name clash between `app.config.settings` and `app.routers.settings`.

**Fix:** Ensure `main.py` imports the router as `site_settings_router`. Pull latest code.

---

### `R2 uploads disabled` in logs but `.env` looks filled

**Cause:** `.env` not saved to disk, or API started from wrong directory before path fix.

**Fix:**

1. Save `backend/.env` (Ctrl+S).
2. Restart uvicorn from `backend/`.
3. Check: `GET /api/admin/r2-status` with admin key — all vars should be `true`.

---

### `docker compose` cannot connect

**Fix:** Start Docker Desktop. Run `docker compose up -d` from project root.

---

### Frontend cannot reach API

**Checks:**

1. API running on port 8000?
2. `GET http://127.0.0.1:8000/api/health`
3. Vite proxy: requests go to `/api/...` on port 5173
4. Production: set `VITE_API_URL` to API origin; add frontend origin to `CORS_ORIGINS`

---

## Catalog

### Filters are empty

**Cause:** `GET /api/products/filter-options` failed (API down or CORS).

**Fix:** Start API; check browser Network tab. Ensure CORS includes your frontend origin.

---

### Search returns nothing

**Cause:** Filters still active, or no matching products.

**Fix:** Click **Clear filters**. Try broader search terms.

---

### Branding/theme not updating

**Fix:** Hard-refresh catalog. Confirm save in Admin → Branding. Check `GET /api/settings` response.

---

## Images and R2

### Image on website but not in R2 bucket

**Cause:** Product uses **External** URL (seed data, pasted Unsplash link, or Image URL mode).

**Fix:** Admin → Products → check **Image** column. Re-upload via **Upload to R2**.

See [ADMIN_GUIDE.md](ADMIN_GUIDE.md).

---

### Only one file per subcategory in R2

**Cause:** `R2_USE_FIXED_IMAGE_NAME=true` overwrites `image.webp`.

**Fix:** Set `R2_USE_FIXED_IMAGE_NAME=false`, restart API. Re-upload products.

**Expected (default):** Multiple files like:

```text
porcelain/marble-look/porcelain-marble-look-0001.webp
porcelain/marble-look/porcelain-marble-look-0002.webp
```

---

### Upload fails with 502

**Checks:**

1. R2 token has write permission on bucket.
2. Bucket name matches `R2_BUCKET_NAME`.
3. `R2_ENDPOINT_URL` correct if custom.

---

### Image 403 in browser

**Cause:** CDN/custom domain not public or DNS not ready.

**Fix:** Complete R2 custom domain setup ([R2_SETUP.md](R2_SETUP.md)).

---

### Deleted product but file remains in R2

**Cause:** Product had **External** image (nothing to delete) or `image_object_key` was missing.

**Fix:** For CDN URLs, ensure `image_object_key` is set (re-save product after upload).

---

## Admin

### Cannot sign in

**Fix:**

1. **Production (Render):** Copy `ADMIN_API_KEY` from the **API** service environment in the Render dashboard — not from your laptop’s `backend/.env` unless you set the same value on Render.
2. **Local:** Match `ADMIN_API_KEY` in `backend/.env` exactly.
3. Restart the API after changing the key on the server.
4. Sign out on `/admin`, or clear site data / `sessionStorage` key `catalog_admin_key`, then sign in again.
5. Remove `VITE_ADMIN_API_KEY` from `frontend/.env` if present — it does not belong in the frontend and was never used correctly.

---

### Bulk upload disabled

**Cause:** R2 not configured.

**Fix:** Complete [R2_SETUP.md](R2_SETUP.md).

---

### Bulk upload failed / health check timeout / images in R2 but not on site

**Cause:** Uploading dozens of images in one request blocks the API. On Render, the instance stops responding to `/api/health` for 5+ seconds and is restarted. Images may reach R2 before the database **commit** (which only ran at the end), so the catalog stays empty.

**Fix:**

1. Deploy the latest code (chunked DB commits + frontend batches of 8).
2. In **Admin → Products**, confirm nothing was saved (refresh the list).
3. Re-upload in smaller sets (the UI now batches automatically). Or upload ~10 images at a time manually.
4. Optional: delete orphan objects in the R2 bucket under `{category}/{subcategory}/` for that failed run (they have no matching products).
5. On Render, consider increasing the health check timeout in the API service settings if you still hit limits.

---

### Design number collision

**Cause:** Manual design # already exists.

**Fix:** Leave design # blank for auto-generation, or use a unique manual ID.

---

## Database

### `subcategory` column missing

**Fix:** Restart API (runs `migrate.py`). Or run:

```sql
ALTER TABLE products ADD COLUMN subcategory VARCHAR(128) NOT NULL DEFAULT 'General';
```

---

### Reset database

```bash
docker compose down -v
docker compose up -d
cd backend
python seed.py
```

**Warning:** Deletes all data.

---

## Getting help

1. Note error from browser Network tab or API logs.
2. Check `/api/admin/r2-status` and `/api/health`.
3. Review [ARCHITECTURE.md](ARCHITECTURE.md) and [AI_CONTEXT.md](AI_CONTEXT.md).
