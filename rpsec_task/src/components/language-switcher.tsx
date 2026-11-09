import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "pt-BR").toLowerCase();
  const isPt = current.startsWith("pt");

  const toggleLanguage = (lang: "pt-BR" | "en") => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-border bg-muted/50 p-0.5 text-xs font-medium",
        className,
      )}
      role="group"
      aria-label="Idioma / Language"
    >
      <button
        type="button"
        onClick={() => toggleLanguage("pt-BR")}
        title="Português (Brasil)"
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-2xs transition-all cursor-pointer",
          isPt
            ? "bg-background text-foreground shadow-xs font-bold text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="text-xs">🇧🇷</span>
        <span>PT</span>
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage("en")}
        title="English"
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-2xs transition-all cursor-pointer",
          !isPt
            ? "bg-background text-foreground shadow-xs font-bold text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span className="text-xs">🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
