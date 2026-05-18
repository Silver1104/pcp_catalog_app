import { useMemo, useState } from "react";

const selectClass =
  "mt-1.5 w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

const NEW = "__new__";

export default function TaxonomySelect({
  taxonomy,
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
  required = true,
}) {
  const [newCategory, setNewCategory] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState(false);

  const categories = taxonomy?.categories ?? [];
  const subcategoriesByCategory = taxonomy?.subcategories_by_category ?? {};

  const subOptions = useMemo(() => {
    if (newCategory || !category || category === NEW) {
      return taxonomy?.subcategories ?? [];
    }
    return subcategoriesByCategory[category] ?? [];
  }, [category, newCategory, subcategoriesByCategory, taxonomy]);

  const handleCategorySelect = (value) => {
    if (value === NEW) {
      setNewCategory(true);
      onCategoryChange("");
      onSubcategoryChange("");
      setNewSubcategory(true);
      return;
    }
    setNewCategory(false);
    onCategoryChange(value);
    onSubcategoryChange("");
    setNewSubcategory(false);
  };

  const handleSubcategorySelect = (value) => {
    if (value === NEW) {
      setNewSubcategory(true);
      onSubcategoryChange("");
      return;
    }
    setNewSubcategory(false);
    onSubcategoryChange(value);
  };

  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Category</label>
        {!newCategory ? (
          <select
            className={selectClass}
            value={category || ""}
            onChange={(e) => handleCategorySelect(e.target.value)}
            required={required}
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW}>+ Add new category</option>
          </select>
        ) : (
          <input
            className={selectClass}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            placeholder="New category name"
            required={required}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-brand-500">Subcategory</label>
        {!newSubcategory ? (
          <select
            className={selectClass}
            value={subcategory || ""}
            onChange={(e) => handleSubcategorySelect(e.target.value)}
            required={required}
            disabled={!category && !newCategory}
          >
            <option value="">Select subcategory...</option>
            {subOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={NEW}>+ Add new subcategory</option>
          </select>
        ) : (
          <input
            className={selectClass}
            value={subcategory}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            placeholder="New subcategory name"
            required={required}
          />
        )}
      </div>
    </>
  );
}
