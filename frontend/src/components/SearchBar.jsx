export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <label htmlFor="catalog-search" className="sr-only">
        Search designs
      </label>
      <span
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400"
        aria-hidden
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </span>
      <input
        id="catalog-search"
        type="search"
        placeholder="Search by design #, name, company, category, subcategory, size…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-brand-200 bg-white py-3 pl-11 pr-4 text-base text-brand-900 shadow-sm placeholder:text-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        autoComplete="off"
      />
    </div>
  );
}
