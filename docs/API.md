# API reference

Base URL (development): `http://127.0.0.1:8000`

Interactive docs: http://127.0.0.1:8000/docs

## Authentication

| Scope | Auth |
|-------|------|
| `/api/products`, `/api/settings`, `/api/health` | None |
| `/api/admin/*` | Header `X-Admin-Key: <ADMIN_API_KEY>` |

---

## Public endpoints

### `GET /api/health`

Health check.

**Response:** `{ "status": "ok" }`

---

### `GET /api/products`

List products with optional filters. All active filters combine with **AND** logic.

| Query param | Match type | Description |
|-------------|------------|-------------|
| `search` | Partial (any field) | design #, name, company, category, subcategory, dimensions |
| `design_number` | Partial | |
| `design_name` | Partial | |
| `company_name` | Exact | |
| `product_category` | Exact | |
| `subcategory` | Exact | |
| `dimension` | Exact | Must match one value in `dimensions_options` array |

**Response:** `ProductRead[]`

```json
{
  "id": 1,
  "design_number": "porcelain-marble-look-0001",
  "design_name": "Marble Vein White",
  "company_name": "Apex Ceramics",
  "dimensions_options": ["12×24 in", "24×24 in"],
  "product_category": "Porcelain",
  "subcategory": "Marble Look",
  "image_url": "https://cdn.example.com/...",
  "image_object_key": "porcelain/marble-look/porcelain-marble-look-0001.webp",
  "image_storage": "r2"
}
```

---

### `GET /api/products/filter-options`

Distinct values for catalog filter dropdowns.

**Response:**

```json
{
  "categories": ["Ceramic", "Porcelain"],
  "subcategories": ["Marble Look", "Mosaic"],
  "subcategories_by_category": {
    "Porcelain": ["Marble Look"]
  },
  "companies": ["Apex Ceramics"],
  "dimensions": ["12×24 in", "24×24 in"]
}
```

---

### `GET /api/settings`

Public site branding and theme (singleton).

**Response:** `company_name`, `tagline`, `catalog_title`, `footer_text`, `logo_url`, `theme` (brand + accent color maps).

---

## Admin endpoints

All require `X-Admin-Key`.

### `POST /api/admin/verify`

Validate admin key.

**Response:** `{ "ok": true, "r2_configured": boolean }`

---

### `GET /api/admin/r2-status`

Diagnostic: which R2 env vars are set (no secret values).

---

### `GET /api/admin/taxonomy`

Categories and subcategories derived from existing products.

---

### `POST /api/admin/taxonomy/check`

**Body:**

```json
{
  "product_category": "Porcelain",
  "subcategory": "New Sub",
  "exclude_product_id": null
}
```

**Response:** `warnings[]`, `is_new_category`, `is_new_subcategory`, `is_new_pair`

---

### `POST /api/admin/upload-image`

Multipart form upload → WebP → R2.

| Field | Required | Notes |
|-------|----------|-------|
| `file` | Yes | JPEG, PNG, WebP, GIF |
| `product_category` | Yes | |
| `subcategory` | Yes | |
| `design_number` | No | Auto-generated if empty |
| `exclude_product_id` | No | For taxonomy check on edit |

**Response:** `image_url`, `object_key`, `design_number`, `warnings[]`

---

### `POST /api/admin/products/bulk-upload`

Multipart: multiple images → multiple products (same category/subcategory).

| Field | Required |
|-------|----------|
| `files` | Yes (multiple) |
| `product_category` | Yes |
| `subcategory` | Yes |
| `company_name` | Yes |
| `dimensions_options` | No (comma-separated string) |

Requires R2 configured. Auto design # and name per file.

**Response:** `{ "created": ProductRead[], "count": number, "warnings": [] }`

---

### `GET /api/admin/products`

All products, unfiltered, sorted by design number.

---

### `POST /api/admin/products`

Create product (JSON).

| Field | Required | Notes |
|-------|----------|-------|
| `company_name` | Yes | |
| `product_category` | Yes | |
| `subcategory` | Yes | |
| `dimensions_options` | Yes | At least one |
| `design_number` | No | Auto-generated if empty |
| `design_name` | No | Auto-generated if empty |
| `image_url` | No | |
| `image_object_key` | No | Set after R2 upload |

---

### `PUT /api/admin/products/{product_id}`

Partial update. Changing image deletes **previous** R2 object after successful DB update.

---

### `DELETE /api/admin/products/{product_id}`

Deletes product row and associated R2 object (not the category/subcategory prefix).

---

### `GET /api/admin/settings` · `PUT /api/admin/settings`

Read/update site branding and theme JSON.

---

## Error responses

FastAPI returns `{ "detail": "message" }` or validation error array for 422.

| Status | Typical cause |
|--------|----------------|
| 401 | Missing/wrong admin key |
| 400 | Validation, empty update |
| 404 | Product not found |
| 502 | R2 upload/delete failure |
| 503 | R2 not configured |
