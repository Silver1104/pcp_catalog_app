import { apiFetch, apiUpload } from "./client";

export function verifyAdminKey() {
  return apiFetch("/api/admin/verify", { method: "POST" });
}

export function fetchTaxonomy() {
  return apiFetch("/api/admin/taxonomy");
}

export function checkTaxonomy({ product_category, subcategory, exclude_product_id }) {
  return apiFetch("/api/admin/taxonomy/check", {
    method: "POST",
    body: JSON.stringify({ product_category, subcategory, exclude_product_id }),
  });
}

export function uploadProductImage({ file, product_category, subcategory, design_number, exclude_product_id }) {
  const form = new FormData();
  form.append("file", file);
  form.append("product_category", product_category);
  form.append("subcategory", subcategory);
  form.append("design_number", design_number || "");
  if (exclude_product_id != null) {
    form.append("exclude_product_id", String(exclude_product_id));
  }
  return apiUpload("/api/admin/upload-image", form);
}

const BULK_BATCH_SIZE = 8;

function chunkFiles(files, size) {
  const batches = [];
  for (let i = 0; i < files.length; i += size) {
    batches.push(files.slice(i, i + size));
  }
  return batches;
}

export function bulkUploadProducts({ files, product_category, subcategory, company_name, dimensions_options }) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));
  form.append("product_category", product_category);
  form.append("subcategory", subcategory);
  form.append("company_name", company_name);
  form.append("dimensions_options", dimensions_options || "");
  return apiUpload("/api/admin/products/bulk-upload", form);
}

/** Upload in small batches so Render free tier does not kill the API mid-request. */
export async function bulkUploadProductsBatched(
  { files, product_category, subcategory, company_name, dimensions_options },
  { onProgress } = {}
) {
  const batches = chunkFiles(files, BULK_BATCH_SIZE);
  let count = 0;
  const warnings = new Set();

  for (let i = 0; i < batches.length; i += 1) {
    onProgress?.({
      batch: i + 1,
      totalBatches: batches.length,
      filesInBatch: batches[i].length,
      totalFiles: files.length,
    });
    const result = await bulkUploadProducts({
      files: batches[i],
      product_category,
      subcategory,
      company_name,
      dimensions_options,
    });
    count += result.count ?? 0;
    (result.warnings || []).forEach((w) => warnings.add(w));
  }

  return { count, warnings: [...warnings] };
}

export function fetchAdminProducts() {
  return apiFetch("/api/admin/products");
}

export function createProduct(data) {
  return apiFetch("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id, data) {
  return apiFetch(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id) {
  return apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
}

export function fetchAdminSettings() {
  return apiFetch("/api/admin/settings");
}

export function updateSettings(data) {
  return apiFetch("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
