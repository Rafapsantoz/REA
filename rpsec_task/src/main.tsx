import { createRoot } from "react-dom/client";
import "./i18n/config";
import { bootstrapGeneratedSiteAnalytics } from "./analytics.ts";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getStoredThemeMode, getStoredThemeColor } from "./lib/theme";

// Inicializa o tema salvo imediatamente
applyTheme(getStoredThemeMode(), getStoredThemeColor());

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found.");
}

bootstrapGeneratedSiteAnalytics();

createRoot(container).render(<App />);
