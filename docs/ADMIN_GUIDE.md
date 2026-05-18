# Admin guide

Admin URL: **http://localhost:5173/admin** (or your deployed origin + `/admin`).

## Sign in

1. Open the admin page.
2. Enter your `ADMIN_API_KEY` from `backend/.env`.
3. The key is stored in the browser session until you sign out.

If **Upload to R2** is disabled, configure R2 first ([R2_SETUP.md](R2_SETUP.md)) and restart the API.

## Products tab

### Product list

| Column | Meaning |
|--------|---------|
| Design # | Unique identifier (manual or auto) |
| Image badge | **R2** = in bucket · **External** = URL only · **R2 URL only** = fix by re-uploading |

### Add a single product

1. Click **+ Add product**.
2. **Category / Subcategory**: choose from dropdown or **+ Add new**.
3. **Design #** (optional): leave blank for auto `category-subcategory-0001` style ID.
4. **Design name** (optional): auto-generated if blank.
5. **Company** and **Dimensions** (required): comma-separated sizes.
6. **Image**:
   - **Upload to R2** — file is converted to WebP and stored in your bucket.
   - **Image URL** — paste CDN or external link (not stored in R2).
7. Acknowledge any **taxonomy warnings** for new category/subcategory.
8. Click **Save**.

### Bulk upload images

Use when many designs share the same category and subcategory.

1. Click **Bulk upload images**.
2. Select category and subcategory.
3. Enter company name and dimensions (applied to all new products).
4. Select **multiple image files**.
5. Design numbers and names are assigned automatically.
6. Save — one product per file.

### Edit a product

1. Click **Edit** on a row.
2. Design # cannot be changed (prevents breaking R2 paths).
3. Replace image via new upload or URL.
4. Save.

### Delete a product

1. Click **Delete** and confirm.
2. The database row is removed.
3. The **R2 image file** is deleted (if stored in R2).
4. The category/subcategory “folder” prefix in R2 is **not** deleted (other products may use it).

## Branding tab

Customize the public catalog appearance:

| Field | Effect |
|-------|--------|
| Company name | Shown under catalog title |
| Tagline | Small text above title |
| Catalog title | Main heading |
| Footer text | Footer line |
| Logo URL | Header logo image |
| Color scheme | Live-updated CSS variables on catalog |

Click **Save branding** to persist. Changes appear on the public site immediately after save.

## Taxonomy warnings

Shown when:

- Category does not exist yet on any product.
- Subcategory does not exist yet.
- Subcategory is new for an existing category.

Check **I understand** before proceeding.

## Best practices

1. Keep `R2_USE_FIXED_IMAGE_NAME=false` unless you intentionally want one image per subcategory folder.
2. Use **bulk upload** for batch imports; use **single add** for full metadata control.
3. Prefer **Upload to R2** over external URLs for production images.
4. Use consistent category/subcategory names (dropdowns reduce typos).
5. Rotate `ADMIN_API_KEY` if the key was ever exposed.

## Related docs

- [R2_SETUP.md](R2_SETUP.md)
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — image not in R2, etc.
- [API.md](API.md) — programmatic access
