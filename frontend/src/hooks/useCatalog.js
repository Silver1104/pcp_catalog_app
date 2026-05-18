import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchFilterOptions, fetchProducts } from "../api/products";

const EMPTY_FILTERS = {
  design_number: "",
  design_name: "",
  company_name: "",
  product_category: "",
  subcategory: "",
  dimension: "",
};

export function useCatalog() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    subcategories: [],
    subcategories_by_category: {},
    companies: [],
    dimensions: [],
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptionsError, setFilterOptionsError] = useState(null);

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v && String(v).trim())
      ),
    }),
    [search, filters]
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v && String(v).trim()),
    [filters]
  );

  const subcategoryOptions = useMemo(() => {
    if (filters.product_category && filterOptions.subcategories_by_category) {
      return filterOptions.subcategories_by_category[filters.product_category] || [];
    }
    return filterOptions.subcategories || [];
  }, [filters.product_category, filterOptions]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(queryParams);
      setProducts(data);
    } catch (e) {
      setError(e.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchFilterOptions()
      .then((data) => {
        setFilterOptions(data);
        setFilterOptionsError(null);
      })
      .catch((e) => setFilterOptionsError(e.message || "Could not load filters"));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadProducts, search]);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "product_category" && value !== prev.product_category) {
        next.subcategory = "";
      }
      return next;
    });
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  return {
    search,
    setSearch,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    filterOptions,
    subcategoryOptions,
    products,
    loading,
    error,
    filterOptionsError,
    resultCount: products.length,
  };
}
