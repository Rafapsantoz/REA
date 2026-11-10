import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed";
import { EMAIL_PATTERN } from "@/lib/validation";

const loginSchema = z.object({
  email: z.string().trim().regex(EMAIL_PATTERN, "Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await login(values.email, values.password);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    navigate("/board", { replace: true });
  });

  const handleFillDemo = () => {
    form.setValue("email", DEMO_EMAIL, { shouldValidate: true });
    form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setFormError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">{t("login.email", "E-mail de Acesso")}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t("login.emailPlaceholder", "seu.email@exemplo.com")}
          className="h-9"
          {...form.register("email")}
        />
        {errors.email && (
          <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">{t("login.password", "Senha")}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder={t("login.passwordPlaceholder", "Sua senha segura")}
          className="h-9"
          {...form.register("password")}
        />
        {errors.password && (
          <p className="text-xs font-medium text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {formError && (
        <p className="flex items-start gap-1.5 text-[13px] font-medium leading-snug text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      )}

      <Button type="submit" className="h-9.5 w-full font-medium" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {t("login.submitSignIn", "Entrar no Sistema")}
      </Button>

      {onSwitchToRegister && (
        <p className="text-center text-xs text-muted-foreground">
          {t("login.noAccount", "Ainda não tem conta?")}{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary hover:underline"
          >
            {t("login.createAccountLink", "Cadastre-se")}
          </button>
        </p>
      )}

      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            {t("login.demoCardTitle", "Acesso Rápido (Conta Demo)")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleFillDemo}
          >
            {t("login.demoFillBtn", "Preencher dados")}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground font-mono">
          {DEMO_EMAIL} · {DEMO_PASSWORD}
        </p>
      </div>
    </form>
  );
}
