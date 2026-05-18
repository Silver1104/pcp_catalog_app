import { createContext, useContext, useEffect, useState } from "react";
import { fetchSettings } from "../api/settings";
import { applyTheme, DEFAULT_THEME } from "../utils/theme";

const BrandingContext = createContext(null);

const FALLBACK = {
  company_name: "Your Tile Company",
  tagline: "Wholesale & Manufacturing",
  catalog_title: "Design Catalog",
  footer_text: "Tile catalog · Search and filter to find your design",
  logo_url: null,
  theme: DEFAULT_THEME,
};

export function BrandingProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      applyTheme(data.theme);
    } catch {
      applyTheme(FALLBACK.theme);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <BrandingContext.Provider value={{ settings, loading, reloadSettings: load, setSettings }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within BrandingProvider");
  return ctx;
}
