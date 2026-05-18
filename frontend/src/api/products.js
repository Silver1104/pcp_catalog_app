const API_BASE = import.meta.env.VITE_API_URL ?? "";

function buildQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && String(value).trim() !== "") {
      searchParams.set(key, String(value).trim());
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchProducts(filters = {}) {
  const res = await fetch(`${API_BASE}/api/products${buildQuery(filters)}`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/api/products/filter-options`);
  if (!res.ok) throw new Error("Failed to load filter options");
  return res.json();
}
