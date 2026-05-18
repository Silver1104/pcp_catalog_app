import { useCallback, useEffect, useState } from "react";
import { bulkUploadProductsBatched, checkTaxonomy, fetchTaxonomy } from "../../api/admin";
import TaxonomySelect from "./TaxonomySelect";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export default function BulkUploadForm({ onDone, onCancel, r2Configured }) {
  const [taxonomy, setTaxonomy] = useState({ categories: [], subcategories: [], subcategories_by_category: {} });
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [files, setFiles] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTaxonomy().then(setTaxonomy).catch(() => {});
  }, []);

  const runTaxonomyCheck = useCallback(async () => {
    if (!category.trim() || !subcategory.trim()) {
      setWarnings([]);
      setAcknowledged(false);
      return;
    }
    try {
      const result = await checkTaxonomy({ product_category: category, subcategory });
      setWarnings(result.warnings || []);
      setAcknowledged((result.warnings || []).length === 0);
    } catch {
      setWarnings([]);
    }
  }, [category, subcategory]);

  useEffect(() => {
    const t = setTimeout(runTaxonomyCheck, 400);
    return () => clearTimeout(t);
  }, [runTaxonomyCheck]);

  const needsAck = warnings.length > 0 && !acknowledged;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!r2Configured) {
      setError("R2 must be configured for bulk upload.");
      return;
    }
    if (!files.length) {
      setError("Select at least one image.");
      return;
    }
    if (needsAck) return;

    setSaving(true);
    setError("");
    setProgress(null);
    try {
      const result = await bulkUploadProductsBatched(
        {
          files,
          product_category: category,
          subcategory,
          company_name: companyName,
          dimensions_options: dimensions,
        },
        {
          onProgress: (p) => setProgress(p),
        }
      );
      if (result.warnings?.length) {
        alert(`Created ${result.count} products.\n\nNotes:\n${result.warnings.join("\n")}`);
      }
      onDone(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-brand-200 bg-white p-5 shadow-card">
      <div>
        <h3 className="font-display text-lg font-semibold text-brand-900">Bulk upload images</h3>
        <p className="mt-1 text-sm text-brand-500">
          Upload multiple images for one category + subcategory. Design numbers and names are assigned
          automatically in sequence (names like Subcategory-1, Subcategory-2). Large sets upload in
          batches of 8 to stay within server limits.
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Taxonomy warnings</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <label className="mt-3 flex cursor-pointer items-start gap-2">
            <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            <span>I understand and want to continue</span>
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <TaxonomySelect
          taxonomy={taxonomy}
          category={category}
          subcategory={subcategory}
          onCategoryChange={setCategory}
          onSubcategoryChange={setSubcategory}
        />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Company name</label>
          <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Dimensions (comma-separated, applied to all)
          </label>
          <input
            className={inputClass}
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder="12x24 in, 24x24 in"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Images (multiple)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-1.5 text-sm"
            required
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-brand-500">{files.length} file(s) selected</p>
          )}
        </div>
      </div>

      {progress && (
        <p className="text-sm text-brand-600">
          Uploading batch {progress.batch} of {progress.totalBatches} ({progress.filesInBatch} images)…
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving || needsAck}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? "Uploading..." : `Upload ${files.length || ""} image${files.length === 1 ? "" : "s"}`}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-brand-300 px-4 py-2 text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
