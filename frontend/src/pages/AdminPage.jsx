import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clearAdminKey, getAdminKey } from "../api/client";
import { verifyAdminKey } from "../api/admin";
import AdminLogin from "../components/admin/AdminLogin";
import BrandingForm from "../components/admin/BrandingForm";
import ProductManager from "../components/admin/ProductManager";

const TABS = [
  { id: "products", label: "Products" },
  { id: "branding", label: "Branding" },
];

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("products");
  const [r2Configured, setR2Configured] = useState(false);

  useEffect(() => {
    const key = getAdminKey();
    if (!key) {
      setChecking(false);
      return;
    }
    verifyAdminKey()
      .then((res) => {
        setAuthenticated(true);
        setR2Configured(Boolean(res.r2_configured));
      })
      .catch(() => clearAdminKey())
      .finally(() => setChecking(false));
  }, []);

  const signOut = () => {
    clearAdminKey();
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-brand-500">
        Checking session…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4 py-10">
        <AdminLogin
          onSuccess={(res) => {
            setAuthenticated(true);
            setR2Configured(Boolean(res?.r2_configured));
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="border-b border-brand-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-brand-900">Admin</h1>
            <p className="text-sm text-brand-500">Manage catalog products and site branding</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
            >
              View catalog
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg px-3 py-1.5 text-sm text-brand-500 hover:bg-brand-50"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "border-brand-600 text-brand-800"
                  : "border-transparent text-brand-500 hover:text-brand-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {tab === "products" ? <ProductManager r2Configured={r2Configured} /> : <BrandingForm />}
      </main>
    </div>
  );
}
