import { useCallback, useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  updateProduct,
} from "../../api/admin";
import BulkUploadForm from "./BulkUploadForm";
import ProductForm from "./ProductForm";

export default function ProductManager({ r2Configured = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await fetchAdminProducts());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (payload) => {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setMode(null);
      setEditing(null);
      await load();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.design_name}" (${product.design_number})? The R2 image file will also be removed.`)) return;
    setError("");
    try {
      await deleteProduct(product.id);
      if (editing?.id === product.id) {
        setEditing(null);
        setMode(null);
      }
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const closeForm = () => {
    setMode(null);
    setEditing(null);
  };

  const storageLabel = (storage) => {
    switch (storage) {
      case "r2":
        return { text: "R2", className: "bg-green-100 text-green-800" };
      case "r2_linked":
        return { text: "R2 URL only", className: "bg-amber-100 text-amber-900" };
      case "external":
        return { text: "External", className: "bg-brand-100 text-brand-600" };
      default:
        return { text: "No image", className: "bg-brand-50 text-brand-400" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-brand-900">Products</h2>
          <p className="text-sm text-brand-500">Add one product, bulk-upload images, or edit the list below.</p>
        </div>
        {!mode && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setMode("single");
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              + Add product
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setMode("bulk");
              }}
              disabled={!r2Configured}
              className="rounded-lg border border-brand-400 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              title={r2Configured ? "" : "Configure R2 to enable bulk upload"}
            >
              Bulk upload images
            </button>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {mode === "single" && (
        <ProductForm
          key={editing?.id ?? "new"}
          product={editing}
          saving={saving}
          r2Configured={r2Configured}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      {mode === "bulk" && (
        <BulkUploadForm
          r2Configured={r2Configured}
          onDone={() => {
            closeForm();
            load();
          }}
          onCancel={closeForm}
        />
      )}

      {loading ? (
        <p className="text-sm text-brand-500">Loading products...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-200 bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-brand-100 bg-brand-50 text-xs uppercase tracking-wide text-brand-500">
              <tr>
                <th className="px-4 py-3">Design #</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subcategory</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{p.design_number}</td>
                  <td className="px-4 py-3">{p.design_name}</td>
                  <td className="px-4 py-3 text-brand-600">{p.company_name}</td>
                  <td className="px-4 py-3">{p.product_category}</td>
                  <td className="px-4 py-3">{p.subcategory}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const s = storageLabel(p.image_storage);
                      return (
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${s.className}`}
                          title={p.image_object_key || p.image_url || ""}
                        >
                          {s.text}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p);
                        setMode("single");
                      }}
                      className="mr-2 text-brand-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="p-6 text-center text-sm text-brand-500">No products yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
