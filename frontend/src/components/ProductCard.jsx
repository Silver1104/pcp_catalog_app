export default function ProductCard({ product }) {
  const initials = product.design_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-brand-200/60 bg-white shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.design_name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-200 to-brand-300">
            <span className="font-display text-3xl font-semibold text-brand-600/80">{initials}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-brand-900/85 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
          {product.design_number}
        </span>
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
          <span className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-brand-950">
            {product.product_category}
          </span>
          {product.subcategory && (
            <span className="rounded-md bg-brand-900/75 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              {product.subcategory}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-brand-900 sm:text-xl">
            {product.design_name}
          </h3>
          <p className="mt-1 text-sm text-brand-500">{product.company_name}</p>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand-400">
            Available sizes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {product.dimensions_options.map((dim) => (
              <span
                key={dim}
                className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-200/80"
              >
                {dim}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
