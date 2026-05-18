const API_BASE = import.meta.env.VITE_API_URL ?? "";
const ADMIN_KEY_STORAGE = "catalog_admin_key";

export function getAdminKey() {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE);
}

export function setAdminKey(key) {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
}

export function clearAdminKey() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}

export async function apiUpload(path, formData) {
  const headers = {};
  const adminKey = getAdminKey();
  if (adminKey) {
    headers["X-Admin-Key"] = adminKey;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
      if (Array.isArray(detail)) detail = detail.map((d) => d.msg || d).join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(detail || "Upload failed");
  }
  return res.json();
}

export async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const adminKey = getAdminKey();
  if (adminKey) {
    headers["X-Admin-Key"] = adminKey;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? (typeof body.detail === "string" ? body.detail : JSON.stringify(body));
      if (Array.isArray(detail)) detail = detail.map((d) => d.msg || d).join(", ");
    } catch {
      /* ignore */
    }
    throw new Error(detail || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}
