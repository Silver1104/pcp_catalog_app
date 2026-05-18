import { useEffect, useState } from "react";
import { fetchAdminSettings, updateSettings } from "../../api/admin";
import { useBranding } from "../../context/BrandingContext";
import { applyTheme, DEFAULT_THEME } from "../../utils/theme";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

const BRAND_SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const ACCENT_KEYS = [
  { key: "DEFAULT", label: "Accent (main)" },
  { key: "light", label: "Accent light" },
  { key: "dark", label: "Accent dark" },
];

function ColorRow({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded border border-brand-200"
      />
      <div className="min-w-0 flex-1">
        <label className="text-xs text-brand-500">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full rounded border border-brand-200 px-2 py-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export default function BrandingForm() {
  const { reloadSettings } = useBranding();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminSettings()
      .then((data) => setForm(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-brand-500">Loading branding…</p>;
  if (!form) return <p className="text-sm text-red-600">{error || "Failed to load settings"}</p>;

  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setBrandColor = (shade, hex) => {
    setForm((f) => ({
      ...f,
      theme: {
        ...f.theme,
        brand: { ...f.theme.brand, [shade]: hex },
      },
    }));
    applyTheme({
      ...form.theme,
      brand: { ...form.theme.brand, [shade]: hex },
    });
  };

  const setAccentColor = (key, hex) => {
    setForm((f) => ({
      ...f,
      theme: {
        ...f.theme,
        accent: { ...f.theme.accent, [key]: hex },
      },
    }));
    applyTheme({
      ...form.theme,
      accent: { ...form.theme.accent, [key]: hex },
    });
  };

  const resetTheme = () => {
    setForm((f) => ({ ...f, theme: DEFAULT_THEME }));
    applyTheme(DEFAULT_THEME);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateSettings({
        company_name: form.company_name,
        tagline: form.tagline,
        catalog_title: form.catalog_title,
        footer_text: form.footer_text,
        logo_url: form.logo_url || null,
        theme: form.theme,
      });
      await reloadSettings();
      setMessage("Branding saved. Changes appear on the catalog immediately.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-xl font-semibold text-brand-900">Company & copy</h2>
        <p className="mt-1 text-sm text-brand-500">Text shown in the catalog header and footer.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Company name</label>
            <input className={inputClass} value={form.company_name} onChange={setField("company_name")} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Tagline</label>
            <input className={inputClass} value={form.tagline} onChange={setField("tagline")} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Catalog title</label>
            <input className={inputClass} value={form.catalog_title} onChange={setField("catalog_title")} required />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Logo URL</label>
            <input className={inputClass} type="url" value={form.logo_url || ""} onChange={setField("logo_url")} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Footer text</label>
            <input className={inputClass} value={form.footer_text} onChange={setField("footer_text")} required />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-900">Color scheme</h2>
            <p className="mt-1 text-sm text-brand-500">Live preview as you adjust colors.</p>
          </div>
          <button
            type="button"
            onClick={resetTheme}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
          >
            Reset to defaults
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-brand-700">Brand palette</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {BRAND_SHADES.map((shade) => (
                <ColorRow
                  key={shade}
                  label={`Brand ${shade}`}
                  value={form.theme.brand[shade] || "#000000"}
                  onChange={(hex) => setBrandColor(shade, hex)}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-brand-700">Accent colors</h3>
            <div className="grid gap-2">
              {ACCENT_KEYS.map(({ key, label }) => (
                <ColorRow
                  key={key}
                  label={label}
                  value={form.theme.accent[key] || "#000000"}
                  onChange={(hex) => setAccentColor(key, hex)}
                />
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-brand-200 p-4">
              <p className="text-xs font-semibold uppercase text-brand-400">Preview</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white">Primary button</span>
                <span className="rounded-md bg-accent px-3 py-1.5 text-sm text-brand-950">Accent badge</span>
                <span className="rounded-md bg-brand-100 px-3 py-1.5 text-sm text-brand-800">Muted surface</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {message && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save branding"}
      </button>
    </form>
  );
}
