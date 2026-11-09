import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function BrazilFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 504"
      className={cn("rounded-[2px] overflow-hidden shrink-0 border border-black/10", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="720" height="504" fill="#009b3a" />
      <polygon points="360,44 676,252 360,460 44,252" fill="#fedf00" />
      <circle cx="360" cy="252" r="126" fill="#002776" />
      <path
        d="M234,260 C264,215 370,190 486,244"
        stroke="#ffffff"
        strokeWidth="19"
        fill="none"
      />
    </svg>
  );
}

export function UsaFlag({ className = "w-4 h-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 741 390"
      className={cn("rounded-[2px] overflow-hidden shrink-0 border border-black/10", className)}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="741" height="390" fill="#b22234" />
      <path
        d="M0,30h741M0,90h741M0,150h741M0,210h741M0,270h741M0,330h741"
        stroke="#ffffff"
        strokeWidth="30"
      />
      <rect width="296" height="210" fill="#3c3b6e" />
      <g fill="#ffffff">
        <circle cx="30" cy="25" r="9" />
        <circle cx="85" cy="25" r="9" />
        <circle cx="140" cy="25" r="9" />
        <circle cx="195" cy="25" r="9" />
        <circle cx="250" cy="25" r="9" />

        <circle cx="57" cy="55" r="9" />
        <circle cx="112" cy="55" r="9" />
        <circle cx="167" cy="55" r="9" />
        <circle cx="222" cy="55" r="9" />

        <circle cx="30" cy="85" r="9" />
        <circle cx="85" cy="85" r="9" />
        <circle cx="140" cy="85" r="9" />
        <circle cx="195" cy="85" r="9" />
        <circle cx="250" cy="85" r="9" />

        <circle cx="57" cy="115" r="9" />
        <circle cx="112" cy="115" r="9" />
        <circle cx="167" cy="115" r="9" />
        <circle cx="222" cy="115" r="9" />

        <circle cx="30" cy="145" r="9" />
        <circle cx="85" cy="145" r="9" />
        <circle cx="140" cy="145" r="9" />
        <circle cx="195" cy="145" r="9" />
        <circle cx="250" cy="145" r="9" />

        <circle cx="57" cy="175" r="9" />
        <circle cx="112" cy="175" r="9" />
        <circle cx="167" cy="175" r="9" />
        <circle cx="222" cy="175" r="9" />
      </g>
    </svg>
  );
}

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
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs transition-all cursor-pointer",
          isPt
            ? "bg-background text-foreground shadow-xs font-bold text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <BrazilFlag className="w-4 h-2.5" />
        <span>PT</span>
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage("en")}
        title="English (United States)"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs transition-all cursor-pointer",
          !isPt
            ? "bg-background text-foreground shadow-xs font-bold text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <UsaFlag className="w-4 h-2.5" />
        <span>US</span>
      </button>
    </div>
  );
}
