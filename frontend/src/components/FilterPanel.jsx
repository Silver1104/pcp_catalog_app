function SelectField({ label, id, value, onChange, options, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-brand-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-brand-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterPanel({
  filters,
  filterOptions,
  subcategoryOptions,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  showFilters,
  onToggleFilters,
}) {
  return (
    <section className="rounded-2xl border border-brand-200/80 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-brand-800">Filters</h2>
        <button
          type="button"
          onClick={onToggleFilters}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 lg:hidden"
          aria-expanded={showFilters}
        >
          {showFilters ? "Hide" : "Show"}
        </button>
      </div>

      <div
        className={`mt-4 grid gap-4 transition-all ${
          showFilters ? "grid-rows-[1fr] opacity-100" : "max-lg:hidden lg:grid"
        }`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-design-number"
              className="text-xs font-semibold uppercase tracking-wide text-brand-500"
            >
              Design #
            </label>
            <input
              id="filter-design-number"
              type="text"
              value={filters.design_number}
              onChange={(e) => onFilterChange("design_number", e.target.value)}
              placeholder="e.g. TN-1042"
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="filter-design-name"
              className="text-xs font-semibold uppercase tracking-wide text-brand-500"
            >
              Design name
            </label>
            <input
              id="filter-design-name"
              type="text"
              value={filters.design_name}
              onChange={(e) => onFilterChange("design_name", e.target.value)}
              placeholder="e.g. Marble Vein"
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <SelectField
            label="Company"
            id="filter-company"
            value={filters.company_name}
            onChange={(v) => onFilterChange("company_name", v)}
            options={filterOptions.companies}
            placeholder="All companies"
          />

          <SelectField
            label="Category"
            id="filter-category"
            value={filters.product_category}
            onChange={(v) => onFilterChange("product_category", v)}
            options={filterOptions.categories}
            placeholder="All categories"
          />

          <SelectField
            label="Subcategory"
            id="filter-subcategory"
            value={filters.subcategory}
            onChange={(v) => onFilterChange("subcategory", v)}
            options={subcategoryOptions}
            placeholder="All subcategories"
          />

          <SelectField
            label="Dimension"
            id="filter-dimension"
            value={filters.dimension}
            onChange={(v) => onFilterChange("dimension", v)}
            options={filterOptions.dimensions}
            placeholder="All sizes"
          />
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end border-t border-brand-100 pt-4">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
