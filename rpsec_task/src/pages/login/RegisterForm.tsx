import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, Loader2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { EMAIL_PATTERN } from "@/lib/validation";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome (ao menos 2 caracteres)."),
  email: z.string().trim().regex(EMAIL_PATTERN, "Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerUser(values.name, values.email, values.password);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    navigate("/board", { replace: true });
  });

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-name">{t("login.fullName", "Nome Completo")}</Label>
        <Input
          id="register-name"
          autoComplete="name"
          placeholder={t("login.fullNamePlaceholder", "ex.: Rafael Santos")}
          className="h-9"
          {...form.register("name")}
        />
        {errors.name && (
          <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="register-email">{t("login.email", "E-mail de Acesso")}</Label>
        <Input
          id="register-email"
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
        <Label htmlFor="register-password">{t("login.password", "Senha")}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("login.passwordRegisterPlaceholder", "Mínimo de 6 caracteres")}
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

      <Button type="submit" className="h-9.5 w-full font-medium gap-2" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {t("login.submitSignUp", "Cadastrar e Acessar")}
      </Button>

      {onSwitchToLogin && (
        <p className="text-center text-xs text-muted-foreground">
          {t("login.hasAccount", "Já possui uma conta?")}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:underline"
          >
            {t("login.loginLink", "Fazer login")}
          </button>
        </p>
      )}

      <p className="text-2xs leading-relaxed text-muted-foreground text-center">
        {t(
          "login.registerNotice",
          "Sua conta será criada instantaneamente e você terá um quadro exclusivo para gerenciar seus chamados."
        )}
      </p>
    </form>
  );
}
