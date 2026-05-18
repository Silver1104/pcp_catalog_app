# Cloudflare R2 image storage — setup guide

> See also: [Documentation index](README.md) · [Troubleshooting](TROUBLESHOOTING.md)

This catalog stores product photos in **Cloudflare R2** and serves them through your **CDN URL**. Follow these steps in order.

---

## Step 1: Create an R2 bucket

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com).
2. Go to **R2 Object Storage** → **Create bucket**.
3. Name it (e.g. `tile-catalog-images`) and choose a region.
4. Note the bucket name for `R2_BUCKET_NAME`.

---

## Step 2: Create API credentials

1. In R2, open **Manage R2 API Tokens** → **Create API token**.
2. Permissions: **Object Read & Write** on your bucket (or Admin Read & Write for testing).
3. Copy:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY`
4. Your **Account ID** is on the R2 overview page → `R2_ACCOUNT_ID`.

---

## Step 3: Connect a public CDN domain

R2 buckets are private by default. Use a **custom domain** so the catalog can load images in the browser.

### Option A — R2 custom domain (recommended)

1. Open your bucket → **Settings** → **Custom Domains** → **Connect Domain**.
2. Choose a subdomain, e.g. `cdn.yourcompany.com`.
3. Cloudflare will add the DNS record if the zone is on Cloudflare.
4. Set in `.env`:

```env
R2_PUBLIC_CDN_URL=https://cdn.yourcompany.com
```

### Option B — Cloudflare Workers / public bucket

For production, prefer a custom domain with caching. Avoid exposing the raw `r2.cloudflarestorage.com` URL in the catalog.

---

## Step 4: Configure the backend

In `backend/`, copy the example env file and fill in values:

```powershell
cd backend
copy .env.example .env
```

Edit `.env`:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=tile-catalog-images
R2_PUBLIC_CDN_URL=https://cdn.yourcompany.com
R2_USE_FIXED_IMAGE_NAME=false
```

| Variable | Purpose |
|----------|---------|
| `R2_USE_FIXED_IMAGE_NAME=false` | Each product image is stored as `{category}/{subcategory}/{design-number}.webp` (safe when many products share a subcategory). |
| `R2_USE_FIXED_IMAGE_NAME=true` | Single file per folder: `{category}/{subcategory}/image.webp` (overwrites if you upload again). |

Restart the API after changing `.env`:

```powershell
uvicorn app.main:app --reload --port 8000
```

Sign in to **Admin** — the API reports `r2_configured: true` when upload is available.

---

## Design numbers (auto-serialized)

When design # is left empty, the API assigns:

`{category-slug}-{subcategory-slug}-0001`, `0002`, …

Example: `porcelain-marble-look-0003`

Each category + subcategory pair has its own sequence.

## Bulk upload

**Admin → Products → Bulk upload images**

- Pick category + subcategory (dropdowns)
- Select multiple image files
- Design # and name are assigned automatically (name from filename when possible)
- One product is created per image

## Step 5: How uploads work in Admin

1. Open **http://localhost:5173/admin** → **Products** → **Add product**.
2. Fill **Category**, **Subcategory**, and **Design #** (required for the storage path).
3. Under **Image**:
   - **Upload file** — JPEG/PNG/WebP/GIF; converted to WebP and uploaded to R2.
   - **Image URL** — use an existing CDN or external link (no upload).
4. If **category** or **subcategory** is new, a **warning** appears; check **I understand** before saving.
5. On save with upload, the API returns a CDN URL like:

   `https://cdn.yourcompany.com/porcelain/marble-look/tn-1042.webp`

That URL is saved on the product and shown in the public catalog.

---

## Step 6: Verify an upload

1. Upload a test product image in Admin.
2. In Cloudflare → R2 → your bucket → **Objects**, confirm the path exists.
3. Open the CDN URL in a browser (should return the image).
4. Open the public catalog and confirm the card shows the image.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `R2 is not configured` | Set all five `R2_*` variables and restart the backend. |
| `Failed to upload image to R2` | Check token permissions and bucket name. |
| Image 403 in browser | Custom domain not connected or DNS not propagated. |
| Wrong path in bucket | Paths use slugified names (lowercase, hyphens). Design # becomes the filename segment. |

---

## Security notes

- Never commit `.env` or API keys to git.
- Restrict the R2 token to **one bucket** and **write only** if possible.
- Use a strong `ADMIN_API_KEY` in production.
- CORS: the catalog loads images via `<img src="CDN URL">`; your CDN domain must allow public GET (default with custom domain).
