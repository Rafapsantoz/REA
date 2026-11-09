import { useState, useEffect } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeColor = "violet" | "blue" | "emerald" | "amber" | "rose";

const THEME_MODE_KEY = "doapp.theme_mode.v1";
const THEME_COLOR_KEY = "doapp.theme_color.v1";

export interface ColorOption {
  id: ThemeColor;
  label: string;
  previewClass: string;
  dotColor: string;
}

export const THEME_COLORS: ColorOption[] = [
  {
    id: "violet",
    label: "Violeta (RPsecti)",
    previewClass: "bg-purple-600",
    dotColor: "#7c3aed",
  },
  {
    id: "blue",
    label: "Azul Oceano",
    previewClass: "bg-blue-600",
    dotColor: "#2563eb",
  },
  {
    id: "emerald",
    label: "Verde Esmeralda",
    previewClass: "bg-emerald-600",
    dotColor: "#059669",
  },
  {
    id: "amber",
    label: "Âmbar / Laranja",
    previewClass: "bg-amber-600",
    dotColor: "#d97706",
  },
  {
    id: "rose",
    label: "Carmesim / Rubi",
    previewClass: "bg-rose-600",
    dotColor: "#e11d48",
  },
];

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
  return stored && ["light", "dark", "system"].includes(stored) ? stored : "light";
}

export function getStoredThemeColor(): ThemeColor {
  if (typeof window === "undefined") return "violet";
  const stored = localStorage.getItem(THEME_COLOR_KEY) as ThemeColor | null;
  return stored && ["violet", "blue", "emerald", "amber", "rose"].includes(stored)
    ? stored
    : "violet";
}

export function applyTheme(mode: ThemeMode, color: ThemeColor): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // 1. Aplica Modo Escuro / Claro
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // 2. Aplica Cor de Destaque
  const allColorClasses = ["theme-violet", "theme-blue", "theme-emerald", "theme-amber", "theme-rose"];
  allColorClasses.forEach((cls) => root.classList.remove(cls));

  if (color !== "violet") {
    root.classList.add(`theme-${color}`);
  }
}

export function useThemeCustomizer() {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [color, setColorState] = useState<ThemeColor>(getStoredThemeColor);

  useEffect(() => {
    applyTheme(mode, color);

    // Listener para quando o modo for "system" e o SO alterar
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system", color);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [mode, color]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
    applyTheme(newMode, color);
  };

  const setColor = (newColor: ThemeColor) => {
    setColorState(newColor);
    localStorage.setItem(THEME_COLOR_KEY, newColor);
    applyTheme(mode, newColor);
  };

  return {
    mode,
    color,
    setMode,
    setColor,
    colors: THEME_COLORS,
  };
}
