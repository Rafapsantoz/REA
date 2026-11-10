import { SquareKanban } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeCustomizer } from "@/components/theme-customizer";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type Tab = "sign-in" | "sign-up";

const TAB_BASE =
  "inline-flex h-9 items-center justify-center rounded-md text-sm font-medium text-muted-foreground outline-none transition-all duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none cursor-pointer";
const TAB_ACTIVE = "bg-background font-semibold text-foreground shadow-xs";

export default function Login() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("sign-in");

  if (user) return <Navigate to="/board" replace />;

  const highlights = [
    t("login.pillDaily", "Foco Diário (Daily)"),
    t("login.pillWeekly", "Planejamento Semanal"),
    t("login.pillAi", "Triagem com IA"),
    t("login.pillPriorities", "Visão por Prioridades"),
  ];

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2 relative">
      {/* Top right language & theme controls */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeCustomizer />
      </div>

      {/* Left hero panel (Desktop) */}
      <section className="relative hidden overflow-hidden bg-gradient-brand p-10 text-brand-foreground md:flex md:flex-col md:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--brand-foreground))_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-foreground/15 shadow-xs">
            <SquareKanban className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Momentum</span>
        </div>

        <div className="relative flex flex-col gap-4">
          <h1 className="max-w-[20ch] text-3xl font-extrabold leading-tight tracking-[-0.02em]">
            {t("login.heroTitle", "Todas as suas demandas e chamados em um só lugar.")}
          </h1>
          <p className="max-w-[42ch] text-[15px] leading-relaxed text-brand-foreground/85">
            {t(
              "login.heroDesc",
              "Organize chamados de suporte, tarefas de trabalho e finanças lado a lado. Acelere sua rotina com suporte a IA e controle ágil."
            )}
          </p>
        </div>

        <div className="relative flex flex-wrap gap-2">
          {highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-brand-foreground/25 bg-brand-foreground/10 px-3.5 py-1 text-xs font-medium text-brand-foreground/90 backdrop-blur-xs"
            >
              {highlight}
            </span>
          ))}
        </div>
      </section>

      {/* Right panel: Form Card */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile brand header */}
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground">
              <SquareKanban className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Momentum
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-elevated">
            {/* Tabs for Entrar / Cadastrar Usuário */}
            <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted/70 p-1">
              <button
                type="button"
                aria-selected={tab === "sign-in"}
                className={cn(TAB_BASE, tab === "sign-in" && TAB_ACTIVE)}
                onClick={() => setTab("sign-in")}
              >
                {t("login.tabSignIn", "Entrar")}
              </button>
              <button
                type="button"
                aria-selected={tab === "sign-up"}
                className={cn(TAB_BASE, tab === "sign-up" && TAB_ACTIVE)}
                onClick={() => setTab("sign-up")}
              >
                {t("login.tabSignUp", "Cadastrar Usuário")}
              </button>
            </div>

            {tab === "sign-in" ? (
              <LoginForm onSwitchToRegister={() => setTab("sign-up")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setTab("sign-in")} />
            )}
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            {t(
              "login.footerNote",
              "Momentum Task · Gestão de demandas ágil com privacidade local."
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
