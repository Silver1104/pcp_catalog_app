import ProductCard from "./ProductCard";

export default function ProductGrid({ products, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-brand-200/60 bg-white"
          >
            <div className="aspect-[4/3] bg-brand-200" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 rounded bg-brand-200" />
              <div className="h-4 w-1/2 rounded bg-brand-100" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded bg-brand-100" />
                <div className="h-6 w-16 rounded bg-brand-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-800">Could not load catalog</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-white p-10 text-center shadow-card">
        <p className="font-display text-xl font-semibold text-brand-800">No designs found</p>
        <p className="mt-2 text-sm text-brand-500">
          Try adjusting your search or clear filters to see more products.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
