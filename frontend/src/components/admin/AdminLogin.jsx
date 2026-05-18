import { useState } from "react";
import { clearAdminKey, setAdminKey } from "../../api/client";
import { verifyAdminKey } from "../../api/admin";

export default function AdminLogin({ onSuccess }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setAdminKey(key.trim());
    try {
      const res = await verifyAdminKey();
      onSuccess(res);
    } catch (err) {
      clearAdminKey();
      setError(err.message || "Invalid admin key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-brand-200 bg-white p-6 shadow-card sm:p-8">
      <h1 className="font-display text-2xl font-bold text-brand-900">Admin sign in</h1>
      <p className="mt-2 text-sm text-brand-500">
        Enter your admin API key to manage products and branding.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="admin-key" className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Admin API key
          </label>
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            placeholder="From server ADMIN_API_KEY"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
