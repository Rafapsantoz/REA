import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed";
import { EMAIL_PATTERN } from "@/lib/validation";

const loginSchema = z.object({
  email: z.string().trim().regex(EMAIL_PATTERN, "Enter a valid email address."),
  password: z.string().min(6, "Passwords have at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
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

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-9"
          {...form.register("email")}
        />
        {errors.email && (
          <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
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

      <Button type="submit" className="h-9 w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>

      <div className="rounded-lg border border-border bg-muted/50 p-3">
        <p className="text-xs font-medium text-foreground">Try the demo account</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {DEMO_EMAIL} · {DEMO_PASSWORD}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 px-2 text-xs"
          onClick={() => {
            form.setValue("email", DEMO_EMAIL);
            form.setValue("password", DEMO_PASSWORD);
          }}
        >
          Fill demo credentials
        </Button>
      </div>
    </form>
  );
}
