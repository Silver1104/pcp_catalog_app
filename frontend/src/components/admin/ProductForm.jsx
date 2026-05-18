import { useCallback, useEffect, useState } from "react";
import { checkTaxonomy, fetchTaxonomy, uploadProductImage } from "../../api/admin";
import TaxonomySelect from "./TaxonomySelect";

const EMPTY = {
  design_number: "",
  design_name: "",
  company_name: "",
  dimensions_options: "",
  product_category: "",
  subcategory: "",
  image_url: "",
};

function toForm(product) {
  if (!product) return { ...EMPTY, imageMode: "upload" };
  return {
    design_number: product.design_number,
    design_name: product.design_name,
    company_name: product.company_name,
    dimensions_options: (product.dimensions_options || []).join(", "),
    product_category: product.product_category,
    subcategory: product.subcategory || "",
    image_url: product.image_url || "",
    imageMode: "url",
  };
}

function toPayload(form) {
  return {
    design_number: form.design_number.trim() || null,
    design_name: form.design_name.trim() || null,
    company_name: form.company_name.trim(),
    product_category: form.product_category.trim(),
    subcategory: form.subcategory.trim(),
    image_url: form.image_url.trim() || null,
    dimensions_options: form.dimensions_options
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function ProductForm({ product, onSave, onCancel, saving, r2Configured }) {
  const [form, setForm] = useState(() => toForm(product));
  const [taxonomy, setTaxonomy] = useState({ categories: [], subcategories: [], subcategories_by_category: {} });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(product?.image_url || null);
  const [warnings, setWarnings] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [taxonomyLoading, setTaxonomyLoading] = useState(false);

  const isEdit = Boolean(product);

  useEffect(() => {
    fetchTaxonomy().then(setTaxonomy).catch(() => {});
  }, []);

  const runTaxonomyCheck = useCallback(async () => {
    const category = form.product_category.trim();
    const sub = form.subcategory.trim();
    if (!category || !sub) {
      setWarnings([]);
      setAcknowledged(false);
      return;
    }
    setTaxonomyLoading(true);
    try {
      const result = await checkTaxonomy({
        product_category: category,
        subcategory: sub,
        exclude_product_id: product?.id ?? null,
      });
      setWarnings(result.warnings || []);
      setAcknowledged((result.warnings || []).length === 0);
    } catch {
      setWarnings([]);
    } finally {
      setTaxonomyLoading(false);
    }
  }, [form.product_category, form.subcategory, product?.id]);

  useEffect(() => {
    const timer = setTimeout(runTaxonomyCheck, 400);
    return () => clearTimeout(timer);
  }, [runTaxonomyCheck]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const needsAcknowledgement = warnings.length > 0 && !acknowledged;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsAcknowledgement) return;

    let imageUrl = form.image_url.trim() || null;
    let imageObjectKey = null;
    let designNumber = form.design_number.trim() || null;

    if (form.imageMode === "upload" && imageFile) {
      if (!r2Configured) {
        alert("R2 is not configured on the server. Use an image URL or configure R2 (see docs/R2_SETUP.md).");
        return;
      }
      const upload = await uploadProductImage({
        file: imageFile,
        product_category: form.product_category,
        subcategory: form.subcategory,
        design_number: designNumber || "",
        exclude_product_id: product?.id ?? null,
      });
      imageUrl = upload.image_url;
      imageObjectKey = upload.object_key;
      if (upload.design_number) designNumber = upload.design_number;
      if (upload.warnings?.length) {
        const extra = upload.warnings.join("\n");
        if (!window.confirm(`Upload notes:\n${extra}\n\nContinue saving product?`)) return;
      }
    }

    if (form.imageMode === "upload" && !imageFile && !imageUrl && !isEdit) {
      alert("Choose an image file to upload or switch to Image URL.");
      return;
    }

    await onSave({
      ...toPayload(form),
      design_number: designNumber,
      image_url: imageUrl,
      image_object_key: imageObjectKey,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5 shadow-card">
      <h3 className="font-display text-lg font-semibold text-brand-900">
        {product ? "Edit product" : "Add product"}
      </h3>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Taxonomy warnings</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <label className="mt-3 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span>I understand and want to continue</span>
          </label>
        </div>
      )}

      {taxonomyLoading && <p className="text-xs text-brand-400">Checking category / subcategory...</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <TaxonomySelect
          taxonomy={taxonomy}
          category={form.product_category}
          subcategory={form.subcategory}
          onCategoryChange={(v) => setForm((f) => ({ ...f, product_category: v }))}
          onSubcategoryChange={(v) => setForm((f) => ({ ...f, subcategory: v }))}
        />

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Design # <span className="font-normal normal-case text-brand-400">(optional — auto-generated)</span>
          </label>
          <input
            className={inputClass}
            value={form.design_number}
            onChange={(e) => setForm((f) => ({ ...f, design_number: e.target.value }))}
            placeholder="e.g. porcelain-marble-look-0001"
            disabled={isEdit}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Design name <span className="font-normal normal-case text-brand-400">(optional)</span>
          </label>
          <input
            className={inputClass}
            value={form.design_name}
            onChange={(e) => setForm((f) => ({ ...f, design_name: e.target.value }))}
            placeholder="Auto from filename or sequence"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Company name</label>
          <input
            className={inputClass}
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Dimensions (comma-separated)
          </label>
          <input
            className={inputClass}
            value={form.dimensions_options}
            onChange={(e) => setForm((f) => ({ ...f, dimensions_options: e.target.value }))}
            placeholder="12x24 in, 24x24 in"
            required
          />
        </div>

        <div className="sm:col-span-2 space-y-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Product image</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="imageMode"
                checked={form.imageMode === "upload"}
                onChange={() => setForm((f) => ({ ...f, imageMode: "upload" }))}
                disabled={!r2Configured}
              />
              Upload to R2
              {!r2Configured && <span className="text-xs text-brand-400">(not configured)</span>}
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="imageMode"
                checked={form.imageMode === "url"}
                onChange={() => setForm((f) => ({ ...f, imageMode: "url" }))}
              />
              Image URL (CDN or external)
            </label>
          </div>

          {form.imageMode === "upload" ? (
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-brand-500">
                Path: category/subcategory/design-number.webp (design # auto-assigned if empty)
              </p>
            </div>
          ) : (
            <div>
              <input
                className={inputClass}
                type="url"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="https://cdn.yourcompany.com/..."
              />
            </div>
          )}

          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-2 h-32 w-full max-w-xs rounded-lg object-cover ring-1 ring-brand-200"
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={saving || needsAcknowledgement}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
