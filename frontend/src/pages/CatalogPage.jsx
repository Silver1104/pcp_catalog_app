import { useState } from "react";
import { Link } from "react-router-dom";
import FilterPanel from "../components/FilterPanel";
import ProductGrid from "../components/ProductGrid";
import SearchBar from "../components/SearchBar";
import { useBranding } from "../context/BrandingContext";
import { useCatalog } from "../hooks/useCatalog";

export default function CatalogPage() {
  const [showFilters, setShowFilters] = useState(false);
  const catalog = useCatalog();
  const { settings } = useBranding();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-brand-200/80 bg-brand-50/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              {settings.logo_url && (
                <img
                  src={settings.logo_url}
                  alt=""
                  className="h-12 w-12 rounded-lg object-contain ring-1 ring-brand-200"
                />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
                  {settings.tagline}
                </p>
                <h1 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
                  {settings.catalog_title}
                </h1>
                <p className="mt-0.5 text-sm text-brand-500">{settings.company_name}</p>
              </div>
            </div>
            <p className="text-sm text-brand-500">
              {catalog.loading
                ? "Loading…"
                : `${catalog.resultCount} design${catalog.resultCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="mt-4">
            <SearchBar value={catalog.search} onChange={catalog.setSearch} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 lg:gap-8">
          {catalog.filterOptionsError && (
            <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Filters unavailable: {catalog.filterOptionsError}. Is the API running?
            </p>
          )}
          <FilterPanel
            filters={catalog.filters}
            filterOptions={catalog.filterOptions}
            subcategoryOptions={catalog.subcategoryOptions}
            onFilterChange={catalog.updateFilter}
            onClearFilters={catalog.clearFilters}
            hasActiveFilters={catalog.hasActiveFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((v) => !v)}
          />
          <ProductGrid
            products={catalog.products}
            loading={catalog.loading}
            error={catalog.error}
          />
        </div>
      </main>

      <footer className="border-t border-brand-200/80 py-6 text-center text-xs text-brand-400">
        <p>{settings.footer_text}</p>
        <Link to="/admin" className="mt-2 inline-block text-brand-500 hover:text-brand-700">
          Admin
        </Link>
      </footer>
    </div>
  );
}
