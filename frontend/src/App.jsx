import { Route, Routes } from "react-router-dom";
import { BrandingProvider } from "./context/BrandingContext";
import AdminPage from "./pages/AdminPage";
import CatalogPage from "./pages/CatalogPage";

export default function App() {
  return (
    <BrandingProvider>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrandingProvider>
  );
}
