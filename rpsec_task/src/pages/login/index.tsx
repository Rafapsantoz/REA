import { SquareKanban } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

type Tab = "sign-in" | "sign-up";

const TAB_BASE =
  "inline-flex h-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";
const TAB_ACTIVE = "bg-card font-semibold text-foreground shadow-card";

const HIGHLIGHTS = [
  "Daily focus",
  "Weekly plan",
  "Monthly review",
  "Long-term goals",
];

const Login = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("sign-in");

  if (user) return <Navigate to="/board" replace />;

  return (
    <div className="grid min-h-dvh grid-cols-1 md:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-brand p-10 text-brand-foreground md:flex md:flex-col md:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--brand-foreground))_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-foreground/15">
            <SquareKanban className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-[-0.01em]">Momentum</span>
        </div>

        <div className="relative flex flex-col gap-4">
          <h1 className="max-w-[20ch] text-2xl font-bold leading-tight tracking-[-0.02em]">
            Every demand, on one board.
          </h1>
          <p className="max-w-[36ch] text-[15px] leading-relaxed text-brand-foreground/80">
            Keep work, personal and financial demands side by side, then move them from
            pending to done — daily, weekly, monthly, or as long-term goals.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-2">
          {HIGHLIGHTS.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-brand-foreground/25 px-3 py-1 text-xs font-medium text-brand-foreground/90"
            >
              {highlight}
            </span>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-brand text-brand-foreground">
              <SquareKanban className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-[-0.01em] text-foreground">
              Momentum
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-elevated">
            <div className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                aria-selected={tab === "sign-in"}
                className={cn(TAB_BASE, tab === "sign-in" && TAB_ACTIVE)}
                onClick={() => setTab("sign-in")}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-selected={tab === "sign-up"}
                className={cn(TAB_BASE, tab === "sign-up" && TAB_ACTIVE)}
                onClick={() => setTab("sign-up")}
              >
                Create account
              </button>
            </div>

            {tab === "sign-in" ? <LoginForm /> : <RegisterForm />}
          </div>

          <p className="mt-4 text-center text-2xs leading-relaxed text-muted-foreground">
            This demo keeps your demands in this browser only.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
