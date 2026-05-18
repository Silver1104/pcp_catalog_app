export const DEFAULT_THEME = {
  brand: {
    50: "#f4f7f6",
    100: "#e3ebe8",
    200: "#c5d6d0",
    300: "#9bb8ae",
    400: "#6f9588",
    500: "#4f7769",
    600: "#3d5f54",
    700: "#334d45",
    800: "#2b403a",
    900: "#253632",
    950: "#121f1c",
  },
  accent: {
    DEFAULT: "#c9a227",
    light: "#e8c96a",
    dark: "#9a7b1a",
  },
};

export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.brand || {}).forEach(([shade, hex]) => {
    root.style.setProperty(`--brand-${shade}`, hex);
  });
  const accent = theme.accent || {};
  if (accent.DEFAULT) root.style.setProperty("--accent", accent.DEFAULT);
  if (accent.light) root.style.setProperty("--accent-light", accent.light);
  if (accent.dark) root.style.setProperty("--accent-dark", accent.dark);
}
