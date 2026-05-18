import { apiFetch } from "./client";

export function fetchSettings() {
  return apiFetch("/api/settings");
}
